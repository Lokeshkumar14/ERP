from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

# --- Auth & User ---
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "owner"  # owner, accountant, purchase_manager, sales_executive, godown_staff
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: str
    role: str
    is_active: bool
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# --- Customer ---
class AddressModel(BaseModel):
    street: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    state_code: Optional[str] = ""
    pincode: Optional[str] = ""

class CustomerCreate(BaseModel):
    customer_code: Optional[str] = None
    name: str
    contact_person: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    gstin: Optional[str] = ""
    pan: Optional[str] = ""
    billing_address: Optional[AddressModel] = None
    shipping_addresses: Optional[List[AddressModel]] = []
    credit_limit: float = 0.0
    credit_days: int = 30
    opening_balance: float = 0.0
    status: str = "active"

class CustomerResponse(CustomerCreate):
    id: str = Field(alias="_id")
    current_balance: Optional[float] = 0.0
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# --- Party (Suppliers & Job Workers) ---
class PartyCreate(BaseModel):
    party_code: Optional[str] = None
    name: str
    party_types: List[str] = ["supplier"]  # "supplier", "job_worker"
    services: Optional[List[str]] = []     # "knitting", "washing", "compacting", "finishing", "dyeing"
    gstin: Optional[str] = ""
    contact_person: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[AddressModel] = None
    processing_rates: Optional[Dict[str, float]] = {}  # e.g. {"washing": 12.0, "compacting": 10.0}
    payment_terms: Optional[str] = "30 Days"
    bank_details: Optional[Dict[str, str]] = {}
    opening_balance: float = 0.0
    status: str = "active"

class PartyResponse(PartyCreate):
    id: str = Field(alias="_id")
    current_balance: Optional[float] = 0.0
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# --- Products & Variants ---
class ProductCreate(BaseModel):
    product_code: Optional[str] = None
    name: str
    category: str = "fabric"  # "fabric" or "yarn"
    composition: Optional[str] = "100% Cotton"
    structure: Optional[str] = "Single Jersey"
    default_gsm: Optional[float] = 160.0
    default_width: Optional[float] = 72.0
    unit: str = "KG"
    hsn_code: Optional[str] = "6006"
    status: str = "active"

class ProductResponse(ProductCreate):
    id: str = Field(alias="_id")
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

class ProductVariantCreate(BaseModel):
    product_id: str
    variant_code: Optional[str] = None
    fabric_name: Optional[str] = ""
    gsm: float = 160.0
    width: float = 72.0
    colour: str = "Black"
    composition: Optional[str] = "100% Cotton"
    unit: str = "KG"
    standard_rate: Optional[float] = 0.0

class ProductVariantResponse(ProductVariantCreate):
    id: str = Field(alias="_id")
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# --- Yarn Lots & Inventory ---
class YarnLotCreate(BaseModel):
    lot_number: str
    yarn_product_id: Optional[str] = None
    yarn_name: str
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = ""
    count: str = "30s"
    composition: Optional[str] = "100% Cotton"
    quantity_received: float = 0.0
    current_available_qty: float = 0.0
    unit: str = "KG"
    godown_id: Optional[str] = None
    received_at: Optional[str] = None

class YarnLotResponse(YarnLotCreate):
    id: str = Field(alias="_id")
    reserved_qty: Optional[float] = 0.0
    issued_qty: Optional[float] = 0.0

    class Config:
        populate_by_name = True

# --- Sales Orders ---
class SalesOrderItem(BaseModel):
    item_id: Optional[str] = None
    variant_id: Optional[str] = None
    fabric: str
    composition: Optional[str] = "100% Cotton"
    gsm: float
    width: Optional[float] = 72.0
    colour: str
    quantity: float
    unit_rate: float
    discount_pct: Optional[float] = 0.0
    tax_pct: Optional[float] = 5.0
    total_amount: Optional[float] = 0.0
    delivery_date: Optional[str] = None
    produced_quantity: Optional[float] = 0.0
    delivered_quantity: Optional[float] = 0.0
    status: Optional[str] = "confirmed"

class SalesOrderCreate(BaseModel):
    order_number: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = ""
    order_type: str = "made_to_order"  # "made_to_order" or "stock_based"
    order_date: Optional[str] = None
    required_delivery_date: Optional[str] = None
    payment_terms: Optional[str] = "30 Days"
    delivery_address: Optional[AddressModel] = None
    items: List[SalesOrderItem]
    remarks: Optional[str] = ""

