from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import JobWorkOrderCreate, JobWorkReceiptCreate, ProductionBatchCreate, ProductionBatchResponse
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/job-work", tags=["Job Work & Process Engine"])

@router.get("/batches", response_model=List[ProductionBatchResponse])
async def list_production_batches(status: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("production_batches")
    query = {"status": status} if status else {}
    cursor = await col.find(query)
    batches = await cursor.to_list()
    batches.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return batches

@router.post("/batches", response_model=ProductionBatchResponse)
async def create_production_batch(batch_in: ProductionBatchCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("production_batches")

    batch_num = batch_in.batch_number
    if not batch_num:
        batch_num = await get_next_sequence("batch_number", prefix="BATCH-")

    doc = batch_in.model_dump()
    doc["batch_number"] = batch_num
    doc["current_process"] = batch_in.process_route[0] if batch_in.process_route else "knitting"
    doc["status"] = "in_progress"
    doc["completed_quantity"] = 0.0
    doc["total_cost"] = 0.0

    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_audit("create", "production_batches", res.inserted_id, f"Created production batch {batch_num} for {batch_in.fabric_name} ({batch_in.planned_quantity} KG)", user=current_user.get("name"))
    return doc

@router.get("/orders")
async def list_job_work_orders(process_type: Optional[str] = None, batch_id: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("job_work_orders")
    query = {}
    if process_type:
        query["process_type"] = process_type
    if batch_id:
        query["batch_id"] = batch_id
    cursor = await col.find(query)
    orders = await cursor.to_list()
    orders.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return orders

@router.post("/orders")
async def create_job_work_order(order_in: JobWorkOrderCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("job_work_orders")

    party = await db.get_collection("parties").find_one({"_id": order_in.job_worker_id})
    worker_name = party.get("name", "Unknown Job Worker") if party else order_in.job_worker_name

    job_num = order_in.job_number
    if not job_num:
        prefix = f"JOB-{order_in.process_type[:3].upper()}-"
        job_num = await get_next_sequence(f"job_{order_in.process_type}", prefix=prefix)

    doc = order_in.model_dump()
    doc["job_number"] = job_num
    doc["job_worker_name"] = worker_name
    doc["status"] = "issued"
    doc["received_quantity"] = 0.0

    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id

    # If knitting and yarn lot is specified, deduct yarn stock as issued to job worker
    if order_in.process_type == "knitting" and order_in.yarn_lot_number and order_in.yarn_issued_qty:
        yarn_col = db.get_collection("yarn_lots")
        lot = await yarn_col.find_one({"lot_number": order_in.yarn_lot_number})
        if lot:
            await yarn_col.update_one(
                {"_id": lot["_id"]},
                {
                    "$inc": {
                        "current_available_qty": -order_in.yarn_issued_qty,
                        "issued_qty": order_in.yarn_issued_qty
                    }
                }
            )

    # Generate Delivery Challan for material issue
    dc_num = await get_next_sequence("dc_number", prefix="DC-")
    dc_col = db.get_collection("delivery_challans")
    dc_doc = {
        "dc_number": dc_num,
        "dc_type": f"{order_in.process_type}_issue",
        "dc_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "party_id": order_in.job_worker_id,
        "party_name": worker_name,
        "from_location": "Main Godown",
        "to_location": f"{worker_name} Factory",
        "reference_job_number": job_num,
        "reference_order_number": order_in.batch_number,
        "item_description": f"Material for {order_in.process_type} - Batch {order_in.batch_number}",
        "quantity": order_in.yarn_issued_qty or order_in.expected_quantity,
        "unit": "KG",
        "status": "dispatched"
    }
    await dc_col.insert_one(dc_doc)
    doc["issue_dc_number"] = dc_num

    await log_audit("create", "job_work_orders", res.inserted_id, f"Issued {order_in.process_type} Job {job_num} to {worker_name} (DC {dc_num})", user=current_user.get("name"))
    return doc

@router.post("/receipts")
async def create_job_work_receipt(receipt_in: JobWorkReceiptCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    job_col = db.get_collection("job_work_orders")
    job = await job_col.find_one({"_id": receipt_in.job_work_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job work order not found")

    batch_col = db.get_collection("production_batches")
    batch = await batch_col.find_one({"_id": job.get("batch_id")})

    # Calculate reconciliation variance:
    # Issued Qty = Received Qty + Rejected Qty + Returned Input Qty + Loss Qty + Variance
    issued_qty = job.get("yarn_issued_qty") or job.get("expected_quantity", 0.0)
    accounted_qty = receipt_in.received_quantity + receipt_in.rejected_quantity + receipt_in.returned_input_quantity + receipt_in.loss_quantity
    variance = round(issued_qty - accounted_qty, 2)

    receipt_num = await get_next_sequence("job_receipt_number", prefix="JWR-")
    doc = receipt_in.model_dump()
    doc["receipt_number"] = receipt_num
    doc["job_number"] = job.get("job_number")
    doc["process_type"] = job.get("process_type")
    doc["batch_id"] = job.get("batch_id")
    doc["batch_number"] = job.get("batch_number")
    doc["issued_quantity"] = issued_qty
    doc["variance"] = variance
    doc["reconciliation"] = {
        "issued_qty": issued_qty,
        "received_qty": receipt_in.received_quantity,
        "rejected_qty": receipt_in.rejected_quantity,
        "returned_input_qty": receipt_in.returned_input_quantity,
        "loss_qty": receipt_in.loss_quantity,
        "variance": variance,
        "is_balanced": abs(variance) < 0.01
    }

    receipt_col = db.get_collection("job_work_receipts")
    res = await receipt_col.insert_one(doc)
    doc["_id"] = res.inserted_id

    # Update job work status
    await job_col.update_one(
        {"_id": job["_id"]},
        {
            "$set": {
                "status": "completed",
                "received_quantity": receipt_in.received_quantity,
                "reconciliation_variance": variance
            }
        }
    )

    # Generate Fabric Rolls for the received quantity
    rolls_count = max(receipt_in.rolls_count, 1)
    weight_per_roll = round(receipt_in.received_quantity / rolls_count, 2)
    rolls_col = db.get_collection("fabric_rolls")
    generated_roll_ids = []

    fabric_name = batch.get("fabric_name", "Fabric") if batch else "Fabric"
    gsm = receipt_in.measured_gsm or (batch.get("gsm") if batch else 160.0)
    width = receipt_in.measured_width or (batch.get("width") if batch else 72.0)
    colour = batch.get("colour", "Natural") if batch else "Natural"

    for i in range(rolls_count):
        roll_num = await get_next_sequence("roll_number", prefix="ROLL-")
        roll_doc = {
            "roll_number": roll_num,
            "batch_id": job.get("batch_id"),
            "batch_number": job.get("batch_number"),
            "source_order_id": batch.get("source_order_id") if batch else None,
            "fabric_name": fabric_name,
            "gsm": gsm,
            "width": width,
            "colour": colour,
            "original_weight": weight_per_roll,
            "current_weight": weight_per_roll,
            "current_process": job.get("process_type"),
            "current_location": "Main Godown",
            "quality_status": receipt_in.quality_status,
            "is_reserved": False,
            "is_delivered": False,
            "parent_roll_ids": [],
            "child_roll_ids": []
        }
        r_res = await rolls_col.insert_one(roll_doc)
        generated_roll_ids.append(r_res.inserted_id)

    # Progress the batch process route
    if batch:
        route = batch.get("process_route", ["knitting", "washing", "compacting", "finishing"])
        curr_proc = job.get("process_type")
        if curr_proc in route:
            curr_idx = route.index(curr_proc)
            if curr_idx + 1 < len(route):
                next_proc = route[curr_idx + 1]
                await batch_col.update_one(
                    {"_id": batch["_id"]},
                    {"$set": {"current_process": next_proc}}
                )
            else:
                # Finished route
                await batch_col.update_one(
                    {"_id": batch["_id"]},
                    {
                        "$set": {
                            "current_process": "finished",
                            "status": "completed",
                            "completed_quantity": receipt_in.received_quantity
                        }
                    }
                )

    await log_audit("receive_job", "job_work", res.inserted_id, f"Received {receipt_in.received_quantity} KG from {job.get('process_type')} ({rolls_count} rolls created)", user=current_user.get("name"))
    return {
        "receipt": doc,
        "generated_rolls_count": rolls_count,
        "variance": variance
    }
