from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import SalesOrderCreate, SalesOrderResponse
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/sales-orders", tags=["Customer Sales Orders"])

@router.get("", response_model=List[SalesOrderResponse])
async def list_sales_orders(status: Optional[str] = None, customer_id: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("sales_orders")
    query = {}
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
    cursor = await col.find(query)
    orders = await cursor.to_list()

    # Aggregate linked work orders to compute planned & remaining quantities
    batches_col = db.get_collection("production_batches")
    all_batches = await (await batches_col.find({})).to_list()
    batches_by_order: Dict[str, List[Dict[str, Any]]] = {}
    for b in all_batches:
        s_id = str(b.get("source_order_id") or "")
        s_num = str(b.get("source_order_number") or "")
        b_summary = {
            "batch_id": str(b.get("_id")),
            "batch_number": b.get("batch_number"),
            "fabric_name": b.get("fabric_name"),
            "colour": b.get("colour"),
            "gsm": b.get("gsm"),
            "planned_quantity": float(b.get("planned_quantity", 0.0)),
            "completed_quantity": float(b.get("completed_quantity", 0.0)),
            "current_process": b.get("current_process", "knitting"),
            "status": b.get("status", "in_progress")
        }
        if s_id:
            batches_by_order.setdefault(s_id, []).append(b_summary)
        if s_num:
            batches_by_order.setdefault(s_num, []).append(b_summary)

    for o in orders:
        oid = str(o.get("_id"))
        onum = str(o.get("order_number"))
        linked = batches_by_order.get(oid, []) + batches_by_order.get(onum, [])
        seen = set()
        unique_linked = []
        planned_total = 0.0
        for l in linked:
            b_num = l["batch_number"]
            if b_num not in seen:
                seen.add(b_num)
                unique_linked.append(l)
                planned_total += l["planned_quantity"]

        tot_qty = float(o.get("total_quantity", 0.0))
        rem_qty = max(0.0, round(tot_qty - planned_total, 2))
        o["planned_quantity"] = round(planned_total, 2)
        o["remaining_quantity"] = rem_qty
        o["linked_work_orders"] = unique_linked

    # Sort descending by date
    orders.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return orders

@router.post("", response_model=SalesOrderResponse)
async def create_sales_order(order_in: SalesOrderCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("sales_orders")

    # Fetch customer name if not provided
    cust = await db.get_collection("customers").find_one({"_id": order_in.customer_id})
    cust_name = cust.get("name", "Unknown Customer") if cust else order_in.customer_name

    order_num = order_in.order_number
    if not order_num:
        order_num = await get_next_sequence("order_number", prefix="SO-")

    # Calculate item totals & grand total
    items_data = []
    total_qty = 0.0
    subtotal = 0.0
    tax_total = 0.0

    for idx, item in enumerate(order_in.items):
        item_dict = item.model_dump()
        item_dict["item_id"] = f"{order_num}-ITM-{idx+1}"
        gross = item.quantity * item.unit_rate
        discount_amt = gross * ((item.discount_pct or 0.0) / 100.0)
        net_taxable = gross - discount_amt
        tax_amt = net_taxable * ((item.tax_pct or 5.0) / 100.0)
        item_total = net_taxable + tax_amt

        item_dict["total_amount"] = round(item_total, 2)
        item_dict["produced_quantity"] = 0.0
        item_dict["delivered_quantity"] = 0.0
        item_dict["status"] = "confirmed"
        items_data.append(item_dict)

        total_qty += item.quantity
        subtotal += net_taxable
        tax_total += tax_amt

    doc = order_in.model_dump()
    doc["order_number"] = order_num
    doc["customer_name"] = cust_name
    doc["items"] = items_data
    doc["total_quantity"] = round(total_qty, 2)
    doc["subtotal"] = round(subtotal, 2)
    doc["tax_amount"] = round(tax_total, 2)
    doc["grand_total"] = round(subtotal + tax_total, 2)
    doc["status"] = "confirmed"
    doc["order_date"] = doc.get("order_date") or datetime.utcnow().strftime("%Y-%m-%d")

    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_audit("create", "sales_orders", res.inserted_id, f"Created Sales Order {order_num} for {cust_name} (₹{doc['grand_total']})", user=current_user.get("name"))
    return doc

@router.get("/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(order_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    doc = await db.get_collection("sales_orders").find_one({"_id": order_id})
    if not doc:
        # Also check by order_number
        doc = await db.get_collection("sales_orders").find_one({"order_number": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Sales Order not found")

    batches_col = db.get_collection("production_batches")
    oid = str(doc.get("_id"))
    onum = str(doc.get("order_number"))
    cursor = await batches_col.find({"$or": [{"source_order_id": oid}, {"source_order_number": onum}]})
    batches = await cursor.to_list()
    
    unique_linked = []
    seen = set()
    planned_total = 0.0
    for b in batches:
        b_num = b.get("batch_number")
        if b_num not in seen:
            seen.add(b_num)
            planned_total += float(b.get("planned_quantity", 0.0))
            unique_linked.append({
                "batch_id": str(b.get("_id")),
                "batch_number": b_num,
                "fabric_name": b.get("fabric_name"),
                "colour": b.get("colour"),
                "gsm": b.get("gsm"),
                "planned_quantity": float(b.get("planned_quantity", 0.0)),
                "completed_quantity": float(b.get("completed_quantity", 0.0)),
                "current_process": b.get("current_process", "knitting"),
                "status": b.get("status", "in_progress")
            })

    tot_qty = float(doc.get("total_quantity", 0.0))
    doc["planned_quantity"] = round(planned_total, 2)
    doc["remaining_quantity"] = max(0.0, round(tot_qty - planned_total, 2))
    doc["linked_work_orders"] = unique_linked
    return doc

@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, payload: Dict[str, str], current_user: Dict[str, Any] = Depends(get_current_user)):
    new_status = payload.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")

    valid_statuses = [
        "Draft", "Confirmed", "Planning", "In Production",
        "Partially Ready", "Ready for Delivery", "Partially Delivered",
        "Completed", "Cancelled"
    ]
    matched_status = next((s for s in valid_statuses if s.lower() == new_status.lower()), new_status)

    db = get_database()
    col = db.get_collection("sales_orders")
    order = await col.find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Sales Order not found")

    old_status = order.get("status")
    await col.update_one({"_id": order_id}, {"$set": {"status": matched_status}})
    
    # If moved to Planning or In Production for made-to-order, ensure production batches exist
    if matched_status in ("Planning", "In Production") and order.get("order_type") == "made_to_order":
        batches_col = db.get_collection("production_batches")
        for item in order.get("items", []):
            existing_batch = await batches_col.find_one({
                "source_order_id": order_id,
                "order_item_id": item.get("item_id")
            })
            if not existing_batch:
                batch_num = await get_next_sequence("batch_number", prefix="BATCH-")
                new_batch = {
                    "batch_number": batch_num,
                    "source_type": "sales_order",
                    "source_order_id": order_id,
                    "source_order_number": order.get("order_number"),
                    "order_item_id": item.get("item_id"),
                    "fabric_name": item.get("fabric"),
                    "colour": item.get("colour"),
                    "gsm": item.get("gsm"),
                    "width": item.get("width", 72.0),
                    "planned_quantity": item.get("quantity"),
                    "completed_quantity": 0.0,
                    "current_process": "knitting",
                    "status": "in_progress",
                    "process_route": ["knitting", "washing", "compacting", "finishing"],
                    "total_cost": 0.0
                }
                await batches_col.insert_one(new_batch)

    await log_audit("status_change", "sales_orders", order_id, f"Order {order.get('order_number')} status changed from {old_status} to {matched_status}", user=current_user.get("name"))
    return {"message": "Status updated successfully", "status": matched_status}

@router.post("/{order_id}/cancel")
async def cancel_sales_order(order_id: str, payload: Dict[str, str], current_user: Dict[str, Any] = Depends(get_current_user)):
    reason = payload.get("reason", "Cancelled by customer / amendment")
    db = get_database()
    col = db.get_collection("sales_orders")
    order = await col.find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await col.update_one(
        {"_id": order_id},
        {"$set": {"status": "Cancelled", "cancellation_reason": reason, "cancelled_at": datetime.utcnow().isoformat()}}
    )
    # Release any reserved fabric rolls
    rolls_col = db.get_collection("fabric_rolls")
    await rolls_col.update_many(
        {"sales_order_id": order_id, "is_delivered": False},
        {"$set": {"is_reserved": False, "sales_order_id": None, "sales_order_number": None}}
    )

    await log_audit("order_cancellation", "sales_orders", order_id, f"Cancelled order {order.get('order_number')}. Reason: {reason}", user=current_user.get("name"))
    return {"message": "Sales order cancelled successfully and reserved rolls released"}

