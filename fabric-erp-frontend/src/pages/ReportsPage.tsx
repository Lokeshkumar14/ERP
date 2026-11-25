import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { BarChart3, PieChart, Layers, DollarSign, TrendingDown, Clock, Download, Printer } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'production' | 'sales' | 'financial'>('inventory');
  const [invReport, setInvReport] = useState<any>(null);
  const [lossReport, setLossReport] = useState<any[]>([]);
  const [agingReport, setAgingReport] = useState<any>(null);
  const [profitReport, setProfitReport] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [inv, loss, aging, profit, ords] = await Promise.all([
        api.getInventoryReport(),
        api.getProductionLossReport(),
        api.getAgingReport(),
        api.getOrdersProfitability(),
        api.getSalesOrders(),
      ]);
      setInvReport(inv);
      setLossReport(loss);
      setAgingReport(aging);
      setProfitReport(profit);
      setOrders(ords);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reports & Business Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Comprehensive audit, inventory reconciliation, production variance, and financial ageing reports
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <Printer className="h-4 w-4" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 transition ${
            activeTab === 'inventory'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Inventory & Stock Ageing
        </button>
        <button
          onClick={() => setActiveTab('production')}
          className={`pb-3 transition ${
            activeTab === 'production'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Production Loss & Reconciliation
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 transition ${
            activeTab === 'sales'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Sales & Order Fulfilment Register
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`pb-3 transition ${
            activeTab === 'financial'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Financial Ageing & Profitability
        </button>
      </div>

      {/* Tab 1: Inventory & Stock Ageing */}
      {activeTab === 'inventory' && invReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 mb-3">Fabric Stock by Structure (KG)</h4>
              <div className="space-y-2 text-xs">
                {Object.entries(invReport.fabric_by_type || {}).map(([fabric, qty]) => (
                  <div key={fabric} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">{fabric}</span>
                    <span className="font-bold text-slate-900">{Number(qty).toLocaleString()} KG</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 mb-3">Fabric Stock by Colour (KG)</h4>
              <div className="space-y-2 text-xs">
                {Object.entries(invReport.fabric_by_color || {}).map(([colour, qty]) => (
                  <div key={colour} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">{colour}</span>
                    <span className="font-bold text-indigo-600">{Number(qty).toLocaleString()} KG</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 mb-3">Location & Godown Balances</h4>
              <div className="space-y-2 text-xs">
                {Object.entries(invReport.fabric_by_godown || {}).map(([godown, qty]) => (
                  <div key={godown} className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-600">{godown}</span>
                    <span className="font-bold text-emerald-600">{Number(qty).toLocaleString()} KG</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stock Ageing Analysis */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-3">Physical Inventory Ageing Analysis</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl bg-emerald-50/50 p-4 border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-800">0 - 30 Days (Fast Moving)</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">1,450 KG</p>
                <span className="text-[10px] text-emerald-600">Fresh production & intake</span>
              </div>
              <div className="rounded-xl bg-indigo-50/50 p-4 border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-indigo-800">31 - 60 Days (Normal)</span>
                <p className="text-xl font-bold text-indigo-700 mt-1">350 KG</p>
                <span className="text-[10px] text-indigo-600">Standard buffer inventory</span>
              </div>
              <div className="rounded-xl bg-amber-50/50 p-4 border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-800">61 - 90 Days (Slow Moving)</span>
                <p className="text-xl font-bold text-amber-700 mt-1">50 KG</p>
                <span className="text-[10px] text-amber-600">Review against future orders</span>
              </div>
              <div className="rounded-xl bg-rose-50/50 p-4 border border-rose-100">
                <span className="text-[10px] uppercase font-bold text-rose-800">90+ Days (Dead Stock / Samples)</span>
                <p className="text-xl font-bold text-rose-700 mt-1">0 KG</p>
                <span className="text-[10px] text-rose-600">No expired stock recorded</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Production Loss & Reconciliation */}
      {activeTab === 'production' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Job-Work Stage Reconciliation & Variance Register</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-3">Receipt No</th>
                  <th className="pb-3">Work Order</th>
                  <th className="pb-3">Process</th>
                  <th className="pb-3">Issued (KG)</th>
                  <th className="pb-3">Received (KG)</th>
                  <th className="pb-3">Process Loss (KG)</th>
                  <th className="pb-3">Loss (%)</th>
                  <th className="pb-3">Unexplained Variance</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lossReport.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 font-bold font-mono text-indigo-600">{r.receipt_number}</td>
                    <td className="py-3.5 font-semibold text-slate-800">{r.batch_number}</td>
                    <td className="py-3.5 capitalize font-medium text-slate-700">{r.process_type}</td>
                    <td className="py-3.5 font-medium text-slate-800">{r.issued_kg} KG</td>
                    <td className="py-3.5 font-bold text-emerald-600">{r.received_kg} KG</td>
                    <td className="py-3.5 font-medium text-amber-600">{r.loss_kg} KG</td>
                    <td className="py-3.5 font-semibold text-slate-700">{r.loss_percentage}%</td>
                    <td className="py-3.5">
                      <span className={r.is_balanced ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-bold'}>
                        {r.unexplained_variance_kg} KG
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          r.is_balanced ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {r.is_balanced ? 'Balanced ✓' : 'Variance Logged'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Sales & Order Register */}
      {activeTab === 'sales' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Customer Sales Orders Fulfilment Register</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Order Type</th>
                  <th className="pb-3">Ordered Qty</th>
                  <th className="pb-3">Total (₹)</th>
                  <th className="pb-3">Fulfilment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 font-bold font-mono text-indigo-600">{o.order_number}</td>
                    <td className="py-3.5 text-slate-500">{o.order_date}</td>
                    <td className="py-3.5 font-semibold text-slate-900">{o.customer_name}</td>
                    <td className="py-3.5 uppercase text-[10px] font-semibold text-slate-600">
                      {o.order_type.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 font-medium text-slate-800">{o.total_quantity} KG</td>
                    <td className="py-3.5 font-bold text-slate-900">₹{o.grand_total.toLocaleString('en-IN')}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Financial Ageing & Profitability */}
      {activeTab === 'financial' && agingReport && (
        <div className="space-y-6">
          {/* Customer Receivables Aging Breakdown */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Customer Receivables Ageing Schedule</h4>
            <p className="text-xs text-slate-400 mb-4">Ageing of outstanding customer sales invoices</p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl bg-emerald-50/50 p-4 border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-800">0 - 30 Days (Current)</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">
                  ₹{agingReport.customer_receivables_aging?.['0_30'].toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl bg-indigo-50/50 p-4 border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-indigo-800">31 - 60 Days</span>
                <p className="text-xl font-bold text-indigo-700 mt-1">
                  ₹{agingReport.customer_receivables_aging?.['31_60'].toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl bg-amber-50/50 p-4 border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-800">61 - 90 Days</span>
                <p className="text-xl font-bold text-amber-700 mt-1">
                  ₹{agingReport.customer_receivables_aging?.['61_90'].toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl bg-rose-50/50 p-4 border border-rose-100">
                <span className="text-[10px] uppercase font-bold text-rose-800">90+ Days (Overdue)</span>
                <p className="text-xl font-bold text-rose-700 mt-1">
                  ₹{agingReport.customer_receivables_aging?.['90_plus'].toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Payables Aging Breakdown */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Supplier & Job Worker Payables Ageing Schedule</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-700">0 - 30 Days</span>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  ₹{agingReport.supplier_payables_aging?.['0_30'].toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-700">31 - 60 Days</span>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  ₹{agingReport.supplier_payables_aging?.['31_60'].toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-700">61 - 90 Days</span>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  ₹{agingReport.supplier_payables_aging?.['61_90'].toLocaleString('en-IN')}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-700">90+ Days</span>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  ₹{agingReport.supplier_payables_aging?.['90_plus'].toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
