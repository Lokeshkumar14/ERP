from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from app.core.database import get_database
from app.models.schemas import PartyCreate, PartyResponse
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/parties", tags=["Suppliers & Job Workers"])

@router.get("", response_model=List[PartyResponse])
async def list_parties(party_type: Optional[str] = None, service: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("parties")
    query = {}
    if party_type:
        query["party_types"] = {"$in": [party_type]}
    if service:
        query["services"] = {"$in": [service]}
    
    cursor = await col.find(query)
    return await cursor.to_list()

@router.post("", response_model=PartyResponse)
async def create_party(party_in: PartyCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("parties")

    code = (party_in.party_code or "").strip()
    prefix = "JW-" if "job_worker" in party_in.party_types else "SUP-"
    if not code:
        code = await get_next_sequence("party_code", prefix=prefix)
    else:
        existing = await col.find_one({"party_code": code})
        if existing:
            code = await get_next_sequence("party_code", prefix=prefix)

    doc = party_in.model_dump()
    doc["party_code"] = code
    doc["current_balance"] = party_in.opening_balance
    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_audit("create", "parties", res.inserted_id, f"Created party {doc['name']} ({code})", user=current_user.get("name"))
    return doc

@router.get("/{party_id}", response_model=PartyResponse)
async def get_party(party_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    doc = await db.get_collection("parties").find_one({"_id": party_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Party not found")
    return doc

@router.put("/{party_id}", response_model=PartyResponse)
async def update_party(party_id: str, party_in: PartyCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("parties")
    existing = await col.find_one({"_id": party_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Party not found")

    update_data = party_in.model_dump(exclude_unset=True)
    await col.update_one({"_id": party_id}, {"$set": update_data})
    updated = await col.find_one({"_id": party_id})
    await log_audit("update", "parties", party_id, f"Updated party {party_in.name}", user=current_user.get("name"))
    return updated
