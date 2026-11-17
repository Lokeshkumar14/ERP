from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import FabricRollCreate, FabricRollResponse, FabricRollSplit, FabricRollMerge
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/rolls", tags=["Fabric Roll Management"])

@router.get("", response_model=List[FabricRollResponse])
async def list_fabric_rolls(
    batch_id: Optional[str] = None,
    quality_status: Optional[str] = None,
    process: Optional[str] = None,
    is_delivered: Optional[bool] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = get_database()
    col = db.get_collection("fabric_rolls")
    query = {}
    if batch_id:
        query["batch_id"] = batch_id
    if quality_status:
        query["quality_status"] = quality_status
    if process:
        query["current_process"] = process
    if is_delivered is not None:
        query["is_delivered"] = is_delivered

    cursor = await col.find(query)
    rolls = await cursor.to_list()
    rolls.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return rolls

@router.post("", response_model=FabricRollResponse)
async def create_fabric_roll(roll_in: FabricRollCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("fabric_rolls")

    roll_num = roll_in.roll_number
    if not roll_num:
        roll_num = await get_next_sequence("roll_number", prefix="ROLL-")

    doc = roll_in.model_dump()
    doc["roll_number"] = roll_num
    doc["parent_roll_ids"] = []
    doc["child_roll_ids"] = []
    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id

    await log_audit("create", "fabric_rolls", res.inserted_id, f"Created Roll {roll_num} ({roll_in.current_weight} KG, {roll_in.fabric_name})", user=current_user.get("name"))
    return doc

@router.get("/{roll_id}", response_model=FabricRollResponse)
async def get_fabric_roll(roll_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("fabric_rolls")
    doc = await col.find_one({"_id": roll_id})
    if not doc:
        doc = await col.find_one({"roll_number": roll_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Fabric roll not found")
    return doc

@router.post("/split")
async def split_fabric_roll(payload: FabricRollSplit, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("fabric_rolls")

    parent = await col.find_one({"_id": payload.roll_id})
    if not parent:
        raise HTTPException(status_code=404, detail="Parent roll not found")

    parent_weight = parent.get("current_weight", 0.0)
    split_total = sum(payload.split_weights)
    if abs(split_total - parent_weight) > 0.5:
        raise HTTPException(
            status_code=400,
            detail=f"Total split weights ({split_total} KG) do not match parent roll weight ({parent_weight} KG) within tolerance."
        )

    child_roll_ids = []
    child_rolls = []

    for idx, weight in enumerate(payload.split_weights):
        child_num = await get_next_sequence("roll_number", prefix="ROLL-")
        child_doc = {
            "roll_number": child_num,
            "batch_id": parent.get("batch_id"),
            "batch_number": parent.get("batch_number"),
            "sales_order_id": parent.get("sales_order_id"),
            "sales_order_number": parent.get("sales_order_number"),
            "fabric_name": parent.get("fabric_name"),
            "composition": parent.get("composition"),
            "gsm": parent.get("gsm"),
            "width": parent.get("width"),
            "colour": parent.get("colour"),
            "original_weight": weight,
            "current_weight": weight,
            "current_process": parent.get("current_process"),
            "current_location": parent.get("current_location"),
            "quality_status": parent.get("quality_status"),
            "is_reserved": parent.get("is_reserved", False),
            "is_delivered": False,
            "parent_roll_ids": [payload.roll_id],
            "child_roll_ids": []
        }
        res = await col.insert_one(child_doc)
        child_doc["_id"] = res.inserted_id
        child_roll_ids.append(res.inserted_id)
        child_rolls.append(child_doc)

    # Update parent roll status (zeroed out or marked split)
    await col.update_one(
        {"_id": payload.roll_id},
        {
            "$set": {
                "current_weight": 0.0,
                "status": "split",
                "child_roll_ids": child_roll_ids
            }
        }
    )

    await log_audit("split", "fabric_rolls", payload.roll_id, f"Split parent roll {parent.get('roll_number')} into {len(child_rolls)} children", user=current_user.get("name"))
    return {
        "message": f"Successfully split roll {parent.get('roll_number')} into {len(child_rolls)} pieces",
        "parent_id": payload.roll_id,
        "child_rolls": child_rolls
    }

@router.post("/merge")
async def merge_fabric_rolls(payload: FabricRollMerge, current_user: Dict[str, Any] = Depends(get_current_user)):
    if len(payload.roll_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 rolls required for merging")

    db = get_database()
    col = db.get_collection("fabric_rolls")
    rolls_to_merge = []
    total_weight = 0.0

    for rid in payload.roll_ids:
        r = await col.find_one({"_id": rid})
        if not r:
            raise HTTPException(status_code=404, detail=f"Roll {rid} not found")
        rolls_to_merge.append(r)
        total_weight += r.get("current_weight", 0.0)

    first = rolls_to_merge[0]
    merged_num = await get_next_sequence("roll_number", prefix="ROLL-")
    merged_doc = {
        "roll_number": merged_num,
        "batch_id": first.get("batch_id"),
        "batch_number": first.get("batch_number"),
        "sales_order_id": first.get("sales_order_id"),
        "fabric_name": first.get("fabric_name"),
        "composition": first.get("composition"),
        "gsm": first.get("gsm"),
        "width": first.get("width"),
        "colour": first.get("colour"),
        "original_weight": round(total_weight, 2),
        "current_weight": round(total_weight, 2),
        "current_process": first.get("current_process"),
        "current_location": first.get("current_location"),
        "quality_status": "approved",
        "is_reserved": False,
        "is_delivered": False,
        "parent_roll_ids": payload.roll_ids,
        "child_roll_ids": []
    }
    m_res = await col.insert_one(merged_doc)
    merged_doc["_id"] = m_res.inserted_id

    # Mark input rolls as merged
    for rid in payload.roll_ids:
        await col.update_one(
            {"_id": rid},
            {
                "$set": {
                    "current_weight": 0.0,
                    "status": "merged",
                    "child_roll_ids": [m_res.inserted_id]
                }
            }
        )

    await log_audit("merge", "fabric_rolls", m_res.inserted_id, f"Merged rolls {[r.get('roll_number') for r in rolls_to_merge]} into {merged_num}", user=current_user.get("name"))
    return {
        "message": f"Successfully merged {len(rolls_to_merge)} rolls into {merged_num}",
        "merged_roll": merged_doc
    }

@router.post("/{roll_id}/adjust-weight")
async def adjust_roll_weight(roll_id: str, payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    new_weight = float(payload.get("new_weight", 0.0))
    reason = payload.get("reason", "Sample cutting / trim deduction")

    db = get_database()
    col = db.get_collection("fabric_rolls")
    roll = await col.find_one({"_id": roll_id})
    if not roll:
        raise HTTPException(status_code=404, detail="Fabric roll not found")

    old_weight = roll.get("current_weight", 0.0)
    await col.update_one(
        {"_id": roll_id},
        {"$set": {"current_weight": new_weight, "weight_adjusted_at": datetime.utcnow().isoformat()}}
    )
    await log_audit("roll_weight_adjustment", "fabric_rolls", roll_id, f"Roll {roll.get('roll_number')} weight changed from {old_weight} KG to {new_weight} KG. Reason: {reason}", user=current_user.get("name"))
    return {"message": "Roll weight adjusted successfully", "new_weight": new_weight}

@router.post("/{roll_id}/allocate")
async def allocate_roll_to_order(roll_id: str, payload: Dict[str, str], current_user: Dict[str, Any] = Depends(get_current_user)):
    sales_order_id = payload.get("sales_order_id")
    sales_order_number = payload.get("sales_order_number")

    db = get_database()
    col = db.get_collection("fabric_rolls")
    roll = await col.find_one({"_id": roll_id})
    if not roll:
        raise HTTPException(status_code=404, detail="Roll not found")

    await col.update_one(
        {"_id": roll_id},
        {"$set": {"is_reserved": True, "sales_order_id": sales_order_id, "sales_order_number": sales_order_number}}
    )
    await log_audit("allocate_roll", "fabric_rolls", roll_id, f"Allocated roll {roll.get('roll_number')} to sales order {sales_order_number}", user=current_user.get("name"))
    return {"message": f"Roll {roll.get('roll_number')} reserved for order {sales_order_number}"}

