from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import get_database
from app.models.schemas import QualityInspectionCreate, QualityInspectionResponse
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/quality", tags=["Quality Management & QC"])

@router.get("/inspections")
async def list_inspections(stage: Optional[str] = None, status: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("quality_inspections")
    query = {}
    if stage:
        query["stage"] = stage
    if status:
        query["quality_status"] = status
    cursor = await col.find(query)
    inspections = await cursor.to_list()
    inspections.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return inspections

@router.post("/inspections")
async def create_inspection(insp_in: QualityInspectionCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("quality_inspections")

    insp_num = insp_in.inspection_number
    if not insp_num:
        insp_num = await get_next_sequence("qc_number", prefix="QC-")

    doc = insp_in.model_dump()
    doc["inspection_number"] = insp_num
    doc["inspected_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id

    # If linked to a roll, update roll's quality status
    if insp_in.roll_id:
        rolls_col = db.get_collection("fabric_rolls")
        await rolls_col.update_one(
            {"_id": insp_in.roll_id},
            {
                "$set": {
                    "quality_status": insp_in.quality_status,
                    "measured_gsm": insp_in.actual_gsm,
                    "measured_width": insp_in.actual_width
                }
            }
        )

    await log_audit("quality_inspection", "quality", res.inserted_id, f"QC Inspection {insp_num} - Status: {insp_in.quality_status.upper()} (Roll {insp_in.roll_number})", user=current_user.get("name"))
    return doc
