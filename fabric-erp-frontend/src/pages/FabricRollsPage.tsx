import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { FabricRoll } from '../types';
import { Plus, Scissors, GitMerge, QrCode, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

interface FabricRollsPageProps {
  onOpenCreateRoll: () => void;
  onPrintRollTag?: (roll: FabricRoll) => void;
}

export const FabricRollsPage: React.FC<FabricRollsPageProps> = ({
  onOpenCreateRoll,
  onPrintRollTag,
}) => {
  const [rolls, setRolls] = useState<FabricRoll[]>([]);
  const [loading, setLoading] = useState(true);

  // Split & Merge modal states
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [selectedRoll, setSelectedRoll] = useState<FabricRoll | null>(null);
  const [splitWeights, setSplitWeights] = useState('');

  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);

  const fetchRolls = async () => {
    try {
      setLoading(true);
      const res = await api.getRolls();
      setRolls(res);
    } catch (err) {
      console.error('Failed to load fabric rolls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolls();
  }, []);

  const handleSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoll || !splitWeights) return;
    try {
      const weights = splitWeights.split(',').map((w) => parseFloat(w.trim())).filter((w) => !isNaN(w) && w > 0);
      await api.splitRoll({ roll_id: selectedRoll._id, split_weights: weights });
      setSplitModalOpen(false);
      setSplitWeights('');
      fetchRolls();
    } catch (err) {
      alert(`Split roll error: ${err}`);
    }
  };

  const handleMerge = async () => {
    if (selectedRollIds.length < 2) {
      alert('Please select at least 2 rolls to merge');
      return;
    }
    try {
      await api.mergeRolls({ roll_ids: selectedRollIds });
      setMergeModalOpen(false);
      setSelectedRollIds([]);
      fetchRolls();
    } catch (err) {
      alert(`Merge roll error: ${err}`);
    }
  };

  const toggleRollSelection = (id: string) => {
    setSelectedRollIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fabric Roll Inventory & Lineage
          </h1>
          <p className="text-xs text-slate-500">
            Piece-wise roll tracking with QR/Barcode generation, weight lineage, splitting, and merging
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedRollIds.length >= 2 && (
            <button
              onClick={() => setMergeModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              <GitMerge className="h-4 w-4" />
              <span>Merge Selected ({selectedRollIds.length})</span>
            </button>
          )}

          <button
            onClick={onOpenCreateRoll}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Fabric Roll</span>
          </button>
        </div>
      </div>

      {/* Rolls Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3 w-8">Select</th>
                <th className="pb-3">Roll ID</th>
                <th className="pb-3">Batch Number</th>
                <th className="pb-3">Fabric Name</th>
                <th className="pb-3">Colour & GSM</th>
                <th className="pb-3">Weight (KG)</th>
                <th className="pb-3">Process Stage</th>
                <th className="pb-3">Location / Godown</th>
                <th className="pb-3">QC Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rolls.map((roll) => (
                <tr key={roll._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedRollIds.includes(roll._id)}
                      onChange={() => toggleRollSelection(roll._id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5 font-bold font-mono text-indigo-600">
                      <Tag className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{roll.roll_number}</span>
                    </div>
                  </td>
                  <td className="py-3.5 font-medium text-slate-800">{roll.batch_number || 'N/A'}</td>
                  <td className="py-3.5 font-semibold text-slate-900">{roll.fabric_name}</td>
                  <td className="py-3.5 text-slate-600">{roll.colour} ({roll.gsm} GSM, {roll.width}")</td>
                  <td className="py-3.5 font-bold text-slate-900">{roll.current_weight} KG</td>
                  <td className="py-3.5 capitalize font-medium text-indigo-600">{roll.current_process}</td>
                  <td className="py-3.5 text-slate-500">{roll.current_location}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        roll.quality_status === 'approved'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {roll.quality_status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right space-x-2">
                    <button
                      onClick={() => { setSelectedRoll(roll); setSplitModalOpen(true); }}
                      className="font-semibold text-slate-600 hover:text-indigo-600 text-xs inline-flex items-center gap-1"
                    >
                      <Scissors className="h-3.5 w-3.5" />
                      <span>Split</span>
                    </button>
                    {onPrintRollTag && (
                      <button
                        onClick={() => onPrintRollTag(roll)}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 text-xs inline-flex items-center gap-1"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Tag</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roll Split Modal */}
      {splitModalOpen && selectedRoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleSplit} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Split Fabric Roll</h3>
            <p className="text-xs text-slate-500">
              Split parent Roll <strong className="text-indigo-600">{selectedRoll.roll_number}</strong> (Total: {selectedRoll.current_weight} KG)
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Enter Child Weights (comma separated)
              </label>
              <input
                type="text"
                required
                value={splitWeights}
                onChange={(e) => setSplitWeights(e.target.value)}
                placeholder="e.g. 12.5, 12.9"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                The sum of child pieces must match {selectedRoll.current_weight} KG within tolerance.
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSplitModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Execute Split
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roll Merge Confirmation Modal */}
      {mergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Merge Fabric Rolls</h3>
            <p className="text-xs text-slate-500">
              Combine {selectedRollIds.length} selected fabric rolls into 1 parent-linked roll.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setMergeModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleMerge}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700"
              >
                Confirm Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