class SalesOrderResponse(SalesOrderCreate):
    id: str = Field(alias="_id")
    total_quantity: float = 0.0
    subtotal: float = 0.0
    tax_amount: float = 0.0
    grand_total: float = 0.0
    status: str = "confirmed"  # Draft, Confirmed, Planning, In Production, Partially Ready, Ready for Delivery, Partially Delivered, Completed, Cancelled
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# --- Purchase Orders & Goods Receipts ---
class PurchaseOrderItem(BaseModel):
    yarn_product_id: Optional[str] = None
    yarn_name: str
    count: str = "30s"
    composition: Optional[str] = "100% Cotton"
    quantity: float
    rate: float
    tax_pct: Optional[float] = 5.0
    total_amount: Optional[float] = 0.0
    received_quantity: Optional[float] = 0.0

class PurchaseOrderCreate(BaseModel):
    purchase_number: Optional[str] = None
    supplier_id: str
    supplier_name: Optional[str] = ""
    purchase_date: Optional[str] = None
    expected_delivery_date: Optional[str] = None
    items: List[PurchaseOrderItem]
    remarks: Optional[str] = ""

class PurchaseOrderResponse(PurchaseOrderCreate):
    id: str = Field(alias="_id")
    total_amount: float = 0.0
    status: str = "confirmed"  # Draft, Confirmed, Partially Received, Fully Received, Cancelled
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

class GoodsReceiptCreate(BaseModel):
    receipt_number: Optional[str] = None
    purchase_order_id: Optional[str] = None
    supplier_id: str
    supplier_name: Optional[str] = ""
    supplier_dc: Optional[str] = ""
    yarn_name: str
    count: str
    lot_number: str
    quantity_received: float
    accepted_quantity: float
    rejected_quantity: float = 0.0
    godown_id: Optional[str] = None
    godown_name: Optional[str] = "Main Yarn Godown"
    remarks: Optional[str] = ""

class GoodsReceiptResponse(GoodsReceiptCreate):
    id: str = Field(alias="_id")
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# --- Production Batches & Process Engine ---
class ProductionBatchCreate(BaseModel):
    batch_number: Optional[str] = None
    source_type: str = "sales_order"  # "sales_order" or "stock_production"
    source_order_id: Optional[str] = None
    source_order_number: Optional[str] = None
    fabric_name: str
    colour: str
    gsm: float
    width: Optional[float] = 72.0
    planned_quantity: float
    process_route: List[str] = ["knitting", "washing", "compacting", "finishing"]
    notes: Optional[str] = ""

class ProductionBatchResponse(ProductionBatchCreate):
    id: str = Field(alias="_id")
    current_process: str = "knitting"
    status: str = "in_progress"  # "planning", "in_progress", "completed", "cancelled"
    completed_quantity: Optional[float] = 0.0
    total_cost: Optional[float] = 0.0
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# --- Job Work Orders & Receipts ---
class JobWorkOrderCreate(BaseModel):
    job_number: Optional[str] = None
    batch_id: str
    batch_number: Optional[str] = ""
    process_type: str  # knitting, washing, compacting, finishing, dyeing
    job_worker_id: str
    job_worker_name: Optional[str] = ""
    expected_quantity: float
    rate_per_kg: float
    expected_date: Optional[str] = None
    input_rolls: Optional[List[str]] = []
    yarn_lot_number: Optional[str] = None
    yarn_issued_qty: Optional[float] = 0.0
    instructions: Optional[str] = ""

class JobWorkReceiptCreate(BaseModel):
    job_work_id: str
    received_quantity: float
    rejected_quantity: float = 0.0
    returned_input_quantity: float = 0.0  # returned unused yarn or fabric
    loss_quantity: float = 0.0
    rolls_count: int = 1
    measured_gsm: Optional[float] = None
    measured_width: Optional[float] = None
    quality_status: str = "approved"  # approved, hold, rework, rejected
    receipt_dc: Optional[str] = ""
    remarks: Optional[str] = ""

# --- Fabric Rolls ---
class FabricRollCreate(BaseModel):
    roll_number: Optional[str] = None
    batch_id: Optional[str] = None
    batch_number: Optional[str] = ""
    sales_order_id: Optional[str] = None
    sales_order_number: Optional[str] = None
    fabric_name: str
    composition: Optional[str] = "100% Cotton"
    gsm: float
    width: float = 72.0
    colour: str
    original_weight: float
    current_weight: float
    current_process: str = "knitting"
    current_location: str = "Main Godown"
    quality_status: str = "approved"  # approved, hold, rejected, rework
    is_reserved: bool = False
    is_delivered: bool = False

