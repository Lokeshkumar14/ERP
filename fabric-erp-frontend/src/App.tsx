import React, { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { YarnPurchasesPage } from './pages/YarnPurchasesPage';
import { YarnInventoryPage } from './pages/YarnInventoryPage';
import { JobWorkPage } from './pages/JobWorkPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { JobOrdersPage } from './pages/JobOrdersPage';
import { FabricRollsPage } from './pages/FabricRollsPage';
import { DeliveryChallansPage } from './pages/DeliveryChallansPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { AccountsPage } from './pages/AccountsPage';
import { CostingPage } from './pages/CostingPage';
import { CustomersPage } from './pages/CustomersPage';
import { PartiesPage } from './pages/PartiesPage';
import { GodownsPage } from './pages/GodownsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ProductMasterPage } from './pages/ProductMasterPage';
import { ReportsPage } from './pages/ReportsPage';

// Modals
import { CreateOrderModal } from './components/modals/CreateOrderModal';
import { CreatePoModal } from './components/modals/CreatePoModal';
import { CreateGrnModal } from './components/modals/CreateGrnModal';
import { CreateJobOrderModal } from './components/modals/CreateJobOrderModal';
import { ReceiveJobModal } from './components/modals/ReceiveJobModal';
import { CreateDcModal } from './components/modals/CreateDcModal';
import { CreateInvoiceModal } from './components/modals/CreateInvoiceModal';
import { RecordPaymentModal } from './components/modals/RecordPaymentModal';
import { CreateCustomerModal } from './components/modals/CreateCustomerModal';
import { CreatePartyModal } from './components/modals/CreatePartyModal';
import { CreateBatchModal } from './components/modals/CreateBatchModal';

// Printable Templates
import { PrintableInvoice } from './components/printable/PrintableInvoice';
import { PrintableChallan } from './components/printable/PrintableChallan';

export function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal Open States
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [createBatchOpen, setCreateBatchOpen] = useState(false);
  const [selectedOrderForBatch, setSelectedOrderForBatch] = useState<any>(null);
  const [selectedBatchForJobOrder, setSelectedBatchForJobOrder] = useState<any>(null);
  const [createPoOpen, setCreatePoOpen] = useState(false);
  const [createGrnOpen, setCreateGrnOpen] = useState(false);
  const [createJobOrderOpen, setCreateJobOrderOpen] = useState(false);
  const [jobOrderInitialData, setJobOrderInitialData] = useState<{
    batchId?: string;
    processType?: string;
    expectedQty?: number;
  } | null>(null);
  const [receiveJobOpen, setReceiveJobOpen] = useState(false);
  const [selectedJobForReceipt, setSelectedJobForReceipt] = useState<any>(null);
  const [createDcOpen, setCreateDcOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createPartyOpen, setCreatePartyOpen] = useState(false);
  const [partyModalType, setPartyModalType] = useState<'supplier' | 'job_worker'>('job_worker');

  // Printable states
  const [printableInvoice, setPrintableInvoice] = useState<any>(null);
  const [printableChallan, setPrintableChallan] = useState<any>(null);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'sales_order':
        setCreateOrderOpen(true);
        break;
      case 'batch':
      case 'production_batch':
        setCreateBatchOpen(true);
        break;
      case 'yarn_po':
        setCreatePoOpen(true);
        break;
      case 'job_order':
        setCreateJobOrderOpen(true);
        break;
      case 'delivery_challan':
        setCreateDcOpen(true);
        break;
      case 'invoice':
        setCreateInvoiceOpen(true);
        break;
      default:
        break;
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage key={refreshKey} onNavigate={setCurrentView} />;
      case 'sales_orders':
        return (
          <SalesOrdersPage
            key={refreshKey}
            onOpenCreateOrder={() => setCreateOrderOpen(true)}
            onOpenCreateBatchForOrder={(order) => {
              setSelectedOrderForBatch(order);
              setCreateBatchOpen(true);
            }}
            onPrintOrder={(o) => {
              // Create mock invoice object for printable invoice
              setPrintableInvoice({
                invoice_number: `EST-${o.order_number}`,
                invoice_date: o.order_date || '2026-02-15',
                party_name: o.customer_name || 'Customer',
                party_gstin: '33AAACA1234A1Z5',
                is_interstate: false,
                items: o.items.map((it) => ({
                  description: `${it.fabric} - ${it.colour} (${it.gsm} GSM)`,
                  hsn_sac: '6006',
                  quantity: it.quantity,
                  unit: 'KG',
                  rate: it.unit_rate,
                  taxable_value: it.quantity * it.unit_rate,
                  cgst_pct: 2.5,
                  cgst_amount: it.quantity * it.unit_rate * 0.025,
                  sgst_pct: 2.5,
                  sgst_amount: it.quantity * it.unit_rate * 0.025,
                  igst_pct: 0,
                  igst_amount: 0,
                  total_amount: (it.quantity * it.unit_rate) * 1.05,
                })),
                total_taxable_value: o.subtotal,
                total_cgst: o.tax_amount / 2,
                total_sgst: o.tax_amount / 2,
                total_igst: 0,
                total_tax_amount: o.tax_amount,
                grand_total: o.grand_total,
              });
            }}
          />
        );
      case 'purchases':
        return (
          <YarnPurchasesPage
            key={refreshKey}
            onOpenCreatePo={() => setCreatePoOpen(true)}
            onOpenCreateGrn={() => setCreateGrnOpen(true)}
          />
        );
      case 'yarn_inventory':
        return <YarnInventoryPage key={refreshKey} />;
      case 'work_orders':
      case 'job_work':
      case 'job_orders':
        return (
          <WorkOrdersPage
            key={refreshKey}
            onOpenCreateBatch={() => setCreateBatchOpen(true)}
            onOpenIssueJobForBatch={(batch, processType, readyQty) => {
              setJobOrderInitialData({
                batchId: batch._id,
                processType: processType || batch.current_process,
                expectedQty: readyQty || batch.planned_quantity,
              });
              setCreateJobOrderOpen(true);
            }}
            onOpenReceiveJob={(job) => {
              setSelectedJobForReceipt(job);
              setReceiveJobOpen(true);
            }}
          />
        );
      case 'rolls':
        return <FabricRollsPage key={refreshKey} />;
      case 'challans':
        return (
          <DeliveryChallansPage
            key={refreshKey}
            onOpenCreateDc={() => setCreateDcOpen(true)}
            onPrintChallan={(dc) => setPrintableChallan(dc)}
          />
        );
      case 'deliveries':
        return <DeliveriesPage key={refreshKey} />;
      case 'invoices':
        return (
          <InvoicesPage
            key={refreshKey}
            onOpenCreateInvoice={() => setCreateInvoiceOpen(true)}
            onPrintInvoice={(inv) => setPrintableInvoice(inv)}
          />
        );
      case 'accounts':
        return <AccountsPage key={refreshKey} onOpenRecordPayment={() => setRecordPaymentOpen(true)} />;
      case 'costing':
        return <CostingPage key={refreshKey} />;
      case 'customers':
        return <CustomersPage key={refreshKey} onOpenCreateCustomer={() => setCreateCustomerOpen(true)} />;
      case 'parties':
        return (
          <PartiesPage
            key={refreshKey}
            onOpenCreateParty={() => {
              setPartyModalType('job_worker');
              setCreatePartyOpen(true);
            }}
          />
        );
      case 'godowns':
        return <GodownsPage key={refreshKey} />;
      case 'audit':
        return <AuditLogsPage key={refreshKey} />;
      case 'products':
        return <ProductMasterPage key={refreshKey} />;
      case 'reports':
        return <ReportsPage key={refreshKey} />;
      default:
        return <DashboardPage key={refreshKey} onNavigate={setCurrentView} />;
    }
  };

  return (
    <MainLayout
      currentView={currentView}
      onSelectView={setCurrentView}
      onOpenQuickAction={handleQuickAction}
    >
      {renderCurrentView()}

      {/* Global Modals */}
      <CreateOrderModal
        isOpen={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        onSuccess={handleRefresh}
      />
      <CreatePoModal
        isOpen={createPoOpen}
        onClose={() => setCreatePoOpen(false)}
        onSuccess={handleRefresh}
      />
      <CreateGrnModal
        isOpen={createGrnOpen}
        onClose={() => setCreateGrnOpen(false)}
        onSuccess={handleRefresh}
      />
      <CreateJobOrderModal
        isOpen={createJobOrderOpen}
        initialBatchId={jobOrderInitialData?.batchId}
        initialProcessType={jobOrderInitialData?.processType}
        initialExpectedQty={jobOrderInitialData?.expectedQty}
        onClose={() => {
          setCreateJobOrderOpen(false);
          setJobOrderInitialData(null);
        }}
        onSuccess={handleRefresh}
      />
      <ReceiveJobModal
        jobOrder={selectedJobForReceipt}
        onClose={() => {
          setReceiveJobOpen(false);
          setSelectedJobForReceipt(null);
        }}
        onForwardToNextStage={(data) => {
          setJobOrderInitialData({
            batchId: data.batchId,
            processType: data.processType,
            expectedQty: data.expectedQty,
          });
          setCreateJobOrderOpen(true);
        }}
        onSuccess={handleRefresh}
      />
      <CreateDcModal
        isOpen={createDcOpen}
        onClose={() => setCreateDcOpen(false)}
        onSuccess={handleRefresh}
      />
      <CreateInvoiceModal
        isOpen={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        onSuccess={handleRefresh}
      />
      <RecordPaymentModal
        isOpen={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onSuccess={handleRefresh}
      />
      <CreateCustomerModal
        isOpen={createCustomerOpen}
        onClose={() => setCreateCustomerOpen(false)}
        onSuccess={handleRefresh}
      />
      <CreatePartyModal
        isOpen={createPartyOpen}
        defaultType={partyModalType}
        onClose={() => setCreatePartyOpen(false)}
        onSuccess={handleRefresh}
      />
      <CreateBatchModal
        isOpen={createBatchOpen}
        initialOrder={selectedOrderForBatch}
        onClose={() => {
          setCreateBatchOpen(false);
          setSelectedOrderForBatch(null);
        }}
        onSuccess={handleRefresh}
      />

      {/* Printable Preview Modals */}
      {printableInvoice && (
        <PrintableInvoice
          invoice={printableInvoice}
          onClose={() => setPrintableInvoice(null)}
        />
      )}
      {printableChallan && (
        <PrintableChallan
          challan={printableChallan}
          onClose={() => setPrintableChallan(null)}
        />
      )}
    </MainLayout>
  );
}
export default App;
