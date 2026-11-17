import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SalesOrder, Customer } from '../types';
import { Plus, Search, Filter, Printer, CheckCircle, Clock, Truck, ChevronRight } from 'lucide-react';

interface SalesOrdersPageProps {
  onOpenCreateOrder: () => void;
  onPrintOrder?: (order: SalesOrder) => void;
}

export const SalesOrdersPage: React.FC<SalesOrdersPageProps> = ({
  onOpenCreateOrder,
  onPrintOrder,
}) => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

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
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Qty (KG)</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map((o) => (
                  <tr
                    key={o._id}
                    onClick={() => setSelectedOrder(o)}
                    className={`cursor-pointer transition hover:bg-slate-50/80 ${
                      selectedOrder?._id === o._id ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <td className="py-3 font-bold text-indigo-600">{o.order_number}</td>
                    <td className="py-3 font-semibold text-slate-800">{o.customer_name}</td>
                    <td className="py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {o.order_type === 'made_to_order' ? 'MTO' : 'Stock'}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-slate-700">{o.total_quantity}</td>
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
                ))}
              </tbody>
            </table>
          </div>
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
