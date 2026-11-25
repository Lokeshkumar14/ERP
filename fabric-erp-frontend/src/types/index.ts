export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  state_code?: string;
  pincode?: string;
}

export interface Customer {
  _id: string;
  customer_code: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  billing_address?: Address;
  credit_limit: number;
  credit_days: number;
  opening_balance: number;
  current_balance?: number;
  status: string;
}

export interface Party {
  _id: string;
  party_code: string;
  name: string;
  party_types: string[];
  services?: string[];
  gstin?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: Address;
  processing_rates?: Record<string, number>;
  payment_terms?: string;
  current_balance?: number;
  status: string;
}

export interface Product {
  _id: string;
  product_code: string;
  name: string;
  category: 'fabric' | 'yarn';
  composition?: string;
  structure?: string;
  default_gsm?: number;
  default_width?: number;
  unit: string;
  status: string;
}

export interface SalesOrderItem {
  item_id?: string;
  variant_id?: string;
  fabric: string;
  composition?: string;
  gsm: number;
  width?: number;
  colour: string;
  quantity: number;
  unit_rate: number;
  discount_pct?: number;
  tax_pct?: number;
  total_amount?: number;
  produced_quantity?: number;
  delivered_quantity?: number;
  status?: string;
}

export interface SalesOrder {
  _id: string;
  order_number: string;
  customer_id: string;
  customer_name?: string;
  order_type: 'made_to_order' | 'stock_based';
  order_date?: string;
  required_delivery_date?: string;
  payment_terms?: string;
  delivery_address?: Address;
  items: SalesOrderItem[];
  total_quantity: number;
  subtotal: number;
  tax_amount: number;
  grand_total: number;
  status: string;
  remarks?: string;
  created_at?: string;
  planned_quantity?: number;
  remaining_quantity?: number;
  linked_work_orders?: Array<{
    batch_id?: string;
    batch_number: string;
    fabric_name: string;
    colour?: string;
    gsm?: number;
    planned_quantity: number;
    completed_quantity?: number;
    current_process?: string;
    status?: string;
  }>;
}

export interface PurchaseOrderItem {
  yarn_product_id?: string;
  yarn_name: string;
  count: string;
  composition?: string;
  quantity: number;
  rate: number;
  tax_pct?: number;
  total_amount?: number;
  received_quantity?: number;
}

export interface PurchaseOrder {
  _id: string;
  purchase_number: string;
  supplier_id: string;
  supplier_name?: string;
  purchase_date?: string;
  expected_delivery_date?: string;
  items: PurchaseOrderItem[];
  total_amount: number;
  status: string;
  remarks?: string;
  created_at?: string;
  planned_quantity?: number;
  remaining_quantity?: number;
  linked_work_orders?: Array<{
    batch_id?: string;
    batch_number: string;
    fabric_name: string;
    colour?: string;
    gsm?: number;
    planned_quantity: number;
    completed_quantity?: number;
    current_process?: string;
    status?: string;
  }>;
}

export interface YarnLot {
  _id: string;
  lot_number: string;
  yarn_name: string;
  count: string;
  supplier_id?: string;
  supplier_name?: string;
  quantity_received: number;
  current_available_qty: number;
  reserved_qty: number;
  issued_qty: number;
  unit: string;
  godown_name?: string;
  received_at?: string;
}

export interface ProductionBatch {
  _id: string;
  batch_number: string;
  source_type: 'sales_order' | 'stock_production';
  source_order_id?: string;
  source_order_number?: string;
  fabric_name: string;
  colour: string;
  gsm: number;
  width: number;
  planned_quantity: number;
  completed_quantity?: number;
  current_process: string;
  status: string;
  process_route: string[];
  total_cost?: number;
  created_at?: string;
}

export interface JobWorkOrder {
  _id: string;
  job_number: string;
  batch_id: string;
  batch_number?: string;
  process_type: string;
  job_worker_id: string;
  job_worker_name?: string;
  expected_quantity: number;
  rate_per_kg: number;
  expected_date?: string;
  yarn_lot_number?: string;
  yarn_issued_qty?: number;
  received_quantity?: number;
  reconciliation_variance?: number;
  issue_dc_number?: string;
  status: string;
  created_at?: string;
}

export interface FabricRoll {
  _id: string;
  roll_number: string;
  batch_id?: string;
  batch_number?: string;
  sales_order_id?: string;
  sales_order_number?: string;
  fabric_name: string;
  composition?: string;
  gsm: number;
  width: number;
  colour: string;
  original_weight: number;
  current_weight: number;
  current_process: string;
  current_location: string;
  quality_status: string;
  is_reserved?: boolean;
  is_delivered?: boolean;
  parent_roll_ids?: string[];
  child_roll_ids?: string[];
  created_at?: string;
}

export interface QualityInspection {
  _id: string;
  inspection_number: string;
  stage: string;
  batch_id?: string;
  roll_id?: string;
  roll_number?: string;
  target_gsm?: number;
  actual_gsm: number;
  target_width?: number;
  actual_width: number;
  shade_match: string;
  shrinkage_length_pct?: number;
  shrinkage_width_pct?: number;
  defects?: string[];
  quality_status: string;
  inspector_name: string;
  remarks?: string;
  inspected_at?: string;
}

export interface Godown {
  _id: string;
  godown_code: string;
  name: string;
  location: string;
  contact_person?: string;
  phone?: string;
  capacity_kg?: number;
  current_fabric_stock_kg?: number;
  current_yarn_stock_kg?: number;
  total_stock_kg?: number;
  rolls_count?: number;
  status: string;
}

export interface DeliveryChallan {
  _id: string;
  dc_number: string;
  dc_type: string;
  dc_date?: string;
  party_id?: string;
  party_name?: string;
  from_location: string;
  to_location: string;
  reference_job_number?: string;
  reference_order_number?: string;
  transporter?: string;
  vehicle_number?: string;
  eway_bill_number?: string;
  item_description: string;
  roll_numbers?: string[];
  quantity: number;
  unit: string;
  prepared_by?: string;
  status: string;
  cancellation_reason?: string;
}

export interface InvoiceLineItem {
  description: string;
  hsn_sac: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxable_value: number;
  cgst_pct: number;
  cgst_amount: number;
  sgst_pct: number;
  sgst_amount: number;
  igst_pct: number;
  igst_amount: number;
  total_amount: number;
}

export interface Invoice {
  _id: string;
  invoice_number: string;
  invoice_type: string;
  invoice_date?: string;
  due_date?: string;
  party_id: string;
  party_name: string;
  party_gstin?: string;
  items: InvoiceLineItem[];
  total_taxable_value: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_tax_amount: number;
  grand_total: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: string;
  is_interstate?: boolean;
}

export interface Payment {
  _id: string;
  payment_number: string;
  payment_type: string;
  party_id?: string;
  party_name?: string;
  amount: number;
  payment_date?: string;
  payment_mode: string;
  reference_number?: string;
  allocated_invoice_number?: string;
  category?: string;
  notes?: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  module: string;
  record_id: string;
  details: string;
  user: string;
  before?: any;
  after?: any;
  created_at: string;
}
