# TextilePro - Fabric Trading ERP
## Production-Grade Web-Based ERP for Fabric Trading & Processing

Built strictly according to the **Software Requirements Specification (SRS)** and modern light-theme SaaS design patterns (matching the TextilePro UI architecture).

---

## 🏗 Architecture & Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Recharts
- **Backend:** Python 3.13 + FastAPI + Motor / PyMongo (Async Document Store with Dual-mode persistence)
- **Database:** MongoDB (Dual-mode: connects directly to MongoDB Atlas / Local MongoDB, with built-in zero-config async document engine fallback)
- **Theme:** Polished light-theme UI matching reference specifications (`#f8fafc` background, `#ffffff` cards, `#6366f1` / `#4f46e5` indigo accents, crisp high-contrast data tables, responsive mobile navigation).

---

## 🚀 Running the Application

### 1. Backend Server (FastAPI)

```bash
cd fabric-erp-backend
python -m uvicorn app.main:app --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 2. Frontend Application (React + Vite)

```bash
cd fabric-erp-frontend
npm run dev
```
- Frontend Web App: `http://localhost:5173`
- Pre-configured Vite Proxy transparently routes `/api` requests to backend on port 8000.

---

## 🔑 Demo Access Credentials

| Role | Email | Password |
|---|---|---|
| **Owner / Trader** | `owner@textilepro.com` | `password123` |
| **Accountant** | `accountant@textilepro.com` | `password123` |
| **Purchase Manager** | `purchase@textilepro.com` | `password123` |
| **Sales Executive** | `sales@textilepro.com` | `password123` |
| **Godown In-Charge** | `godown@textilepro.com` | `password123` |

---

## 📦 Implemented Functional Modules (FR-01 to FR-20)

1. **FR-01: Authentication & User Management:** JWT tokens, SHA-256 salted hashing, RBAC roles (Owner, Accountant, Purchase Manager, Sales Executive, Godown Staff).
2. **FR-02: Dashboard:**
   - 4 Top KPI cards matching reference: Production Efficiency (85%), Current Inventory (12,500 units), Defect Rate (2.5%), Sales Performance ($1.2M / ₹12.5L).
   - Spline Production Trends Chart, Inventory Distribution (Raw vs Finished) Bar Chart, Quality Control Heatmap.
   - Inventory Status table with reorder alerts and live Order Status list.
3. **FR-03: Customer Management:** Customer master (GSTIN, credit limits, terms, ledgers, statements).
4. **FR-04: Supplier & Job Worker Management:** Yarn suppliers and processing companies (Knitting, Washing, Compacting, Finishing, Dyeing) with service rates per KG.
5. **FR-05: Product & Fabric Master:** Yarn master (Cotton 30s, 40s, PC 30s) and Fabric master (Single Jersey, French Terry, Loop Knit, Rib, Fleece) with specifications (GSM, width, colour, composition).
6. **FR-06: Customer Order Management:** Made-to-order (MTO) and stock-based orders, multi-item lines, order status workflow (Draft &rarr; Confirmed &rarr; Planning &rarr; In Production &rarr; Ready &rarr; Delivered &rarr; Completed).
7. **FR-07: Yarn Purchase Management:** Yarn Purchase Orders (PO), Goods Receipt Note (GRN) with lot tracking and accepted/rejected weight validation.
8. **FR-08: Yarn Inventory:** SKU/count-wise aggregate stock and lot-wise stock. Separate physical inventory and reservation ledgers:
   $$\text{Available Stock} = \text{Total Received} - \text{Total Issued} - \text{Reserved Quantity} + \text{Valid Returns}$$
9. **FR-09: Knitting Job-Work Management:** Knitting job orders, yarn issue with Issue DC, fabric receipt with roll generation, and reconciliation variance calculation.
10. **FR-10: Processing Management (Configurable Workflow Engine):** Multi-stage processing (`Knitting -> Washing -> Compacting -> Finishing -> Dyeing`), routing per production batch, and process loss tracking.
11. **FR-11: Fabric Roll Management:** System-generated unique Roll IDs (`ROLL-xxxx`), roll splitting into child rolls with parent lineage preservation, roll merging, and printable QR/barcode tags.
12. **FR-12: Quality Management (QC):** Quality inspections at all stages, GSM, width, shade matching, shrinkage %, defect logging, and approvals.
13. **FR-13: Godown & Warehouse Management:** Multi-godown tracking (Yarn godown, Knitting transit, Process transit, Finished goods godown, Rejection quarantine), capacity monitoring, and stock transfers.
14. **FR-14: Delivery Challan (DC) Management:** Automatic DC numbering for all 12 material movement types, printable layout with transporter, vehicle number, and e-way bill details.
15. **FR-15: Sales & Customer Delivery Management:** Roll-wise selection against sales orders, dispatch validation preventing over-delivery, and automatic order completion.
16. **FR-16: Invoice Management (Indian GST Compliant):** Sales, purchase, and job-work invoices with HSN 6006 / SAC 9988, CGST/SGST vs IGST calculation, payment status tracking, and printable GST Tax Invoices.
17. **FR-17: Accounts & Payment Management:** Customer receipts, supplier payments, job work disbursements, expense vouchers, and live customer/supplier ledger statements with running balance.
18. **FR-18: Costing & Profitability:** Batch production cost accumulation:
   $$\text{Total Cost} = \text{Yarn} + \text{Knitting} + \text{Washing} + \text{Compacting} + \text{Finishing} + \text{Transport} + \text{Overhead}$$
   Order-level net profit and margin % calculation.
19. **FR-19: Reports & Analytics:** Inventory by type/colour/godown, production loss and unexplained variance analysis.
20. **FR-20: Audit Logs:** Immutable system audit trail recording user, action, module, record ID, and change logs.

---

## 🖨 Printable Documents Included
- **Formal GST Tax Invoice** (Complete with company address, GSTIN, HSN, tax breakdown, bank account details, and authorized signature block).
- **Material Delivery Challan** (Full transit challan for Yarn, Job Work, and Customer Deliveries).
- **Fabric Roll Barcode Tag** (Printable sticker tag with barcode graphic, roll number, batch, GSM, width, colour, and weight in KG).
