from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from app.core.database import get_database
from app.models.schemas import ProductCreate, ProductResponse, ProductVariantCreate, ProductVariantResponse
from app.core.utils import get_next_sequence, log_audit
from app.routes.auth import get_current_user

router = APIRouter(prefix="/products", tags=["Product & Fabric Master"])

@router.get("", response_model=List[ProductResponse])
async def list_products(category: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("products")
    query = {"category": category} if category else {}
    cursor = await col.find(query)
    return await cursor.to_list()

@router.post("", response_model=ProductResponse)
async def create_product(product_in: ProductCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("products")

    code = product_in.product_code
    if not code:
        prefix = "YRN-" if product_in.category == "yarn" else "FAB-"
        code = await get_next_sequence("product_code", prefix=prefix)

    doc = product_in.model_dump()
    doc["product_code"] = code
    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_audit("create", "products", res.inserted_id, f"Created product {doc['name']} ({code})", user=current_user.get("name"))
    return doc

@router.get("/variants", response_model=List[ProductVariantResponse])
async def list_variants(product_id: Optional[str] = None, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("product_variants")
    query = {"product_id": product_id} if product_id else {}
    cursor = await col.find(query)
    return await cursor.to_list()

@router.post("/variants", response_model=ProductVariantResponse)
async def create_variant(variant_in: ProductVariantCreate, current_user: Dict[str, Any] = Depends(get_current_user)):
    db = get_database()
    col = db.get_collection("product_variants")

    code = variant_in.variant_code
    if not code:
        code = await get_next_sequence("variant_code", prefix="VAR-")

    doc = variant_in.model_dump()
    doc["variant_code"] = code
    res = await col.insert_one(doc)
    doc["_id"] = res.inserted_id
    await log_audit("create", "product_variants", res.inserted_id, f"Created variant {code} for {variant_in.fabric_name}", user=current_user.get("name"))
    return doc
