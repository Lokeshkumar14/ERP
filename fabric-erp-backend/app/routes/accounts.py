from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import PaymentCreate
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/accounts", tags=["Accounts & Payment Management"])

@router.get("/payments")
async def list_payments(payment_type: Optional[str] = None, party_id: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("payments")
    query = {}
    if payment_type:
        query["payment_type"] = payment_type
    if party_id:
        query["party_id"] = party_id
    cursor = await col.find(query)
    payments = await cursor.to_list()
    payments.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return payments

@router.post("/payments")
async def record_payment(payment_in: PaymentCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("payments")

    prefix = "REC-" if payment_in.payment_type == "customer_receipt" else "PAY-" if "payment" in payment_in.payment_type else "EXP-"
    pay_num = payment_in.payment_number
    if not pay_num:
        pay_num = await get_next_sequence("payment_number", prefix=prefix)

    doc = payment_in.model_dump()
    doc["payment_number"] = pay_num
    doc["payment_date"] = doc.get("payment_date") or datetime.utcnow().strftime("%Y-%m-%d")

    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id

    # Allocate against invoice if provided
    if payment_in.allocated_invoice_id:
        inv_col = db.get_collection("invoices")
        inv = await inv_col.find_one({"_id": payment_in.allocated_invoice_id})
        if inv:
            new_paid = inv.get("paid_amount", 0.0) + payment_in.amount
            grand = inv.get("grand_total", 0.0)
            new_out = max(0.0, round(grand - new_paid, 2))
            new_status = "paid" if new_out <= 0 else "partially_paid"
            await inv_col.update_one(
                {"_id": payment_in.allocated_invoice_id},
                {
                    "$set": {
                        "paid_amount": round(new_paid, 2),
                        "outstanding_amount": new_out,
                        "payment_status": new_status
                    }
                }
            )

    # Update ledger balance of customer or supplier
    if payment_in.party_id:
        if payment_in.payment_type == "customer_receipt":
            cust_col = db.get_collection("customers")
            await cust_col.update_one({"_id": payment_in.party_id}, {"$inc": {"current_balance": -payment_in.amount}})
        elif payment_in.payment_type in ("supplier_payment", "job_worker_payment"):
            party_col = db.get_collection("parties")
            await party_col.update_one({"_id": payment_in.party_id}, {"$inc": {"current_balance": -payment_in.amount}})

    await log_audit("payment", "accounts", res.inserted_id, f"Recorded {payment_in.payment_type} {pay_num} of ₹{payment_in.amount} for {payment_in.party_name}", user=current_user.get("name"))
    return doc

@router.get("/financial-overview")
async def get_financial_overview(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    invoices = await (await db.get_collection("invoices").find()).to_list()
    payments = await (await db.get_collection("payments").find()).to_list()

    sales_invoices = [i for i in invoices if i.get("invoice_type") == "sales"]
    purchase_invoices = [i for i in invoices if i.get("invoice_type") == "purchase"]
    jw_invoices = [i for i in invoices if i.get("invoice_type") == "job_work"]

    total_sales = sum(i.get("grand_total", 0.0) for i in sales_invoices)
    total_received = sum(p.get("amount", 0.0) for p in payments if p.get("payment_type") == "customer_receipt")
    receivables = sum(i.get("outstanding_amount", 0.0) for i in sales_invoices)

    total_purchases = sum(i.get("grand_total", 0.0) for i in purchase_invoices)
    total_jw_charges = sum(i.get("grand_total", 0.0) for i in jw_invoices)
    total_expenses = sum(p.get("amount", 0.0) for p in payments if p.get("payment_type") == "expense")
    payables = sum(i.get("outstanding_amount", 0.0) for i in purchase_invoices + jw_invoices)

    return {
        "summary": {
            "total_sales": round(total_sales, 2),
            "total_received": round(total_received, 2),
            "receivables": round(receivables, 2),
            "total_purchases": round(total_purchases, 2),
            "total_job_work": round(total_jw_charges, 2),
            "total_expenses": round(total_expenses, 2),
            "payables": round(payables, 2)
        },
        "recent_transactions": payments[:10]
    }

@router.get("/aging-report")
async def get_aging_report(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    invoices = await (await db.get_collection("invoices").find({"payment_status": {"$ne": "paid"}})).to_list()

    customer_aging = {"0_30": 0.0, "31_60": 0.0, "61_90": 0.0, "90_plus": 0.0, "total": 0.0, "items": []}
    supplier_aging = {"0_30": 0.0, "31_60": 0.0, "61_90": 0.0, "90_plus": 0.0, "total": 0.0, "items": []}

    now = datetime.utcnow()

    for inv in invoices:
        due = inv.get("outstanding_amount", 0.0)
        date_str = inv.get("invoice_date", "2026-01-01")
        try:
            inv_date = datetime.strptime(date_str[:10], "%Y-%m-%d")
            days = (now - inv_date).days
        except Exception:
            days = 15

        item_data = {
            "invoice_number": inv.get("invoice_number"),
            "party_name": inv.get("party_name"),
            "date": date_str,
            "days_old": days,
            "outstanding": due
        }

        target = customer_aging if inv.get("invoice_type") == "sales" else supplier_aging
        target["total"] += due
        target["items"].append(item_data)

        if days <= 30:
            target["0_30"] += due
        elif days <= 60:
            target["31_60"] += due
        elif days <= 90:
            target["61_90"] += due
        else:
            target["90_plus"] += due

    for k in ["0_30", "31_60", "61_90", "90_plus", "total"]:
        customer_aging[k] = round(customer_aging[k], 2)
        supplier_aging[k] = round(supplier_aging[k], 2)

    return {
        "customer_receivables_aging": customer_aging,
        "supplier_payables_aging": supplier_aging
    }

@router.get("/day-book")
async def get_day_book(date: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    today_str = date or datetime.utcnow().strftime("%Y-%m-%d")

    payments = await (await db.get_collection("payments").find({"payment_date": today_str})).to_list()
    invoices = await (await db.get_collection("invoices").find({"invoice_date": today_str})).to_list()
    dcs = await (await db.get_collection("delivery_challans").find({"dc_date": today_str})).to_list()

    return {
        "date": today_str,
        "vouchers_count": len(payments),
        "payments_and_receipts": payments,
        "invoices_count": len(invoices),
        "invoices": invoices,
        "challans_count": len(dcs),
        "delivery_challans": dcs
    }

