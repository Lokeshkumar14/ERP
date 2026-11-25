import React, { useState } from 'react';
import { api } from '../../api/client';
import { JobWorkOrder } from '../../types';
import { X, CheckCircle2, AlertTriangle, Layers, ArrowRight, ArrowDownRight } from 'lucide-react';

const NEXT_STAGE_MAP: Record<string, string> = {
  knitting: 'washing',
  washing: 'compacting',
  compacting: 'finishing',
  dyeing: 'washing',
  finishing: 'fabric_stock',
};

interface ReceiveJobModalProps {
  jobOrder: JobWorkOrder | null;
  onClose: () => void;
  onSuccess: () => void;
  onForwardToNextStage?: (data: {
    batchId: string;
    batchNumber: string;
    processType: string;
    expectedQty: number;
  }) => void;
}

export const ReceiveJobModal: React.FC<ReceiveJobModalProps> = ({
  jobOrder,
  onClose,
  onSuccess,
  onForwardToNextStage,
}) => {
  if (!jobOrder) return null;

  const issuedQty = Number(jobOrder.yarn_issued_qty || jobOrder.expected_quantity || 0);
  const previouslyReceived = Number(jobOrder.received_quantity || 0);
  const remainingPending = Math.max(0, Math.round((issuedQty - previouslyReceived) * 100) / 100);

  // Default to receiving remaining pending qty
  const [recdQty, setRecdQty] = useState<number>(remainingPending || issuedQty);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [returnedInputQty, setReturnedInputQty] = useState(0);
  const [lossQty, setLossQty] = useState(0);
  const [measuredGsm, setMeasuredGsm] = useState<number | undefined>(160);
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(72);
  const [qualityStatus, setQualityStatus] = useState('approved');
  const [receiptDc, setReceiptDc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nextProcess = NEXT_STAGE_MAP[jobOrder.process_type.toLowerCase()] || 'finishing';
  const hasNextProcess = nextProcess !== 'fabric_stock';
  const [forwardToNext, setForwardToNext] = useState(hasNextProcess);

  // Remaining pending after this receipt
  const pendingAfterThis = Math.max(0, Math.round((remainingPending - recdQty - lossQty - rejectedQty) * 100) / 100);
  const isFinalDelivery = pendingAfterThis <= 0.05;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recdQty <= 0) {
      alert('Please enter a received quantity greater than 0 KG.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.receiveJobWork({
        job_work_id: jobOrder._id,
        received_quantity: Number(recdQty),
        rejected_quantity: Number(rejectedQty),
        returned_input_quantity: Number(returnedInputQty),
        loss_quantity: Number(lossQty),
        measured_gsm: measuredGsm,
        measured_width: measuredWidth,
        quality_status: qualityStatus,
        receipt_dc: receiptDc,
      });

      onSuccess();
      onClose();

      if (forwardToNext && onForwardToNextStage && hasNextProcess) {
        onForwardToNextStage({
          batchId: jobOrder.batch_id,
          batchNumber: jobOrder.batch_number || '',
          processType: nextProcess,
          expectedQty: Number(recdQty),
        });
      }
    } catch (err: any) {
      alert(`Material receipt error: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Receive Material Inward</span>
              <span className="capitalize px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
                {jobOrder.process_type}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Job <strong className="font-mono text-slate-700">{jobOrder.job_number}</strong> | Work Order: <strong className="font-mono text-indigo-600">{jobOrder.batch_number}</strong> | Unit: <strong>{jobOrder.job_worker_name}</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress & Delivery Context Banner */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Issued</span>
            <span className="font-extrabold text-slate-800 text-sm">{issuedQty} KG</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Prior Received</span>
            <span className="font-extrabold text-indigo-600 text-sm">{previouslyReceived} KG</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Pending Before This</span>
            <span className="font-extrabold text-amber-600 text-sm">{remainingPending} KG</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          {/* Material Quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-emerald-700 block mb-1">
                Accepted Received Weight (KG) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={recdQty}
                onChange={(e) => setRecdQty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-emerald-300 bg-emerald-50/30 p-2 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Process Loss Weight (KG)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={lossQty}
                onChange={(e) => setLossQty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-rose-700 block mb-1">Rejected Fabric Weight (KG)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={rejectedQty}
                onChange={(e) => setRejectedQty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-rose-200 p-2 text-xs font-bold text-rose-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Returned Unused Input (KG)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={returnedInputQty}
                onChange={(e) => setReturnedInputQty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Delivery Status Indicator */}
          <div className={`rounded-xl p-3 border text-xs ${
            isFinalDelivery ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-blue-50/70 border-blue-200 text-blue-900'
          }`}>
            <div className="flex justify-between items-center font-bold">
              <span>{isFinalDelivery ? 'Full Delivery (Order Will Complete ✓)' : 'Partial Inward Delivery'}</span>
              <span>Pending After This: {pendingAfterThis} KG</span>
            </div>
            <p className="text-[11px] mt-1 text-slate-600">
              {isFinalDelivery
                ? `Total received will reach ${(previouslyReceived + recdQty).toFixed(1)} KG. Job order will be marked completed.`
                : `Receiving ${recdQty} KG now. Job order will stay active for remaining ${pendingAfterThis} KG.`}
            </p>
          </div>

          {/* Forward to Next Process Checkbox */}
          {hasNextProcess && (
            <label className="flex items-start gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/70 cursor-pointer hover:bg-indigo-50 transition">
              <input
                type="checkbox"
                checked={forwardToNext}
                onChange={(e) => setForwardToNext(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <p className="font-bold text-indigo-950 text-xs flex items-center gap-1.5">
                  <span>Move Received {recdQty} KG to Next Process ({nextProcess.toUpperCase()})</span>
                  <ArrowRight className="h-3.5 w-3.5 text-indigo-600" />
                </p>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Directly opens Job Order creation pre-filled with {recdQty} KG for {nextProcess} to assign to a job worker unit.
                </p>
              </div>
            </label>
          )}

          {/* Fabric Specifications Received */}
          <div className="grid grid-cols-2 gap-3 pt-1">
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
              <label className="font-semibold text-slate-700 block mb-1">Quality Inspection Status</label>
              <select
                value={qualityStatus}
                onChange={(e) => setQualityStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
              >
                <option value="approved">Approved (Pass to Next Stage / Stock)</option>
                <option value="hold">On Hold (Pending Lab Test)</option>
                <option value="rework">Rework Required</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Job Worker Delivery DC #</label>
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

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition"
          >
            <span>Confirm Receipt ({recdQty} KG)</span>
            {forwardToNext && hasNextProcess && <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        </div>
      </form>
    </div>
  );
};
