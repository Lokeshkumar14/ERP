from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import InvoiceCreate
from app.core.utils import get_next_sequence, calculate_gst, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/invoices", tags=["Invoice Management (Indian GST Compliant)"])

@router.get("")
async def list_invoices(invoice_type: Optional[str] = None, party_id: Optional[str] = None, status: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("invoices")
    query = {}
    if invoice_type:
        query["invoice_type"] = invoice_type
    if party_id:
        query["party_id"] = party_id
    if status:
        query["payment_status"] = status
    cursor = await col.find(query)
    invoices = await cursor.to_list()
    invoices.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return invoices

@router.post("")
async def create_invoice(invoice_in: InvoiceCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("invoices")

    prefix = "INV-SAL-" if invoice_in.invoice_type == "sales" else "INV-PUR-" if invoice_in.invoice_type == "purchase" else "INV-JW-"
    if invoice_in.invoice_type == "credit_note":
        prefix = "CN-"
    elif invoice_in.invoice_type == "debit_note":
        prefix = "DN-"

    inv_num = invoice_in.invoice_number
    if not inv_num:
        inv_num = await get_next_sequence(f"inv_{invoice_in.invoice_type}", prefix=prefix)

    # Process line items with GST
    items_data = []
    total_taxable = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_igst = 0.0
    total_invoice = 0.0

    for it in invoice_in.items:
        it_dict = it.model_dump()
        taxable = round(it.taxable_value, 2)
        gst = calculate_gst(taxable, is_interstate=invoice_in.is_interstate, rate_pct=it.cgst_pct + it.sgst_pct + it.igst_pct or 5.0)
        
        it_dict["taxable_value"] = taxable
        it_dict["cgst_pct"] = gst["cgst_pct"]
        it_dict["cgst_amount"] = gst["cgst_amount"]
        it_dict["sgst_pct"] = gst["sgst_pct"]
        it_dict["sgst_amount"] = gst["sgst_amount"]
        it_dict["igst_pct"] = gst["igst_pct"]
        it_dict["igst_amount"] = gst["igst_amount"]
        it_dict["total_amount"] = gst["grand_total"]

        total_taxable += taxable
        total_cgst += gst["cgst_amount"]
        total_sgst += gst["sgst_amount"]
        total_igst += gst["igst_amount"]
        total_invoice += gst["grand_total"]
        items_data.append(it_dict)

    doc = invoice_in.model_dump()
    doc["invoice_number"] = inv_num
    doc["invoice_date"] = doc.get("invoice_date") or datetime.utcnow().strftime("%Y-%m-%d")
    doc["items"] = items_data
    doc["total_taxable_value"] = round(total_taxable, 2)
    doc["total_cgst"] = round(total_cgst, 2)
    doc["total_sgst"] = round(total_sgst, 2)
    doc["total_igst"] = round(total_igst, 2)
    doc["total_tax_amount"] = round(total_cgst + total_sgst + total_igst, 2)
    doc["grand_total"] = round(total_invoice, 2)
    doc["paid_amount"] = 0.0
    doc["outstanding_amount"] = round(total_invoice, 2)
    doc["payment_status"] = "unpaid"  # unpaid, partially_paid, paid
    doc["status"] = "active"

    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id

    # Update customer or supplier balance
    if invoice_in.invoice_type == "sales":
        cust_col = db.get_collection("customers")
        await cust_col.update_one({"_id": invoice_in.party_id}, {"$inc": {"current_balance": total_invoice}})
    elif invoice_in.invoice_type in ("purchase", "job_work"):
        party_col = db.get_collection("parties")
        await party_col.update_one({"_id": invoice_in.party_id}, {"$inc": {"current_balance": total_invoice}})

    await log_audit("create", "invoices", res.inserted_id, f"Created {invoice_in.invoice_type.upper()} Invoice {inv_num} for {invoice_in.party_name} (₹{doc['grand_total']})", user=current_user.get("name"))
    return doc

@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("invoices")
    doc = await col.find_one({"_id": invoice_id})
    if not doc:
        doc = await col.find_one({"invoice_number": invoice_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return doc
