from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import DeliveryChallanCreate
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/delivery-challans", tags=["Delivery Challan Management"])

@router.get("")
async def list_delivery_challans(dc_type: Optional[str] = None, party_id: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("delivery_challans")
    query = {}
    if dc_type:
        query["dc_type"] = dc_type
    if party_id:
        query["party_id"] = party_id
    cursor = await col.find(query)
    dcs = await cursor.to_list()
    dcs.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return dcs

@router.post("")
async def create_delivery_challan(dc_in: DeliveryChallanCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("delivery_challans")

    dc_num = dc_in.dc_number
    if not dc_num:
        dc_num = await get_next_sequence("dc_number", prefix="DC-")

    doc = dc_in.model_dump()
    doc["dc_number"] = dc_num
    doc["dc_date"] = doc.get("dc_date") or datetime.utcnow().strftime("%Y-%m-%d")
    doc["status"] = "dispatched"
    doc["prepared_by"] = current_user.get("name", "Logistics Team")

    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id

    await log_audit("create", "delivery_challans", res.inserted_id, f"Created DC {dc_num} ({dc_in.dc_type}) for {dc_in.quantity} {dc_in.unit}", user=current_user.get("name"))
    return doc

@router.get("/{dc_id}")
async def get_delivery_challan(dc_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("delivery_challans")
    doc = await col.find_one({"_id": dc_id})
    if not doc:
        doc = await col.find_one({"dc_number": dc_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Delivery Challan not found")
    return doc

@router.post("/{dc_id}/cancel")
async def cancel_delivery_challan(dc_id: str, payload: Dict[str, str], current_user: Dict[str, Any] = Depends(get_current_user)):
    reason = payload.get("reason", "Cancelled by user")
    db = get_database()
    col = db.get_collection("delivery_challans")
    dc = await col.find_one({"_id": dc_id})
    if not dc:
        raise HTTPException(status_code=404, detail="Delivery Challan not found")

    await col.update_one({"_id": dc_id}, {"$set": {"status": "cancelled", "cancellation_reason": reason}})
    await log_audit("cancel", "delivery_challans", dc_id, f"Cancelled DC {dc.get('dc_number')}. Reason: {reason}", user=current_user.get("name"))
    return {"message": "Delivery Challan cancelled successfully"}
