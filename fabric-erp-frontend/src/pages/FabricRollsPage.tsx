import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Layers, Package, MapPin, Sliders, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface FabricRollsPageProps {
  onOpenCreateRoll?: () => void;
  onPrintRollTag?: (roll: any) => void;
}

export const FabricRollsPage: React.FC<FabricRollsPageProps> = () => {
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('all');

  // Weight adjustment modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newWeight, setNewWeight] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  const fetchStock = async () => {
    try {
      setLoading(true);
      const res = await api.getRolls();
      setStockItems(res);
    } catch (err) {
      console.error('Failed to load fabric stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleAdjustWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await api.adjustRollWeight(selectedItem._id, {
        new_weight: Number(newWeight),
        reason: adjustReason || 'Physical stock audit adjustment',
      });
      setAdjustModalOpen(false);
      setSelectedItem(null);
      fetchStock();
      alert('Fabric stock weight adjusted successfully!');
    } catch (err) {
      alert(`Adjustment error: ${err}`);
    }
  };

  const filteredItems = stockItems.filter((item) => {
    if (filterStage === 'all') return !item.is_delivered;
    if (filterStage === 'finished') return item.current_process === 'finished' && !item.is_delivered;
    if (filterStage === 'processing') return item.current_process !== 'finished' && !item.is_delivered;
    if (filterStage === 'delivered') return item.is_delivered;
    return true;
  });

  const totalFinishedKg = stockItems
    .filter((s) => s.current_process === 'finished' && !s.is_delivered)
    .reduce((sum, s) => sum + (s.current_weight || 0), 0);

  const totalProcessingKg = stockItems
    .filter((s) => s.current_process !== 'finished' && !s.is_delivered)
    .reduce((sum, s) => sum + (s.current_weight || 0), 0);

  const totalDeliveredKg = stockItems
    .filter((s) => s.is_delivered)
    .reduce((sum, s) => sum + (s.original_weight || s.current_weight || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Finished Fabric Stock (Weight in KG)
          </h1>
          <p className="text-xs text-slate-500">
            Track finished goods and in-processing fabric by weight, structure, GSM, width, and storage godown
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setFilterStage('all')}
            className={`rounded-xl px-3 py-1.5 transition ${
              filterStage === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Active Stock
          </button>
          <button
            onClick={() => setFilterStage('finished')}
            className={`rounded-xl px-3 py-1.5 transition ${
              filterStage === 'finished'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ready for Sale ({totalFinishedKg.toFixed(1)} KG)
          </button>
          <button
            onClick={() => setFilterStage('processing')}
            className={`rounded-xl px-3 py-1.5 transition ${
              filterStage === 'processing'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            In Processing ({totalProcessingKg.toFixed(1)} KG)
          </button>
          <button
            onClick={() => setFilterStage('delivered')}
            className={`rounded-xl px-3 py-1.5 transition ${
              filterStage === 'delivered'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Delivered ({totalDeliveredKg.toFixed(1)} KG)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Available Finished Fabric</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{totalFinishedKg.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-semibold">KG in Godowns</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Ready for customer orders and delivery</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Fabric in Job Work Processing</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{totalProcessingKg.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-semibold">KG at external units</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Knitting, washing, compacting &amp; finishing</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Fabric Delivered</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-600">{totalDeliveredKg.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-semibold">KG Dispatched</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Fulfilled customer sales orders</span>
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Work Order Ref</th>
                <th className="pb-3">Fabric Structure</th>
                <th className="pb-3">Colour &amp; Shade</th>
                <th className="pb-3">GSM &amp; Width</th>
                <th className="pb-3">Current Weight</th>
                <th className="pb-3">Process Stage</th>
                <th className="pb-3">Location / Godown</th>
                <th className="pb-3">Stock Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">Loading fabric stock...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">No fabric stock found matching criteria.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 font-bold font-mono text-purple-700">
                      {item.batch_number || 'WO-GENERAL'}
                    </td>
                    <td className="py-3.5 font-semibold text-slate-900">{item.fabric_name}</td>
                    <td className="py-3.5 text-slate-700 font-medium">{item.colour || 'Natural'}</td>
                    <td className="py-3.5 text-slate-500">
                      {item.gsm || 160} GSM · {item.width || 72}"
                    </td>
                    <td className="py-3.5">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.current_weight || item.original_weight || 0}
                      </span>{' '}
                      <span className="text-[11px] text-slate-400 font-medium">KG</span>
                    </td>
                    <td className="py-3.5">
                      <span className="capitalize font-semibold text-indigo-700 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px]">
                        {item.current_process || 'finished'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{item.current_location || 'Main Finished Goods Godown'}</span>
                    </td>
                    <td className="py-3.5">
                      {item.is_delivered ? (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Delivered ✓
                        </span>
                      ) : item.current_process === 'finished' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                          Ready for Sale
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-600">
                          In Process
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right">
                      {!item.is_delivered && (
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setNewWeight(item.current_weight || 0);
                            setAdjustModalOpen(true);
                          }}
                          className="font-semibold text-indigo-600 hover:text-indigo-800 text-xs inline-flex items-center gap-1"
                        >
                          <Sliders className="h-3.5 w-3.5" />
                          <span>Adjust (KG)</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Weight Modal */}
      {adjustModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAdjustWeight}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Adjust Fabric Stock Weight</h3>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
              <p className="font-semibold text-slate-800">{selectedItem.fabric_name} ({selectedItem.colour})</p>
              <p className="text-slate-500">Current recorded weight: <strong>{selectedItem.current_weight} KG</strong></p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                New Physical Weight (KG) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={newWeight}
                onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-indigo-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Adjustment Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Physical stock audit variance"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm"
              >
                Save Weight Adjustment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
