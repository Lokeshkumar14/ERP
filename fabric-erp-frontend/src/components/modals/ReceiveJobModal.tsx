import React, { useState } from 'react';
import { api } from '../../api/client';
import { JobWorkOrder } from '../../types';
import { X, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface ReceiveJobModalProps {
  jobOrder: JobWorkOrder | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReceiveJobModal: React.FC<ReceiveJobModalProps> = ({
  jobOrder,
  onClose,
  onSuccess,
}) => {
  if (!jobOrder) return null;

  const issuedQty = jobOrder.yarn_issued_qty || jobOrder.expected_quantity || 0;
  const [recdQty, setRecdQty] = useState(issuedQty * 0.95);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [returnedInputQty, setReturnedInputQty] = useState(0);
  const [lossQty, setLossQty] = useState(Math.round(issuedQty * 0.05 * 10) / 10);
  const [rollsCount, setRollsCount] = useState(Math.max(1, Math.round(recdQty / 25)));
  const [measuredGsm, setMeasuredGsm] = useState<number | undefined>(160);
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(72);
  const [qualityStatus, setQualityStatus] = useState('approved');
  const [receiptDc, setReceiptDc] = useState('');

  // Live reconciliation variance calculation:
  // Variance = Issued - (Received + Rejected + Returned + Loss)
  const accounted = recdQty + rejectedQty + returnedInputQty + lossQty;
  const variance = Math.round((issuedQty - accounted) * 100) / 100;
  const isBalanced = Math.abs(variance) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.receiveJobWork({
        job_work_id: jobOrder._id,
        received_quantity: Number(recdQty),
        rejected_quantity: Number(rejectedQty),
        returned_input_quantity: Number(returnedInputQty),
        loss_quantity: Number(lossQty),
        rolls_count: Number(rollsCount),
        measured_gsm: measuredGsm,
        measured_width: measuredWidth,
        quality_status: qualityStatus,
        receipt_dc: receiptDc,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`Material receipt error: ${err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Receive Fabric & Reconciliation ({jobOrder.process_type.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-400">
              Job {jobOrder.job_number} | Issued Material: <strong>{issuedQty} KG</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Material Quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-emerald-700 block mb-1">Accepted Received Weight (KG)</label>
              <input
                type="number"
                step="0.1"
                required
                value={recdQty}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setRecdQty(val);
                  setRollsCount(Math.max(1, Math.round(val / 25)));
                }}
                className="w-full rounded-xl border border-emerald-300 bg-emerald-50/40 p-2 text-xs font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Process Loss Weight (KG)</label>
              <input
                type="number"
                step="0.1"
                value={lossQty}
                onChange={(e) => setLossQty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Rejected Fabric Weight (KG)</label>
              <input
                type="number"
                step="0.1"
                value={rejectedQty}
                onChange={(e) => setRejectedQty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-rose-200 p-2 text-xs font-bold text-rose-700"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Returned Unused Input (KG)</label>
              <input
                type="number"
                step="0.1"
                value={returnedInputQty}
                onChange={(e) => setReturnedInputQty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
              />
            </div>
          </div>

          {/* Reconciliation Balance Visualizer */}
          <div className={`rounded-xl p-3 border text-xs ${
            isBalanced ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <div className="flex justify-between items-center font-bold">
              <span>Reconciliation Status:</span>
              <span>{isBalanced ? '100% Balanced ✓' : `Variance: ${variance} KG`}</span>
            </div>
            <p className="text-[11px] mt-1 text-slate-600">
              Formula: Issued ({issuedQty}) = Received ({recdQty}) + Loss ({lossQty}) + Rejected ({rejectedQty}) + Returned ({returnedInputQty})
            </p>
          </div>

          {/* Roll Generation Inputs */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Rolls to Generate</label>
              <input
                type="number"
                min="1"
                required
                value={rollsCount}
                onChange={(e) => setRollsCount(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-indigo-600"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Measured GSM</label>
              <input
                type="number"
                value={measuredGsm || ''}
                onChange={(e) => setMeasuredGsm(parseFloat(e.target.value) || undefined)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Measured Width (")</label>
              <input
                type="number"
                value={measuredWidth || ''}
                onChange={(e) => setMeasuredWidth(parseFloat(e.target.value) || undefined)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Quality Status</label>
              <select
                value={qualityStatus}
                onChange={(e) => setQualityStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
              >
                <option value="approved">Approved</option>
                <option value="hold">On Hold</option>
                <option value="rework">Rework Required</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Job Worker Delivery DC</label>
              <input
                type="text"
                value={receiptDc}
                onChange={(e) => setReceiptDc(e.target.value)}
                placeholder="e.g. JW-DC-7788"
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
            Confirm Receipt & Create {rollsCount} Rolls
          </button>
        </div>
      </form>
    </div>
  );
};
