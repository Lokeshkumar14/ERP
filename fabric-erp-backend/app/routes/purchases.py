from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import PurchaseOrderCreate, PurchaseOrderResponse, GoodsReceiptCreate, GoodsReceiptResponse
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/purchases", tags=["Yarn Purchases & Receipts"])

@router.get("/orders", response_model=List[PurchaseOrderResponse])
async def list_purchase_orders(status: Optional[str] = None, supplier_id: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("purchase_orders")
    query = {}
    if status:
        query["status"] = status
    if supplier_id:
        query["supplier_id"] = supplier_id
    cursor = await col.find(query)
    pos = await cursor.to_list()
    pos.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return pos

@router.post("/orders", response_model=PurchaseOrderResponse)
async def create_purchase_order(po_in: PurchaseOrderCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("purchase_orders")

    # Fetch supplier info
    supplier = await db.get_collection("parties").find_one({"_id": po_in.supplier_id})
    sup_name = supplier.get("name", "Unknown Supplier") if supplier else po_in.supplier_name

    po_num = po_in.purchase_number
    if not po_num:
        po_num = await get_next_sequence("purchase_number", prefix="PO-")

    total_amount = 0.0
    items_data = []
    for item in po_in.items:
        item_dict = item.model_dump()
        base = item.quantity * item.rate
        tax = base * ((item.tax_pct or 5.0) / 100.0)
        item_dict["total_amount"] = round(base + tax, 2)
        item_dict["received_quantity"] = 0.0
        total_amount += item_dict["total_amount"]
        items_data.append(item_dict)

    doc = po_in.model_dump()
    doc["purchase_number"] = po_num
    doc["supplier_name"] = sup_name
    doc["items"] = items_data
    doc["total_amount"] = round(total_amount, 2)
    doc["status"] = "confirmed"
    doc["purchase_date"] = doc.get("purchase_date") or datetime.utcnow().strftime("%Y-%m-%d")

    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_audit("create", "purchase_orders", res.inserted_id, f"Created Purchase Order {po_num} for {sup_name} (₹{doc['total_amount']})", user=current_user.get("name"))
    return doc

@router.get("/receipts", response_model=List[GoodsReceiptResponse])
async def list_goods_receipts(supplier_id: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("purchase_receipts")
    query = {"supplier_id": supplier_id} if supplier_id else {}
    cursor = await col.find(query)
    receipts = await cursor.to_list()
    receipts.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return receipts

@router.post("/receipts", response_model=GoodsReceiptResponse)
async def create_goods_receipt(receipt_in: GoodsReceiptCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("purchase_receipts")

    receipt_num = receipt_in.receipt_number
    if not receipt_num:
        receipt_num = await get_next_sequence("grn_number", prefix="GRN-")

    doc = receipt_in.model_dump()
    doc["receipt_number"] = receipt_num
    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id

    # Update or create yarn lot in inventory
    yarn_lots = db.get_collection("yarn_lots")
    existing_lot = await yarn_lots.find_one({"lot_number": receipt_in.lot_number})
    if existing_lot:
        await yarn_lots.update_one(
            {"_id": existing_lot["_id"]},
            {
                "$inc": {
                    "quantity_received": receipt_in.accepted_quantity,
                    "current_available_qty": receipt_in.accepted_quantity
                }
            }
        )
    else:
        new_lot = {
            "lot_number": receipt_in.lot_number,
            "yarn_name": receipt_in.yarn_name,
            "count": receipt_in.count,
            "supplier_id": receipt_in.supplier_id,
            "supplier_name": receipt_in.supplier_name,
            "quantity_received": receipt_in.accepted_quantity,
            "current_available_qty": receipt_in.accepted_quantity,
            "reserved_qty": 0.0,
            "issued_qty": 0.0,
            "unit": "KG",
            "godown_name": receipt_in.godown_name,
            "received_at": datetime.utcnow().strftime("%Y-%m-%d")
        }
        await yarn_lots.insert_one(new_lot)

    # If linked to a PO, update received quantities
    if receipt_in.purchase_order_id:
        po_col = db.get_collection("purchase_orders")
        po = await po_col.find_one({"_id": receipt_in.purchase_order_id})
        if po:
            all_received = True
            for item in po.get("items", []):
                if item.get("count") == receipt_in.count:
                    item["received_quantity"] = item.get("received_quantity", 0) + receipt_in.accepted_quantity
                if item.get("received_quantity", 0) < item.get("quantity", 0):
                    all_received = False
            new_po_status = "Fully Received" if all_received else "Partially Received"
            await po_col.update_one({"_id": receipt_in.purchase_order_id}, {"$set": {"items": po["items"], "status": new_po_status}})

    await log_audit("create", "purchase_receipts", res.inserted_id, f"Received Yarn GRN {receipt_num} - {receipt_in.accepted_quantity} KG (Lot {receipt_in.lot_number})", user=current_user.get("name"))
    return doc

@router.post("/returns")
async def create_purchase_return(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    lot_number = payload.get("lot_number")
    supplier_id = payload.get("supplier_id")
    quantity = float(payload.get("quantity", 0.0))
    reason = payload.get("reason", "Defective count / uneven twist")

    if not lot_number or quantity <= 0:
        raise HTTPException(status_code=400, detail="Invalid lot or return quantity")

    db = get_database()
    yarn_lots = db.get_collection("yarn_lots")
    lot = await yarn_lots.find_one({"lot_number": lot_number})
    if not lot:
        raise HTTPException(status_code=404, detail="Yarn lot not found")

    avail = lot.get("current_available_qty", 0.0)
    if avail < quantity:
        raise HTTPException(status_code=400, detail=f"Insufficient available yarn to return. Available: {avail} KG")

    # Deduct stock
    await yarn_lots.update_one({"_id": lot["_id"]}, {"$inc": {"current_available_qty": -quantity}})

    return_num = await get_next_sequence("purchase_return", prefix="PRT-")
    ret_doc = {
        "return_number": return_num,
        "lot_number": lot_number,
        "yarn_name": lot.get("yarn_name"),
        "supplier_id": supplier_id or lot.get("supplier_id"),
        "supplier_name": lot.get("supplier_name"),
        "quantity": quantity,
        "unit": "KG",
        "reason": reason,
        "return_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "status": "returned"
    }
    await db.get_collection("purchase_returns").insert_one(ret_doc)

    # Generate Yarn Return Delivery Challan
    dc_num = await get_next_sequence("dc_number", prefix="DC-")
    dc_doc = {
        "dc_number": dc_num,
        "dc_type": "yarn_return",
        "dc_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "party_name": lot.get("supplier_name"),
        "from_location": "Main Yarn Godown",
        "to_location": f"{lot.get('supplier_name')} Mill",
        "item_description": f"Yarn Purchase Return (Lot {lot_number}) - Reason: {reason}",
        "quantity": quantity,
        "unit": "KG",
        "prepared_by": current_user.get("name", "Purchase Team"),
        "status": "dispatched"
    }
    await db.get_collection("delivery_challans").insert_one(dc_doc)
    ret_doc["dc_number"] = dc_num

    await log_audit("purchase_return", "purchases", return_num, f"Returned {quantity} KG from lot {lot_number} to {lot.get('supplier_name')} (DC {dc_num})", user=current_user.get("name"))
    return ret_doc

@router.get("/returns")
async def list_purchase_returns(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    returns = await (await db.get_collection("purchase_returns").find()).to_list()
    returns.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return returns

