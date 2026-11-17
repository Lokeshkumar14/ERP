import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { PurchaseOrder } from '../types';
import { Plus, Package, Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface YarnPurchasesPageProps {
  onOpenCreatePo: () => void;
  onOpenCreateGrn: () => void;
}

export const YarnPurchasesPage: React.FC<YarnPurchasesPageProps> = ({
  onOpenCreatePo,
  onOpenCreateGrn,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'receipts'>('orders');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pos, grns] = await Promise.all([api.getPurchaseOrders(), api.getGoodsReceipts()]);
      setOrders(pos);
      setReceipts(grns);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Yarn Purchases & Receipts</h1>
          <p className="text-xs text-slate-500">
            Procure yarn raw materials, track supplier delivery notes, and generate inventory lots
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenCreateGrn}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Truck className="h-4 w-4 text-indigo-600" />
            <span>Receive Yarn (GRN)</span>
          </button>
          <button
            onClick={onOpenCreatePo}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 transition ${
            activeTab === 'orders'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Purchase Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('receipts')}
          className={`pb-3 transition ${
            activeTab === 'receipts'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Goods Receipt Notes / GRN ({receipts.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-3">PO Number</th>
                  <th className="pb-3">Supplier</th>
                  <th className="pb-3">Yarn Count</th>
                  <th className="pb-3">Ordered (KG)</th>
                  <th className="pb-3">Received (KG)</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((po) => {
                  const firstItem = po.items[0] || {};
                  const totalOrdered = po.items.reduce((acc, i) => acc + i.quantity, 0);
                  const totalRecd = po.items.reduce((acc, i) => acc + (i.received_quantity || 0), 0);

                  return (
                    <tr key={po._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 font-bold text-indigo-600">{po.purchase_number}</td>
                      <td className="py-3.5 font-semibold text-slate-900">{po.supplier_name}</td>
                      <td className="py-3.5 text-slate-600">{firstItem.yarn_name} ({firstItem.count})</td>
                      <td className="py-3.5 font-medium text-slate-800">{totalOrdered} KG</td>
                      <td className="py-3.5 font-medium text-emerald-600">{totalRecd} KG</td>
                      <td className="py-3.5 font-bold text-slate-900">₹{po.total_amount.toLocaleString('en-IN')}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            po.status === 'Fully Received'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-indigo-50 text-indigo-600'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-3">Receipt No</th>
                  <th className="pb-3">Supplier</th>
                  <th className="pb-3">Lot Number</th>
                  <th className="pb-3">Yarn Count</th>
                  <th className="pb-3">Received (KG)</th>
                  <th className="pb-3">Accepted (KG)</th>
                  <th className="pb-3">Rejected (KG)</th>
                  <th className="pb-3">Godown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {receipts.map((grn) => (
                  <tr key={grn._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 font-bold text-indigo-600">{grn.receipt_number}</td>
                    <td className="py-3.5 font-semibold text-slate-900">{grn.supplier_name}</td>
                    <td className="py-3.5">
                      <span className="rounded-md bg-purple-50 px-2 py-0.5 font-mono text-[11px] font-bold text-purple-700">
                        {grn.lot_number}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600">{grn.yarn_name} ({grn.count})</td>
                    <td className="py-3.5 text-slate-800 font-medium">{grn.quantity_received} KG</td>
                    <td className="py-3.5 text-emerald-600 font-bold">{grn.accepted_quantity} KG</td>
                    <td className="py-3.5 text-rose-600 font-medium">{grn.rejected_quantity || 0} KG</td>
                    <td className="py-3.5 text-slate-500">{grn.godown_name || 'Main Yarn Godown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
