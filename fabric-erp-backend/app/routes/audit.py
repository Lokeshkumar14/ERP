from fastapi import APIRouter, Depends, Query
from typing import Dict, Any, List, Optional
from app.core.database import get_database
from app.routes.auth import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Logs & System History"])

@router.get("")
async def list_audit_logs(
    module: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(50, le=200),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = get_database()
    col = db.get_collection("audit_logs")
    query = {}
    if module:
        query["module"] = module
    if action:
        query["action"] = action
    
    cursor = await col.find(query)
    logs = await cursor.to_list()
    logs.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return logs[:limit]
