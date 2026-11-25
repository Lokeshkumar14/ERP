from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from app.core.database import get_database
from app.models.schemas import CustomerCreate, CustomerResponse
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/customers", tags=["Customer Management"])

@router.get("", response_model=List[CustomerResponse])
async def list_customers(current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    cursor = await db.get_collection("customers").find()
    return await cursor.to_list()

@router.post("", response_model=CustomerResponse)
async def create_customer(customer_in: CustomerCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("customers")
    
    code = (customer_in.customer_code or "").strip()
    if not code:
        code = await get_next_sequence("customer_code", prefix="CUS-")
    else:
        existing = await col.find_one({"customer_code": code})
        if existing:
            # If code is already taken, auto-assign next available sequence code
            code = await get_next_sequence("customer_code", prefix="CUS-")
    
    doc = customer_in.model_dump()
    doc["customer_code"] = code
    doc["current_balance"] = customer_in.opening_balance
    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_audit("create", "customers", res.inserted_id, f"Created customer {doc['name']} ({code})", user=current_user.get("name"))
    return doc

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    doc = await db.get_collection("customers").find_one({"_id": customer_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    return doc

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: str, customer_in: CustomerCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("customers")
    existing = await col.find_one({"_id": customer_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_in.model_dump(exclude_unset=True)
    await col.update_one({"_id": customer_id}, {"$set": update_data})
    updated = await col.find_one({"_id": customer_id})
    await log_audit("update", "customers", customer_id, f"Updated customer {customer_in.name}", user=current_user.get("name"))
    return updated

@router.get("/{customer_id}/ledger")
async def get_customer_ledger(customer_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    cust = await db.get_collection("customers").find_one({"_id": customer_id})
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Invoices & receipts
    invoices = await (await db.get_collection("invoices").find({"party_id": customer_id, "invoice_type": "sales"})).to_list()
    payments = await (await db.get_collection("payments").find({"party_id": customer_id, "payment_type": "customer_receipt"})).to_list()

    entries = []
    running_balance = cust.get("opening_balance", 0.0)
    entries.append({
        "date": cust.get("created_at", "2026-01-01")[:10],
        "type": "Opening Balance",
        "reference": "OP-BAL",
        "debit": running_balance if running_balance > 0 else 0,
        "credit": abs(running_balance) if running_balance < 0 else 0,
        "balance": running_balance
    })

    for inv in invoices:
        amount = sum(item.get("total_amount", 0) for item in inv.get("items", []))
        running_balance += amount
        entries.append({
            "date": inv.get("invoice_date", "")[:10],
            "type": "Sales Invoice",
            "reference": inv.get("invoice_number", ""),
            "debit": amount,
            "credit": 0.0,
            "balance": round(running_balance, 2)
        })

    for pay in payments:
        amount = pay.get("amount", 0.0)
        running_balance -= amount
        entries.append({
            "date": pay.get("payment_date", "")[:10],
            "type": "Customer Payment",
            "reference": pay.get("payment_number", ""),
            "debit": 0.0,
            "credit": amount,
            "balance": round(running_balance, 2)
        })

    return {
        "customer": cust,
        "current_balance": round(running_balance, 2),
        "ledger": sorted(entries, key=lambda x: x["date"])
    }

@router.get("/{customer_id}/history")
async def get_customer_history(customer_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    cust = await db.get_collection("customers").find_one({"_id": customer_id})
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    orders = await (await db.get_collection("sales_orders").find({"customer_id": customer_id})).to_list()
    invoices = await (await db.get_collection("invoices").find({"party_id": customer_id, "invoice_type": "sales"})).to_list()
    deliveries = await (await db.get_collection("sales_deliveries").find({"customer_id": customer_id})).to_list()

    return {
        "customer": cust,
        "orders_count": len(orders),
        "orders": orders,
        "invoices_count": len(invoices),
        "invoices": invoices,
        "deliveries_count": len(deliveries),
        "deliveries": deliveries
    }

@router.post("/{customer_id}/price-list")
async def set_customer_price(customer_id: str, payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("customer_prices")
    cust = await db.get_collection("customers").find_one({"_id": customer_id})
    if not cust:
        # Also check customer_code
        cust = await db.get_collection("customers").find_one({"customer_code": customer_id})
        if cust:
            customer_id = cust["_id"]

    raw_rate = payload.get("special_rate")
    try:
        if raw_rate is None or raw_rate == "":
            rate = 0.0
        else:
            rate = float(raw_rate)
    except (ValueError, TypeError):
        rate = 0.0

    fabric_name = (payload.get("fabric_name") or "Single Jersey").strip()
    colour = (payload.get("colour") or "Standard").strip()

    doc = {
        "customer_id": customer_id,
        "customer_name": cust.get("name") if cust else "",
        "fabric_name": fabric_name,
        "gsm": payload.get("gsm"),
        "colour": colour,
        "special_rate": rate,
        "updated_at": datetime.utcnow().isoformat()
    }
    await col.update_one(
        {"customer_id": customer_id, "fabric_name": fabric_name, "colour": colour},
        {"$set": doc},
        upsert=True
    )
    cust_label = cust.get("name") if cust else customer_id
    await log_audit("price_update", "customer_prices", customer_id, f"Saved rate ₹{rate}/KG for {cust_label} ({fabric_name} - {colour})", user=current_user.get("name"))
    return {"message": "Customer price list updated successfully", "doc": doc}

@router.delete("/{customer_id}/price-list/{price_id}")
async def delete_customer_price(customer_id: str, price_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("customer_prices")
    res = await col.delete_one({"_id": price_id, "customer_id": customer_id})
    if not res:
        # Try matching by _id alone
        res = await col.delete_one({"_id": price_id})
    return {"message": "Customer price removed successfully"}

@router.get("/{customer_id}/price-list")
async def get_customer_price_list(customer_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("customer_prices")
    prices = await (await col.find({"customer_id": customer_id})).to_list()
    if not prices:
        # Check by customer_code if id was code
        cust = await db.get_collection("customers").find_one({"customer_code": customer_id})
        if cust:
            prices = await (await col.find({"customer_id": cust["_id"]})).to_list()
    return prices

