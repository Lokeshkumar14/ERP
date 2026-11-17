from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import YarnLotResponse
from app.core.utils import log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/yarn-inventory", tags=["Yarn Inventory & Lot Tracking"])

@router.get("/lots", response_model=List[YarnLotResponse])
async def list_yarn_lots(supplier_id: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("yarn_lots")
    query = {"supplier_id": supplier_id} if supplier_id else {}
    cursor = await col.find(query)
    return await cursor.to_list()

@router.get("/summary")
async def get_yarn_stock_summary(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("yarn_lots")
    lots = await (await col.find()).to_list()

    aggregates: Dict[str, Dict[str, Any]] = {}
    total_received = 0.0
    total_available = 0.0
    total_reserved = 0.0
    total_issued = 0.0

    for lot in lots:
        key = f"{lot.get('yarn_name')} - {lot.get('count')}"
        if key not in aggregates:
            aggregates[key] = {
                "yarn_name": lot.get("yarn_name"),
                "count": lot.get("count"),
                "received_qty": 0.0,
                "available_qty": 0.0,
                "reserved_qty": 0.0,
                "issued_qty": 0.0,
                "lots_count": 0,
                "unit": "KG"
            }
        rec = lot.get("quantity_received", 0.0)
        avail = lot.get("current_available_qty", 0.0)
        res = lot.get("reserved_qty", 0.0)
        iss = lot.get("issued_qty", 0.0)

        aggregates[key]["received_qty"] += rec
        aggregates[key]["available_qty"] += avail
        aggregates[key]["reserved_qty"] += res
        aggregates[key]["issued_qty"] += iss
        aggregates[key]["lots_count"] += 1

        total_received += rec
        total_available += avail
        total_reserved += res
        total_issued += iss

    return {
        "summary": {
            "total_received_kg": round(total_received, 2),
            "total_available_kg": round(total_available, 2),
            "total_reserved_kg": round(total_reserved, 2),
            "total_issued_kg": round(total_issued, 2)
        },
        "items": list(aggregates.values()),
        "lots": lots
    }

@router.post("/reserve")
async def reserve_yarn_stock(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    lot_number = payload.get("lot_number")
    qty = float(payload.get("quantity", 0.0))
    if qty <= 0:
        raise HTTPException(status_code=400, detail="Invalid quantity to reserve")

    db = get_database()
    col = db.get_collection("yarn_lots")
    lot = await col.find_one({"lot_number": lot_number})
    if not lot:
        raise HTTPException(status_code=404, detail="Yarn lot not found")

    avail = lot.get("current_available_qty", 0.0)
    if avail < qty:
        raise HTTPException(status_code=400, detail=f"Insufficient available yarn in lot {lot_number}. Available: {avail} KG")

    await col.update_one(
        {"_id": lot["_id"]},
        {
            "$inc": {
                "current_available_qty": -qty,
                "reserved_qty": qty
            }
        }
    )
    await log_audit("reserve_yarn", "yarn_inventory", lot["_id"], f"Reserved {qty} KG of lot {lot_number}", user=current_user.get("name"))
    return {"message": f"Successfully reserved {qty} KG of lot {lot_number}"}

@router.post("/adjust")
async def adjust_stock(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    lot_number = payload.get("lot_number")
    adjusted_qty = float(payload.get("quantity", 0.0))
    reason = payload.get("reason", "Physical verification adjustment")

    db = get_database()
    col = db.get_collection("yarn_lots")
    lot = await col.find_one({"lot_number": lot_number})
    if not lot:
        raise HTTPException(status_code=404, detail="Yarn lot not found")

    old_qty = lot.get("current_available_qty", 0.0)
    await col.update_one({"_id": lot["_id"]}, {"$set": {"current_available_qty": adjusted_qty}})
    
    await log_audit("stock_adjustment", "yarn_inventory", lot["_id"], f"Adjusted lot {lot_number} from {old_qty} to {adjusted_qty} KG. Reason: {reason}", user=current_user.get("name"))
    return {"message": "Stock adjusted successfully", "new_quantity": adjusted_qty}
