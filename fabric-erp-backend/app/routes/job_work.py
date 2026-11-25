from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import JobWorkOrderCreate, JobWorkReceiptCreate, ProductionBatchCreate, ProductionBatchResponse
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/job-work", tags=["Job Work & Process Engine"])

def enrich_batch_stage_progress(batch: Dict[str, Any], all_jobs: List[Dict[str, Any]]) -> Dict[str, Any]:
    b_id = str(batch.get("_id"))
    b_num = str(batch.get("batch_number", ""))
    route = batch.get("process_route") or ["knitting", "washing", "compacting", "finishing"]
    
    batch_jobs = [
        j for j in all_jobs 
        if str(j.get("batch_id")) == b_id or str(j.get("batch_number")) == b_num
    ]

    stage_progress = []
    stage_received_map = {}
    stage_issued_map = {}

    for stage in route:
        stage_jobs = [j for j in batch_jobs if j.get("process_type", "").lower() == stage.lower()]
        issued = sum(float(j.get("yarn_issued_qty") or j.get("expected_quantity", 0.0)) for j in stage_jobs)
        received = sum(float(j.get("received_quantity", 0.0)) for j in stage_jobs)
        pending = max(0.0, round(issued - received, 2))

        stage_issued_map[stage] = issued
        stage_received_map[stage] = received

        if issued == 0:
            stage_status = "not_started"
        elif pending == 0 and received > 0:
            stage_status = "completed"
        elif received > 0:
            stage_status = "partially_received"
        else:
            stage_status = "issued"

        stage_progress.append({
            "stage": stage,
            "issued_qty": round(issued, 2),
            "received_qty": round(received, 2),
            "pending_qty": pending,
            "status": stage_status,
            "jobs_count": len(stage_jobs),
            "job_workers": list({j.get("job_worker_name") for j in stage_jobs if j.get("job_worker_name")})
        })

    # Check which stage has completed fabric ready to forward to next stage
    ready_for_next = None
    for i in range(len(route) - 1):
        curr_st = route[i]
        next_st = route[i + 1]
        recd_curr = stage_received_map.get(curr_st, 0.0)
        issued_next = stage_issued_map.get(next_st, 0.0)
        unforwarded = round(recd_curr - issued_next, 2)
        if unforwarded > 0.01:
            ready_for_next = {
                "from_stage": curr_st,
                "to_stage": next_st,
                "ready_quantity": unforwarded
            }
            break

    # Final stage completion
    final_stage = route[-1] if route else "finishing"
    final_received = stage_received_map.get(final_stage, 0.0)
    planned = float(batch.get("planned_quantity", 0.0))
    
    batch["stage_progress"] = stage_progress
    batch["ready_for_next_stage"] = ready_for_next
    batch["completed_quantity"] = final_received

    if planned > 0 and final_received >= planned:
        batch["status"] = "completed"
        batch["current_process"] = "finished"
    else:
        # Determine earliest stage with unfinished work or ready handover
        active_st = route[0]
        for sp in stage_progress:
            if sp["status"] in ("issued", "partially_received") or sp["pending_qty"] > 0:
                active_st = sp["stage"]
                break
        batch["current_process"] = active_st

    return batch

