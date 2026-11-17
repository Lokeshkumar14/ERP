import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { YarnLot } from '../types';
import { Package, Lock, CheckCircle2, Factory, RefreshCw, AlertTriangle } from 'lucide-react';

export const YarnInventoryPage: React.FC = () => {
  const [lots, setLots] = useState<YarnLot[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Modal states
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<YarnLot | null>(null);
  const [reserveQty, setReserveQty] = useState('');

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.getYarnSummary();
      setSummary(res.summary || {});
      setLots(res.lots || []);
    } catch (err) {
      console.error('Failed to load yarn inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot || !reserveQty) return;
    try {
      await api.reserveYarn({ lot_number: selectedLot.lot_number, quantity: parseFloat(reserveQty) });
      setReserveModalOpen(false);
      setReserveQty('');
      fetchInventory();
    } catch (err) {
      alert(`Reservation error: ${err}`);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot || !adjustQty) return;
    try {
      await api.adjustStock({
        lot_number: selectedLot.lot_number,
        quantity: parseFloat(adjustQty),
        reason: adjustReason || 'Physical inventory audit',
      });
      setAdjustModalOpen(false);
      setAdjustQty('');
      setAdjustReason('');
      fetchInventory();
    } catch (err) {
      alert(`Adjustment error: ${err}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Yarn Inventory & Lots</h1>
          <p className="text-xs text-slate-500">
            Real-time SKU count and lot-level physical vs committed stock ledger
          </p>
        </div>

        <button
          onClick={fetchInventory}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* 4 Stock Classification KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Yarn Received</span>
            <Package className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {(summary.total_received_kg || 0).toLocaleString()} <span className="text-xs text-slate-400">KG</span>
          </p>
          <span className="text-[11px] text-slate-400">Cumulative supplier intake</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Available for Production</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600">
            {(summary.total_available_kg || 0).toLocaleString()} <span className="text-xs text-emerald-400">KG</span>
          </p>
          <span className="text-[11px] text-slate-400">Unreserved physical stock</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Reserved for Orders</span>
            <Lock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-600">
            {(summary.total_reserved_kg || 0).toLocaleString()} <span className="text-xs text-amber-400">KG</span>
          </p>
          <span className="text-[11px] text-slate-400">Committed to active orders</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Issued to Job Workers</span>
            <Factory className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-indigo-600">
            {(summary.total_issued_kg || 0).toLocaleString()} <span className="text-xs text-indigo-300">KG</span>
          </p>
          <span className="text-[11px] text-slate-400">At knitting / processing mills</span>
        </div>
      </div>

      {/* Lot-wise Inventory Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Lot-Wise Inventory Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Lot Number</th>
                <th className="pb-3">Yarn Description</th>
                <th className="pb-3">Count</th>
                <th className="pb-3">Supplier</th>
                <th className="pb-3">Received</th>
                <th className="pb-3">Available</th>
                <th className="pb-3">Reserved</th>
                <th className="pb-3">Issued</th>
                <th className="pb-3">Godown</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lots.map((lot) => (
                <tr key={lot._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold font-mono text-purple-700">{lot.lot_number}</td>
                  <td className="py-3.5 font-semibold text-slate-900">{lot.yarn_name}</td>
                  <td className="py-3.5 text-slate-600">{lot.count}</td>
                  <td className="py-3.5 text-slate-700">{lot.supplier_name || 'N/A'}</td>
                  <td className="py-3.5 font-medium text-slate-800">{lot.quantity_received} KG</td>
                  <td className="py-3.5 font-bold text-emerald-600">{lot.current_available_qty} KG</td>
                  <td className="py-3.5 text-amber-600 font-semibold">{lot.reserved_qty || 0} KG</td>
                  <td className="py-3.5 text-indigo-600 font-semibold">{lot.issued_qty || 0} KG</td>
                  <td className="py-3.5 text-slate-500">{lot.godown_name || 'Main Godown'}</td>
                  <td className="py-3.5 text-right space-x-2">
                    <button
                      onClick={() => { setSelectedLot(lot); setReserveModalOpen(true); }}
                      className="font-semibold text-amber-600 hover:text-amber-800 text-[11px]"
                    >
                      Reserve
                    </button>
                    <button
                      onClick={() => { setSelectedLot(lot); setAdjustModalOpen(true); }}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 text-[11px]"
                    >
                      Adjust
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reserve Modal */}
      {reserveModalOpen && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleReserve} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reserve Yarn Stock</h3>
            <p className="text-xs text-slate-500">
              Reserve stock from Lot <span className="font-bold text-purple-700">{selectedLot.lot_number}</span> (Available: {selectedLot.current_available_qty} KG)
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity to Reserve (KG)</label>
              <input
                type="number"
                step="0.1"
                max={selectedLot.current_available_qty}
                required
                value={reserveQty}
                onChange={(e) => setReserveQty(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReserveModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Confirm Reservation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adjust Modal */}
      {adjustModalOpen && selectedLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleAdjust} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Physical Stock Verification Adjustment</h3>
            <p className="text-xs text-slate-500">
              Update physical available quantity for Lot <span className="font-bold text-purple-700">{selectedLot.lot_number}</span>
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">New Verified Physical Weight (KG)</label>
              <input
                type="number"
                step="0.1"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder={String(selectedLot.current_available_qty)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Adjustment Reason / Notes</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Physical audit variance, moisture loss, etc."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Save Adjustment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
