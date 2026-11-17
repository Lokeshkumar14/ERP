from fastapi import APIRouter
from app.core.database import get_database
from app.core.security import hash_password

router = APIRouter(prefix="/seed", tags=["Initial Seed Data"])

@router.post("")
async def seed_initial_data():
    db = get_database()
    users_col = db.get_collection("users")
    
    # Check if already seeded
    existing_owner = await users_col.find_one({"email": "owner@textilepro.com"})
    if existing_owner:
        return {"message": "Database already seeded with demo data."}

    # 1. Users
    users = [
        {
            "_id": "usr_owner_01",
            "name": "Lokesh Kumar",
            "email": "owner@textilepro.com",
            "password_hash": hash_password("password123"),
            "role": "owner",
            "is_active": True,
            "created_at": "2026-01-10T09:00:00"
        },
        {
            "_id": "usr_accountant_02",
            "name": "Ramesh Accountant",
            "email": "accountant@textilepro.com",
            "password_hash": hash_password("password123"),
            "role": "accountant",
            "is_active": True,
            "created_at": "2026-01-11T10:00:00"
        },
        {
            "_id": "usr_purchasemanager_03",
            "name": "Karthik Purchase",
            "email": "purchase@textilepro.com",
            "password_hash": hash_password("password123"),
            "role": "purchase_manager",
            "is_active": True,
            "created_at": "2026-01-12T11:00:00"
        },
        {
            "_id": "usr_salesexec_04",
            "name": "Priya Sales",
            "email": "sales@textilepro.com",
            "password_hash": hash_password("password123"),
            "role": "sales_executive",
            "is_active": True,
            "created_at": "2026-01-13T12:00:00"
        },
        {
            "_id": "usr_godownstaff_05",
            "name": "Murugan Godown",
            "email": "godown@textilepro.com",
            "password_hash": hash_password("password123"),
            "role": "godown_staff",
            "is_active": True,
            "created_at": "2026-01-14T14:00:00"
        }
    ]
    await users_col.insert_many(users)

    # 2. Customers
    customers_col = db.get_collection("customers")
    customers = [
        {
            "_id": "cus_01",
            "customer_code": "CUS-1001",
            "name": "ABC Textiles",
            "contact_person": "Anand Mohan",
            "phone": "+91 98450 11223",
            "email": "orders@abctextiles.in",
            "gstin": "33AAACA1234A1Z5",
            "billing_address": {"street": "12 Mill Road", "city": "Tirupur", "state": "Tamil Nadu", "state_code": "33", "pincode": "641602"},
            "credit_limit": 500000.0,
            "credit_days": 30,
            "opening_balance": 25000.0,
            "current_balance": 185000.0,
            "status": "active"
        },
        {
            "_id": "cus_02",
            "customer_code": "CUS-1002",
            "name": "XYZ Apparel",
            "contact_person": "Vikram Singh",
            "phone": "+91 97890 22334",
            "email": "procurement@xyzapparel.com",
            "gstin": "29AABCX5678B1Z2",
            "billing_address": {"street": "45 Peenya Industrial Area", "city": "Bengaluru", "state": "Karnataka", "state_code": "29", "pincode": "560058"},
            "credit_limit": 800000.0,
            "credit_days": 45,
            "opening_balance": 0.0,
            "current_balance": 220000.0,
            "status": "active"
        },
        {
            "_id": "cus_03",
            "customer_code": "CUS-1003",
            "name": "Fashion House",
            "contact_person": "Meera Shah",
            "phone": "+91 98200 33445",
            "email": "contact@fashionhouse.co",
            "gstin": "27AAACF9012C1Z8",
            "billing_address": {"street": "88 Lower Parel", "city": "Mumbai", "state": "Maharashtra", "state_code": "27", "pincode": "400013"},
            "credit_limit": 1000000.0,
            "credit_days": 60,
            "opening_balance": 50000.0,
            "current_balance": 50000.0,
            "status": "active"
        },
        {
            "_id": "cus_04",
            "customer_code": "CUS-1004",
            "name": "Global Fabrics",
            "contact_person": "Dharmesh Patel",
            "phone": "+91 99090 44556",
            "email": "dharmesh@globalfabrics.in",
            "gstin": "24AAACG3456D1Z1",
            "billing_address": {"street": "23 Ring Road", "city": "Surat", "state": "Gujarat", "state_code": "24", "pincode": "395002"},
            "credit_limit": 600000.0,
            "credit_days": 30,
            "opening_balance": 0.0,
            "current_balance": 140000.0,
            "status": "active"
        }
    ]
    await customers_col.insert_many(customers)

    # 3. Parties (Suppliers & Job Workers)
    parties_col = db.get_collection("parties")
    parties = [
        {
            "_id": "sup_01",
            "party_code": "SUP-1001",
            "name": "Surya Spinning Mills",
            "party_types": ["supplier"],
            "gstin": "33AAACS1122E1Z3",
            "contact_person": "S. Sundaram",
            "phone": "+91 94433 11100",
            "email": "sales@suryaspinning.com",
            "address": {"city": "Coimbatore", "state": "Tamil Nadu", "state_code": "33"},
            "current_balance": 180000.0,
            "status": "active"
        },
        {
            "_id": "jw_01",
            "party_code": "JW-1001",
            "name": "Sri Lakshmi Knitting Works",
            "party_types": ["job_worker"],
            "services": ["knitting"],
            "gstin": "33AAACL3344F1Z4",
            "contact_person": "N. Lakshmi",
            "phone": "+91 98422 22200",
            "processing_rates": {"knitting": 14.50},
            "address": {"city": "Tirupur", "state": "Tamil Nadu", "state_code": "33"},
            "current_balance": 28000.0,
            "status": "active"
        },
        {
            "_id": "jw_02",
            "party_code": "JW-1002",
            "name": "Apex Fabric Processors",
            "party_types": ["job_worker"],
            "services": ["washing", "compacting"],
            "gstin": "33AAACA5566G1Z5",
            "contact_person": "R. Ravichandran",
            "phone": "+91 97911 33300",
            "processing_rates": {"washing": 12.00, "compacting": 10.50},
            "address": {"city": "Perundurai", "state": "Tamil Nadu", "state_code": "33"},
            "current_balance": 45000.0,
            "status": "active"
        },
        {
            "_id": "jw_03",
            "party_code": "JW-1003",
            "name": "Royal Fabric Finishers",
            "party_types": ["job_worker"],
            "services": ["finishing", "dyeing"],
            "gstin": "33AAACR7788H1Z6",
            "contact_person": "K. Govind",
            "phone": "+91 99444 44400",
            "processing_rates": {"finishing": 15.00, "dyeing": 42.00},
            "address": {"city": "Erode", "state": "Tamil Nadu", "state_code": "33"},
            "current_balance": 32000.0,
            "status": "active"
        }
    ]
    await parties_col.insert_many(parties)

    # 4. Products & Variants
    products_col = db.get_collection("products")
    products = [
        {"_id": "prod_f01", "product_code": "FAB-1001", "name": "Single Jersey", "category": "fabric", "composition": "100% Cotton", "default_gsm": 160.0, "unit": "KG"},
        {"_id": "prod_f02", "product_code": "FAB-1002", "name": "French Terry", "category": "fabric", "composition": "100% Cotton", "default_gsm": 240.0, "unit": "KG"},
        {"_id": "prod_f03", "product_code": "FAB-1003", "name": "Loop Knit", "category": "fabric", "composition": "95% Cotton 5% Spandex", "default_gsm": 220.0, "unit": "KG"},
        {"_id": "prod_f04", "product_code": "FAB-1004", "name": "Rib 1x1", "category": "fabric", "composition": "100% Cotton", "default_gsm": 200.0, "unit": "KG"},
        {"_id": "prod_y01", "product_code": "YRN-1001", "name": "Cotton Combed Yarn", "category": "yarn", "composition": "100% Cotton", "unit": "KG"},
        {"_id": "prod_y02", "product_code": "YRN-1002", "name": "Polyester Spun Yarn", "category": "yarn", "composition": "100% Polyester", "unit": "KG"}
    ]
    await products_col.insert_many(products)

    # 5. Yarn Lots
    lots_col = db.get_collection("yarn_lots")
    lots = [
        {
            "_id": "lot_01",
            "lot_number": "LOT-COT-301",
            "yarn_name": "Cotton 30s Combed",
            "supplier_id": "sup_01",
            "supplier_name": "Surya Spinning Mills",
            "count": "30s",
            "quantity_received": 1500.0,
            "current_available_qty": 750.0,
            "reserved_qty": 300.0,
            "issued_qty": 450.0,
            "unit": "KG",
            "godown_name": "Main Yarn Godown",
            "received_at": "2026-02-01"
        },
        {
            "_id": "lot_02",
            "lot_number": "LOT-COT-402",
            "yarn_name": "Cotton 40s Combed",
            "supplier_id": "sup_01",
            "supplier_name": "Surya Spinning Mills",
            "count": "40s",
            "quantity_received": 1200.0,
            "current_available_qty": 900.0,
            "reserved_qty": 100.0,
            "issued_qty": 200.0,
            "unit": "KG",
            "godown_name": "Main Yarn Godown",
            "received_at": "2026-02-05"
        },
        {
            "_id": "lot_03",
            "lot_number": "LOT-POLY-103",
            "yarn_name": "Polyester 30s",
            "supplier_id": "sup_01",
            "supplier_name": "Surya Spinning Mills",
            "count": "30s",
            "quantity_received": 600.0,
            "current_available_qty": 150.0,
            "reserved_qty": 50.0,
            "issued_qty": 400.0,
            "unit": "KG",
            "godown_name": "Main Yarn Godown",
            "received_at": "2026-02-10"
        }
    ]
    await lots_col.insert_many(lots)

    # 6. Godowns
    godowns_col = db.get_collection("godowns")
    godowns = [
        {"_id": "gdn_01", "godown_code": "GDN-01", "name": "Main Yarn Godown", "location": "Unit 1, Ground Floor", "contact_person": "Murugan G.", "status": "active"},
        {"_id": "gdn_02", "godown_code": "GDN-02", "name": "Knitting Transit Godown", "location": "Tirupur Cluster", "contact_person": "K. Velu", "status": "active"},
        {"_id": "gdn_03", "godown_code": "GDN-03", "name": "Main Finished Goods Godown", "location": "Unit 2, Warehouse B", "contact_person": "S. Rajan", "status": "active"},
        {"_id": "gdn_04", "godown_code": "GDN-04", "name": "Rejection & Hold Godown", "location": "Unit 2, Quarantine Area", "contact_person": "QC Team", "status": "active"}
    ]
    await godowns_col.insert_many(godowns)

    # 7. Fabric Rolls
    rolls_col = db.get_collection("fabric_rolls")
    rolls = [
        {
            "_id": "roll_01",
            "roll_number": "ROLL-1001",
            "batch_number": "BATCH-1001",
            "fabric_name": "Single Jersey",
            "gsm": 160.0,
            "width": 72.0,
            "colour": "Black",
            "original_weight": 25.4,
            "current_weight": 25.4,
            "current_process": "finished",
            "current_location": "Main Finished Goods Godown",
            "quality_status": "approved",
            "is_reserved": False,
            "is_delivered": False
        },
        {
            "_id": "roll_02",
            "roll_number": "ROLL-1002",
            "batch_number": "BATCH-1001",
            "fabric_name": "Single Jersey",
            "gsm": 160.0,
            "width": 72.0,
            "colour": "Black",
            "original_weight": 24.8,
            "current_weight": 24.8,
            "current_process": "finished",
            "current_location": "Main Finished Goods Godown",
            "quality_status": "approved",
            "is_reserved": False,
            "is_delivered": False
        },
        {
            "_id": "roll_03",
            "roll_number": "ROLL-1003",
            "batch_number": "BATCH-1002",
            "fabric_name": "French Terry",
            "gsm": 240.0,
            "width": 72.0,
            "colour": "Navy Blue",
            "original_weight": 28.5,
            "current_weight": 28.5,
            "current_process": "finishing",
            "current_location": "Processing Transit Godown",
            "quality_status": "approved",
            "is_reserved": False,
            "is_delivered": False
        },
        {
            "_id": "roll_04",
            "roll_number": "ROLL-1004",
            "batch_number": "BATCH-1002",
            "fabric_name": "French Terry",
            "gsm": 240.0,
            "width": 72.0,
            "colour": "Navy Blue",
            "original_weight": 27.9,
            "current_weight": 27.9,
            "current_process": "washing",
            "current_location": "Processing Transit Godown",
            "quality_status": "approved",
            "is_reserved": False,
            "is_delivered": False
        }
    ]
    await rolls_col.insert_many(rolls)

    # 8. Sales Orders
    orders_col = db.get_collection("sales_orders")
    orders = [
        {
            "_id": "so_01",
            "order_number": "SO-2001",
            "customer_id": "cus_01",
            "customer_name": "ABC Textiles",
            "order_type": "made_to_order",
            "order_date": "2026-02-12",
            "required_delivery_date": "2026-03-05",
            "items": [
                {
                    "item_id": "SO-2001-ITM-1",
                    "fabric": "Single Jersey",
                    "gsm": 160.0,
                    "colour": "Black",
                    "quantity": 500.0,
                    "unit_rate": 350.0,
                    "total_amount": 183750.0,
                    "status": "In Production"
                }
            ],
            "total_quantity": 500.0,
            "subtotal": 175000.0,
            "tax_amount": 8750.0,
            "grand_total": 183750.0,
            "status": "In Production"
        },
        {
            "_id": "so_02",
            "order_number": "SO-2002",
            "customer_id": "cus_02",
            "customer_name": "XYZ Apparel",
            "order_type": "stock_based",
            "order_date": "2026-02-10",
            "required_delivery_date": "2026-02-25",
            "items": [
                {
                    "item_id": "SO-2002-ITM-1",
                    "fabric": "French Terry",
                    "gsm": 240.0,
                    "colour": "Navy Blue",
                    "quantity": 600.0,
                    "unit_rate": 380.0,
                    "total_amount": 239400.0,
                    "status": "Shipped"
                }
            ],
            "total_quantity": 600.0,
            "subtotal": 228000.0,
            "tax_amount": 11400.0,
            "grand_total": 239400.0,
            "status": "Partially Delivered"
        },
        {
            "_id": "so_03",
            "order_number": "SO-2003",
            "customer_id": "cus_03",
            "customer_name": "Fashion House",
            "order_type": "stock_based",
            "order_date": "2026-01-28",
            "required_delivery_date": "2026-02-14",
            "items": [
                {
                    "item_id": "SO-2003-ITM-1",
                    "fabric": "Loop Knit",
                    "gsm": 220.0,
                    "colour": "Melange Grey",
                    "quantity": 300.0,
                    "unit_rate": 360.0,
                    "total_amount": 113400.0,
                    "status": "Delivered"
                }
            ],
            "total_quantity": 300.0,
            "subtotal": 108000.0,
            "tax_amount": 5400.0,
            "grand_total": 113400.0,
            "status": "Completed"
        },
        {
            "_id": "so_04",
            "order_number": "SO-2004",
            "customer_id": "cus_04",
            "customer_name": "Global Fabrics",
            "order_type": "made_to_order",
            "order_date": "2026-02-14",
            "required_delivery_date": "2026-03-10",
            "items": [
                {
                    "item_id": "SO-2004-ITM-1",
                    "fabric": "Single Jersey",
                    "gsm": 160.0,
                    "colour": "White",
                    "quantity": 400.0,
                    "unit_rate": 340.0,
                    "total_amount": 142800.0,
                    "status": "Planning"
                }
            ],
            "total_quantity": 400.0,
            "subtotal": 136000.0,
            "tax_amount": 6800.0,
            "grand_total": 142800.0,
            "status": "Planning"
        }
    ]
    await orders_col.insert_many(orders)

    # 9. Production Batches
    batches_col = db.get_collection("production_batches")
    batches = [
        {
            "_id": "batch_01",
            "batch_number": "BATCH-1001",
            "source_type": "sales_order",
            "source_order_id": "so_01",
            "source_order_number": "SO-2001",
            "fabric_name": "Single Jersey",
            "colour": "Black",
            "gsm": 160.0,
            "width": 72.0,
            "planned_quantity": 500.0,
            "completed_quantity": 250.0,
            "current_process": "compacting",
            "status": "in_progress",
            "process_route": ["knitting", "washing", "compacting", "finishing"],
            "total_cost": 142500.0
        },
        {
            "_id": "batch_02",
            "batch_number": "BATCH-1002",
            "source_type": "stock_production",
            "fabric_name": "French Terry",
            "colour": "Navy Blue",
            "gsm": 240.0,
            "width": 72.0,
            "planned_quantity": 600.0,
            "completed_quantity": 0.0,
            "current_process": "washing",
            "status": "in_progress",
            "process_route": ["knitting", "washing", "finishing"],
            "total_cost": 165000.0
        }
    ]
    await batches_col.insert_many(batches)

    # 10. Delivery Challans
    dcs_col = db.get_collection("delivery_challans")
    dcs = [
        {
            "_id": "dc_01",
            "dc_number": "DC-1001",
            "dc_type": "yarn_issue",
            "dc_date": "2026-02-13",
            "party_name": "Sri Lakshmi Knitting Works",
            "from_location": "Main Yarn Godown",
            "to_location": "Sri Lakshmi Knitting Works",
            "reference_job_number": "JOB-KNI-1001",
            "item_description": "Cotton 30s Combed Yarn - Lot LOT-COT-301",
            "quantity": 520.0,
            "unit": "KG",
            "transporter": "VRL Logistics",
            "vehicle_number": "TN-39-AZ-4545",
            "status": "dispatched"
        },
        {
            "_id": "dc_02",
            "dc_number": "DC-1002",
            "dc_type": "customer_delivery",
            "dc_date": "2026-02-14",
            "party_name": "XYZ Apparel",
            "from_location": "Main Finished Goods Godown",
            "to_location": "XYZ Apparel Premises, Peenya",
            "reference_order_number": "SO-2002",
            "item_description": "Finished Fabric Rolls - French Terry Navy",
            "roll_numbers": ["ROLL-1001", "ROLL-1002"],
            "quantity": 50.2,
            "unit": "KG",
            "transporter": "City Express Couriers",
            "vehicle_number": "KA-04-MB-8991",
            "eway_bill_number": "EWB-9918273645",
            "status": "dispatched"
        }
    ]
    await dcs_col.insert_many(dcs)

    # 11. Invoices
    invs_col = db.get_collection("invoices")
    invoices = [
        {
            "_id": "inv_01",
            "invoice_number": "INV-SAL-1001",
            "invoice_type": "sales",
            "invoice_date": "2026-02-14",
            "party_id": "cus_02",
            "party_name": "XYZ Apparel",
            "party_gstin": "29AABCX5678B1Z2",
            "is_interstate": True,
            "items": [
                {
                    "description": "French Terry Fabric 240 GSM",
                    "hsn_sac": "6006",
                    "quantity": 600.0,
                    "unit": "KG",
                    "rate": 380.0,
                    "taxable_value": 228000.0,
                    "cgst_pct": 0.0,
                    "cgst_amount": 0.0,
                    "sgst_pct": 0.0,
                    "sgst_amount": 0.0,
                    "igst_pct": 5.0,
                    "igst_amount": 11400.0,
                    "total_amount": 239400.0
                }
            ],
            "total_taxable_value": 228000.0,
            "total_tax_amount": 11400.0,
            "grand_total": 239400.0,
            "paid_amount": 50000.0,
            "outstanding_amount": 189400.0,
            "payment_status": "partially_paid",
            "status": "active"
        }
    ]
    await invs_col.insert_many(invoices)

    return {"message": "TextilePro database successfully seeded with full production datasets!"}