class FabricRollSplit(BaseModel):
    roll_id: str
    split_weights: List[float]  # e.g. [12.5, 12.5] from a 25kg roll

class FabricRollMerge(BaseModel):
    roll_ids: List[str]  # e.g. ["roll1", "roll2"]

class FabricRollResponse(FabricRollCreate):
    id: str = Field(alias="_id")
    parent_roll_ids: Optional[List[str]] = []
    child_roll_ids: Optional[List[str]] = []
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# --- Quality Control ---
class QualityInspectionCreate(BaseModel):
    inspection_number: Optional[str] = None
    stage: str  # knitting, washing, compacting, finishing, final
    batch_id: Optional[str] = None
    roll_id: Optional[str] = None
    roll_number: Optional[str] = None
    target_gsm: Optional[float] = None
    actual_gsm: float
    target_width: Optional[float] = None
    actual_width: float
    shade_match: str = "matched"  # matched, variation_acceptable, rejected
    shrinkage_length_pct: Optional[float] = 0.0
    shrinkage_width_pct: Optional[float] = 0.0
    defects: Optional[List[str]] = []  # holes, oil stains, needle marks, slubs
    quality_status: str = "approved"   # approved, rejected, hold, rework
    inspector_name: str = "QC Inspector"
    remarks: Optional[str] = ""

class QualityInspectionResponse(QualityInspectionCreate):
    id: str = Field(alias="_id")
    inspected_at: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        populate_by_name = True

# --- Delivery Challans ---
class DeliveryChallanCreate(BaseModel):
    dc_number: Optional[str] = None
    dc_type: str  # yarn_issue, yarn_return, job_work_issue, job_work_return, godown_transfer, customer_delivery
    dc_date: Optional[str] = None
    party_id: Optional[str] = None
    party_name: Optional[str] = ""
    from_location: str
    to_location: str
    transporter: Optional[str] = ""
    vehicle_number: Optional[str] = ""
    eway_bill_number: Optional[str] = ""
    reference_job_number: Optional[str] = ""
    reference_order_number: Optional[str] = ""
    item_description: str
    roll_numbers: Optional[List[str]] = []
    quantity: float
    unit: str = "KG"
    prepared_by: str = "Logistics Team"
    remarks: Optional[str] = ""

# --- Invoices (GST Compliant) ---
class InvoiceLineItem(BaseModel):
    description: str
    hsn_sac: str = "6006"
    quantity: float
    unit: str = "KG"
    rate: float
    discount: float = 0.0
    taxable_value: float
    cgst_pct: float = 2.5
    cgst_amount: float = 0.0
    sgst_pct: float = 2.5
    sgst_amount: float = 0.0
    igst_pct: float = 0.0
    igst_amount: float = 0.0
    total_amount: float

class InvoiceCreate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_type: str  # sales, purchase, job_work, debit_note, credit_note
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    party_id: str
    party_name: str
    party_gstin: Optional[str] = ""
    party_state: Optional[str] = ""
    party_state_code: Optional[str] = ""
    billing_address: Optional[AddressModel] = None
    shipping_address: Optional[AddressModel] = None
    reference_dc_number: Optional[str] = ""
    reference_order_number: Optional[str] = ""
    items: List[InvoiceLineItem]
    is_interstate: bool = False
    payment_terms: Optional[str] = "30 Days"
    notes: Optional[str] = ""

# --- Payments & Accounts ---
class PaymentCreate(BaseModel):
    payment_number: Optional[str] = None
    payment_type: str  # customer_receipt, supplier_payment, job_worker_payment, expense
    party_id: Optional[str] = None
    party_name: Optional[str] = ""
    amount: float
    payment_date: Optional[str] = None
    payment_mode: str = "Bank Transfer"  # Bank Transfer, Cheque, UPI, Cash
    reference_number: Optional[str] = ""
    allocated_invoice_id: Optional[str] = None
    allocated_invoice_number: Optional[str] = None
    category: Optional[str] = ""  # transport, labour, loading, general
    notes: Optional[str] = ""

class GodownCreate(BaseModel):
    godown_code: Optional[str] = None
    name: str
    location: str
    contact_person: Optional[str] = ""
    phone: Optional[str] = ""
    capacity_kg: Optional[float] = 50000.0
    status: str = "active"
