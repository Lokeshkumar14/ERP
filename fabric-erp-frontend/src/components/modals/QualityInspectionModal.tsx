import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { FabricRoll } from '../../types';
import { X } from 'lucide-react';

interface QualityInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QualityInspectionModal: React.FC<QualityInspectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rolls, setRolls] = useState<FabricRoll[]>([]);
  const [selectedRollId, setSelectedRollId] = useState('');
  const [stage, setStage] = useState('final');
  const [actualGsm, setActualGsm] = useState(160);
  const [actualWidth, setActualWidth] = useState(72);
  const [shadeMatch, setShadeMatch] = useState('matched');
  const [shrinkageLength, setShrinkageLength] = useState(2.5);
  const [shrinkageWidth, setShrinkageWidth] = useState(2.0);
  const [defectsInput, setDefectsInput] = useState('');
  const [qualityStatus, setQualityStatus] = useState('approved');
  const [inspectorName, setInspectorName] = useState('Senior QC Inspector');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getRolls().then((res) => {
        setRolls(res);
        if (res.length > 0 && !selectedRollId) {
          setSelectedRollId(res[0]._id);
          setActualGsm(res[0].gsm || 160);
          setActualWidth(res[0].width || 72);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedRoll = rolls.find((r) => r._id === selectedRollId);
      const defects = defectsInput
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0);

      await api.createInspection({
        stage,
        roll_id: selectedRollId,
        roll_number: selectedRoll?.roll_number,
        batch_id: selectedRoll?.batch_id,
        target_gsm: selectedRoll?.gsm,
        actual_gsm: Number(actualGsm),
        target_width: selectedRoll?.width,
        actual_width: Number(actualWidth),
        shade_match: shadeMatch,
        shrinkage_length_pct: Number(shrinkageLength),
        shrinkage_width_pct: Number(shrinkageWidth),
        defects,
        quality_status: qualityStatus,
        inspector_name: inspectorName,
        remarks,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`QC inspection error: ${err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Record Quality Inspection</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Select Fabric Roll</label>
              <select
                required
                value={selectedRollId}
                onChange={(e) => {
                  setSelectedRollId(e.target.value);
                  const r = rolls.find((x) => x._id === e.target.value);
                  if (r) {
                    setActualGsm(r.gsm);
                    setActualWidth(r.width);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                {rolls.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.roll_number} - {r.fabric_name} ({r.current_weight} KG)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Process Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
              >
                <option value="knitting">Knitting QC</option>
                <option value="washing">Washing QC</option>
                <option value="compacting">Compacting QC</option>
                <option value="finishing">Finishing QC</option>
                <option value="final">Final Warehouse QC</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Actual GSM</label>
              <input
                type="number"
                required
                value={actualGsm}
                onChange={(e) => setActualGsm(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Actual Width (")</label>
              <input
                type="number"
                required
                value={actualWidth}
                onChange={(e) => setActualWidth(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Shade Match</label>
              <select
                value={shadeMatch}
                onChange={(e) => setShadeMatch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
              >
                <option value="matched">Exact Match</option>
                <option value="variation_acceptable">Acceptable Variation</option>
                <option value="rejected">Mismatched</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Length Shrinkage (%)</label>
              <input
                type="number"
                step="0.1"
                value={shrinkageLength}
                onChange={(e) => setShrinkageLength(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Width Shrinkage (%)</label>
              <input
                type="number"
                step="0.1"
                value={shrinkageWidth}
                onChange={(e) => setShrinkageWidth(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Defects Logged (comma separated)</label>
            <input
              type="text"
              value={defectsInput}
              onChange={(e) => setDefectsInput(e.target.value)}
              placeholder="e.g. Needle mark, oil stain, hole, slub"
              className="w-full rounded-xl border border-slate-200 p-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">QC Decision</label>
              <select
                value={qualityStatus}
                onChange={(e) => setQualityStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold uppercase focus:outline-none"
              >
                <option value="approved">Approved</option>
                <option value="hold">On Hold</option>
                <option value="rework">Rework Required</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Inspector Name</label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm"
          >
            Save Inspection & Update Roll Status
          </button>
        </div>
      </form>
    </div>
  );
};
