from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from app.core.database import get_database
from app.routes.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/inventory")
async def inventory_report(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    yarn_lots = await (await db.get_collection("yarn_lots").find()).to_list()
    fabric_rolls = await (await db.get_collection("fabric_rolls").find({"is_delivered": False})).to_list()

    fabric_by_type: Dict[str, float] = {}
    fabric_by_color: Dict[str, float] = {}
    fabric_by_godown: Dict[str, float] = {}

    for r in fabric_rolls:
        fname = r.get("fabric_name", "General")
        col = r.get("colour", "General")
        loc = r.get("current_location", "Main Godown")
        wt = r.get("current_weight", 0.0)

        fabric_by_type[fname] = round(fabric_by_type.get(fname, 0.0) + wt, 2)
        fabric_by_color[col] = round(fabric_by_color.get(col, 0.0) + wt, 2)
        fabric_by_godown[loc] = round(fabric_by_godown.get(loc, 0.0) + wt, 2)

    return {
        "yarn_lots": yarn_lots,
        "fabric_rolls_count": len(fabric_rolls),
        "fabric_by_type": fabric_by_type,
        "fabric_by_color": fabric_by_color,
        "fabric_by_godown": fabric_by_godown
    }

@router.get("/production-loss")
async def production_loss_report(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    receipts = await (await db.get_collection("job_work_receipts").find()).to_list()

    loss_records = []
    for r in receipts:
        issued = r.get("issued_quantity", 0.0)
        recd = r.get("received_quantity", 0.0)
        loss = r.get("loss_quantity", 0.0)
        variance = r.get("variance", 0.0)
        loss_pct = round((loss / issued * 100), 2) if issued > 0 else 0.0

        loss_records.append({
            "receipt_number": r.get("receipt_number"),
            "job_number": r.get("job_number"),
            "process_type": r.get("process_type"),
            "batch_number": r.get("batch_number"),
            "issued_kg": issued,
            "received_kg": recd,
            "loss_kg": loss,
            "loss_percentage": loss_pct,
            "unexplained_variance_kg": variance,
            "is_balanced": abs(variance) < 0.01
        })

    return loss_records
