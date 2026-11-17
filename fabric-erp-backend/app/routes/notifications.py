from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from datetime import datetime
from app.core.database import get_database
from app.routes.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Automated Business Notifications"])

@router.get("")
async def get_system_notifications(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    notifications = []

    # 1. Low yarn stock alerts (< 200 KG)
    lots = await (await db.get_collection("yarn_lots").find()).to_list()
    for lot in lots:
        avail = lot.get("current_available_qty", 0.0)
        if avail < 250.0:
            notifications.append({
                "id": f"low_yarn_{lot['_id']}",
                "category": "yarn_stock",
                "title": f"Low Yarn Stock: {lot.get('yarn_name')} ({lot.get('count')})",
                "description": f"Lot {lot.get('lot_number')} has only {avail} KG available (below safety threshold of 250 KG).",
                "severity": "high",
                "action_url": "yarn_inventory",
                "time": "Real-time"
            })

    # 2. Overdue or pending job work orders
    job_orders = await (await db.get_collection("job_work_orders").find({"status": "issued"})).to_list()
    for job in job_orders:
        notifications.append({
            "id": f"job_pending_{job['_id']}",
            "category": "job_work",
            "title": f"Job Work In Progress: {job.get('job_number')} ({job.get('process_type')})",
            "description": f"Issued to {job.get('job_worker_name')} for {job.get('expected_quantity')} KG of Batch {job.get('batch_number')}.",
            "severity": "medium",
            "action_url": "job_work",
            "time": "Active"
        })

    # 3. Quality rejections or hold rolls
    rolls = await (await db.get_collection("fabric_rolls").find({"quality_status": {"$in": ["rejected", "hold", "rework"]}})).to_list()
    for roll in rolls:
        notifications.append({
            "id": f"qc_alert_{roll['_id']}",
            "category": "quality",
            "title": f"QC Alert: Roll {roll.get('roll_number')} ({roll.get('quality_status').upper()})",
            "description": f"{roll.get('fabric_name')} ({roll.get('current_weight')} KG) requires review or quarantine in {roll.get('current_location')}.",
            "severity": "high" if roll.get("quality_status") == "rejected" else "medium",
            "action_url": "quality",
            "time": "Active"
        })

    # 4. Pending Customer Deliveries / Ready Fabric
    finished_rolls = await (await db.get_collection("fabric_rolls").find({"current_process": "finished", "is_delivered": False, "quality_status": "approved"})).to_list()
    if finished_rolls:
        total_finished_kg = sum(r.get("current_weight", 0.0) for r in finished_rolls)
        notifications.append({
            "id": "finished_goods_ready",
            "category": "delivery",
            "title": f"Finished Fabric Ready for Dispatch ({round(total_finished_kg, 1)} KG)",
            "description": f"{len(finished_rolls)} approved fabric rolls in Main Finished Goods Godown awaiting customer delivery.",
            "severity": "low",
            "action_url": "deliveries",
            "time": "Live"
        })

    # 5. Overdue customer payments
    invoices = await (await db.get_collection("invoices").find({"invoice_type": "sales", "payment_status": {"$ne": "paid"}})).to_list()
    for inv in invoices:
        out = inv.get("outstanding_amount", 0.0)
        if out > 50000:
            notifications.append({
                "id": f"payment_due_{inv['_id']}",
                "category": "finance",
                "title": f"Outstanding Receivable: {inv.get('party_name')}",
                "description": f"Invoice {inv.get('invoice_number')} has ₹{out.toLocaleString('en-IN') if hasattr(out, 'toLocaleString') else f'{out:,.2f}'} pending payment.",
                "severity": "medium",
                "action_url": "accounts",
                "time": inv.get("invoice_date", "")
            })

    return {
        "count": len(notifications),
        "notifications": notifications
    }
