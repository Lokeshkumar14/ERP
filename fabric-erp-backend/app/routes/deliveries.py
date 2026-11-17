from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/deliveries", tags=["Sales Deliveries & Dispatch"])

@router.get("")
async def list_deliveries(customer_id: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("sales_deliveries")
    query = {"customer_id": customer_id} if customer_id else {}
    cursor = await col.find(query)
    deliveries = await cursor.to_list()
    deliveries.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return deliveries

@router.post("")
async def create_sales_delivery(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    order_id = payload.get("sales_order_id")
    roll_ids = payload.get("roll_ids", [])
    transporter = payload.get("transporter", "")
    vehicle_number = payload.get("vehicle_number", "")
    eway_bill = payload.get("eway_bill_number", "")

    if not order_id or not roll_ids:
        raise HTTPException(status_code=400, detail="Sales order ID and roll IDs are required")

    db = get_database()
    orders_col = db.get_collection("sales_orders")
    order = await orders_col.find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Sales Order not found")

    rolls_col = db.get_collection("fabric_rolls")
    rolls_to_dispatch = []
    total_delivered_weight = 0.0
    roll_numbers = []

    for rid in roll_ids:
        r = await rolls_col.find_one({"_id": rid})
        if not r:
            raise HTTPException(status_code=404, detail=f"Roll {rid} not found")
        if r.get("is_delivered"):
            raise HTTPException(status_code=400, detail=f"Roll {r.get('roll_number')} is already marked as delivered!")
        if r.get("quality_status") == "rejected":
            raise HTTPException(status_code=400, detail=f"Roll {r.get('roll_number')} is rejected by QC and cannot be dispatched!")
        
        rolls_to_dispatch.append(r)
        total_delivered_weight += r.get("current_weight", 0.0)
        roll_numbers.append(r.get("roll_number"))

    # Mark rolls as delivered
    for rid in roll_ids:
        await rolls_col.update_one(
            {"_id": rid},
            {
                "$set": {
                    "is_delivered": True,
                    "delivered_at": datetime.utcnow().strftime("%Y-%m-%d"),
                    "delivered_to_customer": order.get("customer_name")
                }
            }
        )

    # Generate Delivery Challan
    dc_num = await get_next_sequence("dc_number", prefix="DC-")
    dc_doc = {
        "dc_number": dc_num,
        "dc_type": "customer_delivery",
        "dc_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "party_id": order.get("customer_id"),
        "party_name": order.get("customer_name"),
        "from_location": "Main Finished Goods Godown",
        "to_location": f"{order.get('customer_name')} Premises",
        "reference_order_number": order.get("order_number"),
        "transporter": transporter,
        "vehicle_number": vehicle_number,
        "eway_bill_number": eway_bill,
        "item_description": f"Fabric delivery for order {order.get('order_number')}",
        "roll_numbers": roll_numbers,
        "quantity": round(total_delivered_weight, 2),
        "unit": "KG",
        "prepared_by": current_user.get("name", "Dispatch Team"),
        "status": "dispatched"
    }
    await db.get_collection("delivery_challans").insert_one(dc_doc)

    # Record delivery document
    delivery_num = await get_next_sequence("delivery_number", prefix="DEL-")
    del_doc = {
        "delivery_number": delivery_num,
        "sales_order_id": order_id,
        "sales_order_number": order.get("order_number"),
        "customer_id": order.get("customer_id"),
        "customer_name": order.get("customer_name"),
        "delivery_challan_number": dc_num,
        "roll_ids": roll_ids,
        "roll_numbers": roll_numbers,
        "quantity_kg": round(total_delivered_weight, 2),
        "transporter": transporter,
        "vehicle_number": vehicle_number,
        "eway_bill_number": eway_bill,
        "delivery_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "status": "dispatched"
    }
    del_res = await db.get_collection("sales_deliveries").insert_one(del_doc)
    del_doc["_id"] = del_res.inserted_id

    # Update Sales Order delivered status
    order_items = order.get("items", [])
    total_order_qty = sum(it.get("quantity", 0.0) for it in order_items)
    # Check prior deliveries
    prior_deliveries = await (await db.get_collection("sales_deliveries").find({"sales_order_id": order_id})).to_list()
    cumulative_delivered = sum(d.get("quantity_kg", 0.0) for d in prior_deliveries)

    new_status = "Completed" if cumulative_delivered >= total_order_qty else "Partially Delivered"
    await orders_col.update_one({"_id": order_id}, {"$set": {"status": new_status}})

    await log_audit("dispatch", "sales_deliveries", del_res.inserted_id, f"Dispatched Delivery {delivery_num} ({total_delivered_weight} KG, DC {dc_num}) to {order.get('customer_name')}", user=current_user.get("name"))
    return del_doc
