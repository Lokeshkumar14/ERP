from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from app.core.database import get_database
from app.routes.auth import get_current_user

router = APIRouter(prefix="/costing", tags=["Costing & Batch Profitability"])

@router.get("/batches/{batch_id}")
async def get_batch_costing(batch_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    batch = await db.get_collection("production_batches").find_one({"_id": batch_id})
    if not batch:
        batch = await db.get_collection("production_batches").find_one({"batch_number": batch_id})
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Fetch associated job works
    jw_orders = await (await db.get_collection("job_work_orders").find({"batch_id": batch["_id"]})).to_list()
    
    # Calculate costs
    cost_breakdown = []
    total_cost = 0.0

    # Estimated yarn cost (e.g. ₹240/kg * planned qty)
    yarn_cost = round(batch.get("planned_quantity", 0.0) * 240.0, 2)
    cost_breakdown.append({"item": "Yarn Raw Material", "rate": 240.0, "qty": batch.get("planned_quantity"), "amount": yarn_cost})
    total_cost += yarn_cost

    for jw in jw_orders:
        rate = jw.get("rate_per_kg", 0.0)
        qty = jw.get("expected_quantity", 0.0)
        amount = round(rate * qty, 2)
        cost_breakdown.append({
            "item": f"{jw.get('process_type', '').capitalize()} Job Work",
            "rate": rate,
            "qty": qty,
            "amount": amount
        })
        total_cost += amount

    # Transport / logistics estimate
    transport = round(batch.get("planned_quantity", 0.0) * 4.5, 2)
    cost_breakdown.append({"item": "Transport & Handling", "rate": 4.5, "qty": batch.get("planned_quantity"), "amount": transport})
    total_cost += transport

    finished_qty = batch.get("completed_quantity") or batch.get("planned_quantity") or 1.0
    cost_per_kg = round(total_cost / max(finished_qty, 1.0), 2)

    return {
        "batch_number": batch.get("batch_number"),
        "fabric_name": batch.get("fabric_name"),
        "planned_quantity": batch.get("planned_quantity"),
        "completed_quantity": finished_qty,
        "cost_breakdown": cost_breakdown,
        "total_production_cost": round(total_cost, 2),
        "cost_per_kg": cost_per_kg
    }

@router.get("/orders-profitability")
async def get_orders_profitability(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    orders = await (await db.get_collection("sales_orders").find()).to_list()

    report = []
    for o in orders:
        revenue = o.get("subtotal", 0.0)  # revenue excluding tax
        qty = o.get("total_quantity", 0.0)
        # Cost estimate: approx ₹285/kg cost against typical sales rate ₹340-360
        est_cost_per_kg = 285.0
        total_cost = round(qty * est_cost_per_kg, 2)
        profit = round(revenue - total_cost, 2)
        margin_pct = round((profit / revenue * 100), 1) if revenue > 0 else 0.0

        report.append({
            "order_number": o.get("order_number"),
            "customer_name": o.get("customer_name"),
            "order_type": o.get("order_type"),
            "total_quantity": qty,
            "revenue": revenue,
            "production_cost": total_cost,
            "estimated_profit": profit,
            "margin_percentage": margin_pct,
            "status": o.get("status")
        })

    return report
