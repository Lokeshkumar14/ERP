import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  ShoppingCart,
  Layers,
  CircleDollarSign,
  History,
  ChevronDown,
  ChevronRight,
  X,
  Factory,
  Warehouse,
  FileText,
  Truck,
  BookOpen,
  PieChart
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpen,
  onClose,
}) => {
  // Collapsible menu sections
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [jobWorkOpen, setJobWorkOpen] = useState(false);
  const [financialsOpen, setFinancialsOpen] = useState(false);

  const isActive = (view: string) => currentView === view;

  const handleNavClick = (view: string) => {
    onSelectView(view);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-slate-100 bg-white p-4 transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo matching TextilePro reference */}
          <div className="flex items-center justify-between px-2 py-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-100">
                {/* Geometric woven mesh icon */}
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="h-2 w-2 rounded-sm bg-white" />
                  <div className="h-2 w-2 rounded-sm bg-white/70" />
                  <div className="h-2 w-2 rounded-sm bg-white/70" />
                  <div className="h-2 w-2 rounded-sm bg-white" />
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Textile<span className="text-indigo-600">Pro</span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-230px)] pr-1 text-sm font-medium">
            {/* Dashboard */}
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition text-left ${
                isActive('dashboard')
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            {/* Inventory Section */}
            <div>
              <button
                onClick={() => setInventoryOpen(!inventoryOpen)}
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-slate-600 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>Inventory</span>
                </div>
                {inventoryOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              {inventoryOpen && (
                <div className="ml-7 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                  <button
                    onClick={() => handleNavClick('yarn_inventory')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('yarn_inventory') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Yarn Stock & Lots
                  </button>
                  <button
                    onClick={() => handleNavClick('purchases')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('purchases') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Yarn POs & GRN
                  </button>
                  <button
                    onClick={() => handleNavClick('rolls')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('rolls') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Fabric Rolls & Lineage
                  </button>
                  <button
                    onClick={() => handleNavClick('godowns')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('godowns') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Godowns & Transfers
                  </button>
                </div>
              )}
            </div>

            {/* Quality Control */}
            <button
              onClick={() => handleNavClick('quality')}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition text-left ${
                isActive('quality')
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Quality Control</span>
            </button>

            {/* Sales and Order */}
            <div>
              <button
                onClick={() => setSalesOpen(!salesOpen)}
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-slate-600 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>Sales & Orders</span>
                </div>
                {salesOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              {salesOpen && (
                <div className="ml-7 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                  <button
                    onClick={() => handleNavClick('sales_orders')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('sales_orders') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sales Orders
                  </button>
                  <button
                    onClick={() => handleNavClick('customers')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('customers') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Customers Master
                  </button>
                  <button
                    onClick={() => handleNavClick('deliveries')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('deliveries') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Deliveries & Dispatch
                  </button>
                  <button
                    onClick={() => handleNavClick('challans')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('challans') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Delivery Challans (DC)
                  </button>
                </div>
              )}
            </div>

            {/* Job Work & Processing */}
            <div>
              <button
                onClick={() => setJobWorkOpen(!jobWorkOpen)}
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-slate-600 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <Factory className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>Job Work & Routes</span>
                </div>
                {jobWorkOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              {jobWorkOpen && (
                <div className="ml-7 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                  <button
                    onClick={() => handleNavClick('job_work')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('job_work') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Batches & Orders
                  </button>
                  <button
                    onClick={() => handleNavClick('parties')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('parties') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Job Worker Directory
                  </button>
                </div>
              )}
            </div>

            {/* Financials */}
            <div>
              <button
                onClick={() => setFinancialsOpen(!financialsOpen)}
                className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-slate-600 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <CircleDollarSign className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>Financials</span>
                </div>
                {financialsOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                )}
              </button>

              {financialsOpen && (
                <div className="ml-7 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                  <button
                    onClick={() => handleNavClick('invoices')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('invoices') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    GST Invoices
                  </button>
                  <button
                    onClick={() => handleNavClick('accounts')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('accounts') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Payments & Ledgers
                  </button>
                  <button
                    onClick={() => handleNavClick('costing')}
                    className={`block w-full py-1 text-left text-xs transition ${
                      isActive('costing') ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Batch Costing
                  </button>
                </div>
              )}
            </div>

            {/* Audit Logs */}
            <button
              onClick={() => handleNavClick('audit')}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition text-left ${
                isActive('audit')
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <History className="h-4 w-4 shrink-0" />
              <span>Audit Trail</span>
            </button>

            {/* Product Master */}
            <button
              onClick={() => handleNavClick('products')}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition text-left ${
                isActive('products')
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Product Master</span>
            </button>

            {/* Reports & Analytics */}
            <button
              onClick={() => handleNavClick('reports')}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 transition text-left ${
                isActive('reports')
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <PieChart className="h-4 w-4 shrink-0" />
              <span>Reports &amp; Analytics</span>
            </button>
          </nav>
        </div>

        {/* Footer info */}
        <div className="mt-4 border-t border-slate-100 pt-3 text-center">
          <p className="text-xs text-slate-400 font-medium">TextilePro ERP · Tirupur</p>
        </div>
      </aside>
    </>
  );
};
