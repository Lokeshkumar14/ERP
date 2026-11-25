import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SalesOrder, Customer } from '../types';
import { Plus, Search, Filter, Printer, CheckCircle, Clock, Truck, ChevronRight, ChevronLeft, Layers } from 'lucide-react';

interface SalesOrdersPageProps {
  onOpenCreateOrder: () => void;
  onOpenCreateBatchForOrder?: (order: SalesOrder) => void;
  onPrintOrder?: (order: SalesOrder) => void;
}

export const SalesOrdersPage: React.FC<SalesOrdersPageProps> = ({
  onOpenCreateOrder,
  onOpenCreateBatchForOrder,
  onPrintOrder,
}) => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getSalesOrders();
      setOrders(res);
      if (res.length > 0 && !selectedOrder) {
        setSelectedOrder(res[0]);
      }
    } catch (err) {
      console.error('Failed to fetch sales orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      alert(`Failed to update status: ${err}`);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('deliver')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s.includes('product') || s.includes('plan')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    if (s.includes('ready')) return 'bg-purple-50 text-purple-600 border-purple-100';
    if (s.includes('cancel')) return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-amber-50 text-amber-600 border-amber-100';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer Sales Orders</h1>
          <p className="text-xs text-slate-500">
            Manage made-to-order and stock-based fabric orders with full production tracking
          </p>
        </div>

        <button
          onClick={onOpenCreateOrder}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Sales Order</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'confirmed', 'planning', 'in production', 'ready for delivery', 'partially delivered', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:border-indigo-400 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Order List & Selected Details Split View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Orders Table (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-3">Order No</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Order Qty</th>
                  <th className="pb-3">Work Order Allocation</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedOrders.map((o) => {
                  const planned = o.planned_quantity || 0;
                  const total = o.total_quantity || 1;
                  const remaining = o.remaining_quantity !== undefined ? o.remaining_quantity : Math.max(0, total - planned);
                  const pct = Math.min(100, Math.round((planned / total) * 100));

                  return (
                    <tr
                      key={o._id}
                      onClick={() => setSelectedOrder(o)}
                      className={`cursor-pointer transition hover:bg-slate-50/80 ${
                        selectedOrder?._id === o._id ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3 font-bold text-indigo-600">{o.order_number}</td>
                      <td className="py-3 font-semibold text-slate-800">{o.customer_name}</td>
                      <td className="py-3 font-medium text-slate-700">{o.total_quantity} KG</td>
                      <td className="py-3">
                        <div className="space-y-1 w-36">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-slate-700">{planned} / {o.total_quantity} KG</span>
                            <span className={`font-bold ${remaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {remaining > 0 ? `-${remaining} KG` : 'Full ✓'}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                remaining <= 0 ? 'bg-emerald-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {o.linked_work_orders && o.linked_work_orders.length > 0 && (
                            <div className="text-[10px] text-slate-400 truncate">
                              {o.linked_work_orders.map((w) => w.batch_number).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-slate-900">₹{o.grand_total.toLocaleString('en-IN')}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getStatusColor(
                            o.status
                          )}`}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredOrders.length > pageSize && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * pageSize, filteredOrders.length)}</strong> of{' '}
                <strong>{filteredOrders.length}</strong> orders
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Order Detail Panel (5 cols) */}
        <div className="lg:col-span-5">
          {selectedOrder ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                    {selectedOrder.order_type.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedOrder.order_number}</h3>
                </div>

                {onPrintOrder && (
                  <button
                    onClick={() => onPrintOrder(selectedOrder)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print</span>
                  </button>
                )}
              </div>

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50/70 p-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Customer</span>
                  <span className="font-bold text-slate-800">{selectedOrder.customer_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Delivery Date</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.required_delivery_date || 'N/A'}</span>
                </div>
              </div>

              {/* Work Order Fulfillment & Multi-Work Order Splitting */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <span>Production Allocation</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      (selectedOrder.remaining_quantity ?? selectedOrder.total_quantity) > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {(selectedOrder.remaining_quantity ?? selectedOrder.total_quantity) > 0
                      ? `${selectedOrder.remaining_quantity} KG Remaining`
                      : 'Fully Planned ✓'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>
                      Planned: <strong>{selectedOrder.planned_quantity || 0} KG</strong> of {selectedOrder.total_quantity} KG
                    </span>
                    <span className="font-semibold text-indigo-700">
                      {Math.min(100, Math.round(((selectedOrder.planned_quantity || 0) / (selectedOrder.total_quantity || 1)) * 100))}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        (selectedOrder.remaining_quantity ?? selectedOrder.total_quantity) <= 0
                          ? 'bg-emerald-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round(((selectedOrder.planned_quantity || 0) / (selectedOrder.total_quantity || 1)) * 100))}%`
                      }}
                    />
                  </div>
                </div>

                {/* Linked Work Orders list */}
                {selectedOrder.linked_work_orders && selectedOrder.linked_work_orders.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Active Work Orders for this Order ({selectedOrder.linked_work_orders.length}):
                    </span>
                    <div className="space-y-1">
                      {selectedOrder.linked_work_orders.map((wo) => (
                        <div
                          key={wo.batch_number}
                          className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200/80 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-700 font-mono">{wo.batch_number}</span>
                            <span className="text-slate-700 font-medium">{wo.planned_quantity} KG</span>
                            <span className="text-slate-400">({wo.fabric_name})</span>
                          </div>
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 capitalize">
                            {wo.current_process}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    No work orders issued yet for this order.
                  </p>
                )}

                {/* Direct Action Button to Create Work Order (Only shown if pending quantity remains) */}
                {onOpenCreateBatchForOrder && (
                  (selectedOrder.remaining_quantity ?? selectedOrder.total_quantity) > 0 ? (
                    <button
                      onClick={() => onOpenCreateBatchForOrder(selectedOrder)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>
                        + Create Work Order for Remaining {selectedOrder.remaining_quantity} KG
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 px-3 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Order 100% Planned ({selectedOrder.total_quantity} KG) — No further work orders allowed</span>
                    </div>
                  )
                )}
              </div>

              {/* Workflow Stepper */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Production Status Pipeline</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Confirmed', 'Planning', 'In Production', 'Ready for Delivery', 'Completed'].map((step) => {
                    const isCurrent = selectedOrder.status.toLowerCase() === step.toLowerCase();
                    return (
                      <button
                        key={step}
                        onClick={() => handleStatusChange(selectedOrder._id, step)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                      >
                        {step}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Fabric Line Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-100 p-3 text-xs">
                      <div className="flex justify-between font-semibold text-slate-900">
                        <span>{it.fabric} ({it.colour})</span>
                        <span>{it.quantity} KG</span>
                      </div>
                      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                        <span>GSM: {it.gsm} | Rate: ₹{it.unit_rate}/KG</span>
                        <span className="font-bold text-indigo-600">₹{(it.total_amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Totals */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST Tax (5%):</span>
                  <span>₹{selectedOrder.tax_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Grand Total:</span>
                  <span className="text-indigo-600">₹{selectedOrder.grand_total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
              Select an order to view full details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
