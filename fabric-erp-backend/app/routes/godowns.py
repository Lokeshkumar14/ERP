from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import GodownCreate
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/godowns", tags=["Godown & Warehouse Management"])

@router.get("")
async def list_godowns(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("godowns")
    cursor = await col.find()
    godowns = await cursor.to_list()
    
    # Calculate stock per godown
    rolls = await (await db.get_collection("fabric_rolls").find({"is_delivered": False})).to_list()
    lots = await (await db.get_collection("yarn_lots").find()).to_list()

    for g in godowns:
        g_name = g.get("name")
        g_rolls = [r for r in rolls if r.get("current_location") == g_name]
        g_lots = [l for l in lots if l.get("godown_name") == g_name]
        
        fabric_weight = sum(r.get("current_weight", 0.0) for r in g_rolls)
        yarn_weight = sum(l.get("current_available_qty", 0.0) for l in g_lots)
        
        g["current_fabric_stock_kg"] = round(fabric_weight, 2)
        g["current_yarn_stock_kg"] = round(yarn_weight, 2)
        g["total_stock_kg"] = round(fabric_weight + yarn_weight, 2)
        g["rolls_count"] = len(g_rolls)

    return godowns

@router.post("")
async def create_godown(godown_in: GodownCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("godowns")

    code = godown_in.godown_code
    if not code:
        code = await get_next_sequence("godown_code", prefix="GDN-")

    doc = godown_in.model_dump()
    doc["godown_code"] = code
    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id

    await log_audit("create", "godowns", res.inserted_id, f"Created Godown {doc['name']} ({code})", user=current_user.get("name"))
    return doc

@router.post("/transfer")
async def transfer_stock(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    from_godown = payload.get("from_godown")
    to_godown = payload.get("to_godown")
    roll_ids = payload.get("roll_ids", [])

    if not from_godown or not to_godown or not roll_ids:
        raise HTTPException(status_code=400, detail="Source godown, destination godown, and roll IDs are required")

    db = get_database()
    rolls_col = db.get_collection("fabric_rolls")
    dc_col = db.get_collection("delivery_challans")

    total_weight = 0.0
    roll_numbers = []

    for rid in roll_ids:
        r = await rolls_col.find_one({"_id": rid})
        if r:
            total_weight += r.get("current_weight", 0.0)
            roll_numbers.append(r.get("roll_number"))
            await rolls_col.update_one(
                {"_id": rid},
                {"$set": {"current_location": to_godown}}
            )

    # Generate Godown Transfer DC
    dc_num = await get_next_sequence("dc_number", prefix="DC-")
    dc_doc = {
        "dc_number": dc_num,
        "dc_type": "godown_transfer",
        "dc_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "from_location": from_godown,
        "to_location": to_godown,
        "item_description": f"Internal stock transfer of {len(roll_ids)} rolls",
        "roll_numbers": roll_numbers,
        "quantity": round(total_weight, 2),
        "unit": "KG",
        "prepared_by": current_user.get("name", "Godown In-charge"),
        "status": "completed"
    }
    await dc_col.insert_one(dc_doc)

    await log_audit("stock_transfer", "godowns", dc_num, f"Transferred {len(roll_ids)} rolls ({total_weight} KG) from {from_godown} to {to_godown}", user=current_user.get("name"))
    return {
        "message": f"Successfully transferred {len(roll_ids)} rolls to {to_godown}",
        "dc_number": dc_num,
        "transferred_weight": round(total_weight, 2)
    }
