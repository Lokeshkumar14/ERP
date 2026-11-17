import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ProductionBatch, Party, YarnLot } from '../../types';
import { X } from 'lucide-react';

interface CreateJobOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateJobOrderModal: React.FC<CreateJobOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [workers, setWorkers] = useState<Party[]>([]);
  const [yarnLots, setYarnLots] = useState<YarnLot[]>([]);

  const [batchId, setBatchId] = useState('');
  const [processType, setProcessType] = useState('knitting');
  const [workerId, setWorkerId] = useState('');
  const [expectedQty, setExpectedQty] = useState(500);
  const [ratePerKg, setRatePerKg] = useState(14.5);
  const [expectedDate, setExpectedDate] = useState('');
  const [yarnLotNumber, setYarnLotNumber] = useState('');
  const [yarnIssuedQty, setYarnIssuedQty] = useState(520);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        api.getBatches(),
        api.getParties('job_worker'),
        api.getYarnLots(),
      ]).then(([bList, wList, yList]) => {
        setBatches(bList);
        setWorkers(wList);
        setYarnLots(yList);
        if (bList.length > 0 && !batchId) setBatchId(bList[0]._id);
        if (wList.length > 0 && !workerId) setWorkerId(wList[0]._id);
        if (yList.length > 0 && !yarnLotNumber) setYarnLotNumber(yList[0].lot_number);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedBatch = batches.find((b) => b._id === batchId);
      const selectedWorker = workers.find((w) => w._id === workerId);

      await api.createJobOrder({
        batch_id: batchId,
        batch_number: selectedBatch?.batch_number || '',
        process_type: processType,
        job_worker_id: workerId,
        job_worker_name: selectedWorker?.name || '',
        expected_quantity: Number(expectedQty),
        rate_per_kg: Number(ratePerKg),
        expected_date: expectedDate,
        yarn_lot_number: processType === 'knitting' ? yarnLotNumber : undefined,
        yarn_issued_qty: processType === 'knitting' ? Number(yarnIssuedQty) : undefined,
        instructions,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`Job order creation error: ${err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Issue Job Work Order</h3>
            <p className="text-xs text-slate-400">Outsourced processing with auto Delivery Challan (DC)</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Production Batch</label>
            <select
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            >
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.batch_number} - {b.fabric_name} ({b.planned_quantity} KG)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Process Type</label>
              <select
                value={processType}
                onChange={(e) => setProcessType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs capitalize focus:border-indigo-500 focus:outline-none"
              >
                <option value="knitting">Knitting</option>
                <option value="washing">Washing</option>
                <option value="compacting">Compacting</option>
                <option value="finishing">Finishing</option>
                <option value="dyeing">Dyeing</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Job Worker Unit</label>
              <select
                required
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose Job Worker Unit --</option>
                {workers.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} {w.services ? `(${w.services.join(', ')})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {processType === 'knitting' && (
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-purple-50/50 p-3 border border-purple-100">
              <div>
                <label className="font-semibold text-purple-900 block mb-1">Yarn Lot to Issue</label>
                <select
                  value={yarnLotNumber}
                  onChange={(e) => setYarnLotNumber(e.target.value)}
                  className="w-full rounded-lg border border-purple-200 p-1.5 text-xs bg-white font-mono"
                >
                  {yarnLots.map((yl) => (
                    <option key={yl._id} value={yl.lot_number}>
                      {yl.lot_number} ({yl.current_available_qty} KG avail)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-purple-900 block mb-1">Yarn Issue Qty (KG)</label>
                <input
                  type="number"
                  value={yarnIssuedQty}
                  onChange={(e) => setYarnIssuedQty(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-lg border border-purple-200 p-1.5 text-xs bg-white font-bold"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Expected Output Qty (KG)</label>
              <input
                type="number"
                required
                value={expectedQty}
                onChange={(e) => setExpectedQty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Job Work Rate (₹/KG)</label>
              <input
                type="number"
                step="0.5"
                required
                value={ratePerKg}
                onChange={(e) => setRatePerKg(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Target Return Date</label>
            <input
              type="date"
              required
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Processing Instructions</label>
            <input
              type="text"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Maintain 160 GSM, compact to 72 inches width"
              className="w-full rounded-xl border border-slate-200 p-2 text-xs"
            />
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
            Issue Order & Dispatch DC
          </button>
        </div>
      </form>
    </div>
  );
};
