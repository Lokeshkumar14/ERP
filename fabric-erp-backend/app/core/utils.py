from datetime import datetime
from typing import Dict, Any, Optional
from app.core.database import get_database

async def get_next_sequence(seq_name: str, prefix: str = "", padding: int = 4) -> str:
    db = get_database()
    counters = db.get_collection("counters")
    doc = await counters.find_one({"name": seq_name})
    if not doc:
        val = 1001
        await counters.insert_one({"name": seq_name, "seq": val})
    else:
        val = doc.get("seq", 1000) + 1
        await counters.update_one({"name": seq_name}, {"$set": {"seq": val}})
    return f"{prefix}{str(val).zfill(padding)}"

async def log_audit(action: str, module: str, record_id: str, details: str = "", user: str = "Admin Owner", before: Any = None, after: Any = None):
    try:
        db = get_database()
        audit_col = db.get_collection("audit_logs")
        entry = {
            "action": action,
            "module": module,
            "record_id": str(record_id),
            "details": details,
            "user": user,
            "before": before,
            "after": after,
            "created_at": datetime.utcnow().isoformat()
        }
        await audit_col.insert_one(entry)
    except Exception as e:
        print(f"Audit log failed: {e}")

def calculate_gst(taxable_value: float, is_interstate: bool = False, rate_pct: float = 5.0) -> Dict[str, float]:
    """Calculate CGST, SGST and IGST according to Indian GST regulations."""
    total_tax = round(taxable_value * (rate_pct / 100.0), 2)
    if is_interstate:
        return {
            "cgst_pct": 0.0,
            "cgst_amount": 0.0,
            "sgst_pct": 0.0,
            "sgst_amount": 0.0,
            "igst_pct": rate_pct,
            "igst_amount": total_tax,
            "total_tax": total_tax,
            "grand_total": round(taxable_value + total_tax, 2)
        }
    else:
        half_rate = rate_pct / 2.0
        half_tax = round(total_tax / 2.0, 2)
        return {
            "cgst_pct": half_rate,
            "cgst_amount": half_tax,
            "sgst_pct": half_rate,
            "sgst_amount": half_tax,
            "igst_pct": 0.0,
            "igst_amount": 0.0,
            "total_tax": total_tax,
            "grand_total": round(taxable_value + total_tax, 2)
        }