@router.get("/batches", response_model=List[ProductionBatchResponse])
async def list_production_batches(status: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("production_batches")
    jobs_col = db.get_collection("job_work_orders")

    query = {"status": status} if status else {}
    cursor = await col.find(query)
    batches = await cursor.to_list()
    all_jobs = await (await jobs_col.find({})).to_list()

    enriched = [enrich_batch_stage_progress(b, all_jobs) for b in batches]
    enriched.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return enriched

@router.get("/batches/{batch_id}/stage-summary")
async def get_batch_stage_summary(batch_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    batch = await db.get_collection("production_batches").find_one({"_id": batch_id})
    if not batch:
        batch = await db.get_collection("production_batches").find_one({"batch_number": batch_id})
    if not batch:
        raise HTTPException(status_code=404, detail="Work order not found")

    all_jobs = await (await db.get_collection("job_work_orders").find({
        "$or": [{"batch_id": str(batch["_id"])}, {"batch_number": str(batch.get("batch_number"))}]
    })).to_list()

    return enrich_batch_stage_progress(batch, all_jobs)

@router.post("/batches", response_model=ProductionBatchResponse)
async def create_production_batch(batch_in: ProductionBatchCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("production_batches")

    # Strict Sales Order Fulfillment Validation
    if batch_in.source_type == "sales_order" and (batch_in.source_order_id or batch_in.source_order_number):
        so_col = db.get_collection("sales_orders")
        so_query = []
        if batch_in.source_order_id:
            so_query.append({"_id": batch_in.source_order_id})
        if batch_in.source_order_number:
            so_query.append({"order_number": batch_in.source_order_number})

        so = await so_col.find_one({"$or": so_query}) if so_query else None
        if so:
            total_ordered = float(so.get("total_quantity", 0.0))
            existing_batches = await (await col.find({
                "$or": [
                    {"source_order_id": str(so.get("_id"))},
                    {"source_order_number": str(so.get("order_number"))}
                ]
            })).to_list()

            existing_planned = sum(float(b.get("planned_quantity", 0.0)) for b in existing_batches)
            remaining = max(0.0, round(total_ordered - existing_planned, 2))

            if remaining <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Sales Order {so.get('order_number')} is already 100% planned into work orders ({total_ordered} KG). No further work orders allowed."
                )

            if batch_in.planned_quantity > remaining:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot plan {batch_in.planned_quantity} KG. Only {remaining} KG remaining unallocated for Sales Order {so.get('order_number')}."
                )

            # Update Sales Order status to in_production
            await so_col.update_one({"_id": so["_id"]}, {"$set": {"status": "in_production"}})

    batch_num = batch_in.batch_number
    if not batch_num:
        batch_num = await get_next_sequence("work_order_number", prefix="WO-")
        while await col.find_one({"batch_number": batch_num}):
            batch_num = await get_next_sequence("work_order_number", prefix="WO-")

    doc = batch_in.model_dump()
    doc["batch_number"] = batch_num
    doc["current_process"] = batch_in.process_route[0] if batch_in.process_route else "knitting"
    doc["status"] = "in_progress"
    doc["completed_quantity"] = 0.0
    doc["total_cost"] = 0.0

    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_audit("create", "production_batches", res.inserted_id, f"Created production work order {batch_num} for {batch_in.fabric_name} ({batch_in.planned_quantity} KG)", user=current_user.get("name"))
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
    if not batch and job.get("batch_number"):
        batch = await batch_col.find_one({"batch_number": job.get("batch_number")})

    issued_qty = float(job.get("yarn_issued_qty") or job.get("expected_quantity", 0.0))
    prior_received = float(job.get("received_quantity", 0.0) or 0.0)
    this_received = float(receipt_in.received_quantity)
    new_total_received = round(prior_received + this_received, 2)

    # Calculate reconciliation variance for this delivery:
    # Accounted = this received + rejected + returned + loss
    accounted_this_delivery = this_received + receipt_in.rejected_quantity + receipt_in.returned_input_quantity + receipt_in.loss_quantity
    variance = round(issued_qty - (prior_received + accounted_this_delivery), 2)

    receipt_num = await get_next_sequence("job_receipt_number", prefix="JWR-")
    doc = receipt_in.model_dump()
    doc["receipt_number"] = receipt_num
    doc["job_number"] = job.get("job_number")
    doc["process_type"] = job.get("process_type")
    doc["batch_id"] = str(job.get("batch_id"))
    doc["batch_number"] = job.get("batch_number")
    doc["issued_quantity"] = issued_qty
    doc["variance"] = variance
    doc["reconciliation"] = {
        "issued_qty": issued_qty,
        "prior_received": prior_received,
        "received_this_delivery": this_received,
        "total_received": new_total_received,
        "rejected_qty": receipt_in.rejected_quantity,
        "returned_input_qty": receipt_in.returned_input_quantity,
        "loss_qty": receipt_in.loss_quantity,
        "variance": variance,
        "is_balanced": abs(variance) < 0.01
    }

    receipt_col = db.get_collection("job_work_receipts")
    res = await receipt_col.insert_one(doc)
    doc["_id"] = res.inserted_id

    # Check if job order is now completely fulfilled
    is_fully_done = (new_total_received >= issued_qty - 0.01)
    new_job_status = "completed" if is_fully_done else "partially_received"

    # Update job work status and accumulated received quantity
    await job_col.update_one(
        {"_id": job["_id"]},
        {
            "$set": {
                "status": new_job_status,
                "received_quantity": new_total_received,
                "reconciliation_variance": variance
            }
        }
    )

    # Record received fabric stock (by weight in KG)
    rolls_col = db.get_collection("fabric_rolls")
    fabric_name = batch.get("fabric_name", "Fabric") if batch else "Fabric"
    gsm = receipt_in.measured_gsm or (batch.get("gsm") if batch else 160.0)
    width = receipt_in.measured_width or (batch.get("width") if batch else 72.0)
    colour = batch.get("colour", "Natural") if batch else "Natural"

    stock_doc = {
        "batch_id": str(job.get("batch_id")),
        "batch_number": job.get("batch_number"),
        "source_order_id": batch.get("source_order_id") if batch else None,
        "fabric_name": fabric_name,
        "gsm": gsm,
        "width": width,
        "colour": colour,
        "original_weight": float(receipt_in.received_quantity),
        "current_weight": float(receipt_in.received_quantity),
        "current_process": job.get("process_type"),
        "current_location": "Main Finished Goods Godown" if job.get("process_type") in ("finishing", "compacting") else "Processing Godown",
        "quality_status": "approved",
        "is_reserved": False,
        "is_delivered": False
    }
    await rolls_col.insert_one(stock_doc)

    # Find next process in route
    route = batch.get("process_route", ["knitting", "washing", "compacting", "finishing"]) if batch else ["knitting", "washing", "compacting", "finishing"]
    curr_proc = job.get("process_type", "").lower()
    next_proc = None
    if curr_proc in route:
        curr_idx = route.index(curr_proc)
        if curr_idx + 1 < len(route):
            next_proc = route[curr_idx + 1]

    # If this is the final stage, update batch completed quantity
    if batch and curr_proc == route[-1]:
        all_final_jobs = await (await job_col.find({
            "$or": [{"batch_id": str(batch["_id"])}, {"batch_number": str(batch.get("batch_number"))}],
            "process_type": route[-1]
        })).to_list()
        total_final = sum(float(j.get("received_quantity", 0.0)) for j in all_final_jobs)
        planned = float(batch.get("planned_quantity", 0.0))
        if planned > 0 and total_final >= planned:
            await batch_col.update_one(
                {"_id": batch["_id"]},
                {"$set": {"status": "completed", "current_process": "finished", "completed_quantity": total_final}}
            )

    await log_audit("receive_job", "job_work", res.inserted_id, f"Received {receipt_in.received_quantity} KG ({new_total_received}/{issued_qty} KG) from {job.get('process_type')}", user=current_user.get("name"))
    return {
        "receipt": doc,
        "received_weight_kg": this_received,
        "total_received_kg": new_total_received,
        "issued_qty": issued_qty,
        "pending_qty": max(0.0, round(issued_qty - new_total_received, 2)),
        "job_status": new_job_status,
        "next_process": next_proc,
        "batch_id": str(job.get("batch_id")),
        "batch_number": str(job.get("batch_number")),
        "variance": variance
    }
