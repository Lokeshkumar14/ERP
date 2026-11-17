import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Party } from '../../types';
import { X } from 'lucide-react';

interface CreateGrnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateGrnModal: React.FC<CreateGrnModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [supplierDc, setSupplierDc] = useState('');
  const [yarnName, setYarnName] = useState('Cotton 30s Combed');
  const [count, setCount] = useState('30s');
  const [lotNumber, setLotNumber] = useState(`LOT-COT-${Math.floor(100 + Math.random() * 900)}`);
  const [recdQty, setRecdQty] = useState(500);
  const [acceptedQty, setAcceptedQty] = useState(500);
  const [rejectedQty, setRejectedQty] = useState(0);

  useEffect(() => {
    if (isOpen) {
      api.getParties('supplier').then((res) => {
        setSuppliers(res);
        if (res.length > 0 && !supplierId) {
          setSupplierId(res[0]._id);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedSup = suppliers.find((s) => s._id === supplierId);
      await api.createGoodsReceipt({
        supplier_id: supplierId,
        supplier_name: selectedSup?.name || '',
        supplier_dc: supplierDc,
        yarn_name: yarnName,
        count,
        lot_number: lotNumber,
        quantity_received: Number(recdQty),
        accepted_quantity: Number(acceptedQty),
        rejected_quantity: Number(rejectedQty),
        godown_name: 'Main Yarn Godown',
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`GRN creation error: ${err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Receive Yarn (Goods Receipt Note)</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Supplier</label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Choose Yarn Supplier --</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.party_code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Supplier DC Number</label>
              <input
                type="text"
                required
                value={supplierDc}
                onChange={(e) => setSupplierDc(e.target.value)}
                placeholder="e.g. SDC-9921"
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Assigned Lot Number</label>
              <input
                type="text"
                required
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-purple-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Yarn Description</label>
              <input
                type="text"
                required
                value={yarnName}
                onChange={(e) => setYarnName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Yarn Count</label>
              <input
                type="text"
                required
                value={count}
                onChange={(e) => setCount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Received (KG)</label>
              <input
                type="number"
                required
                value={recdQty}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setRecdQty(val);
                  setAcceptedQty(val - rejectedQty);
                }}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-emerald-700 block mb-1">Accepted (KG)</label>
              <input
                type="number"
                required
                value={acceptedQty}
                onChange={(e) => setAcceptedQty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-emerald-300 bg-emerald-50/50 p-2 text-xs font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="font-semibold text-rose-700 block mb-1">Rejected (KG)</label>
              <input
                type="number"
                value={rejectedQty}
                onChange={(e) => {
                  const r = parseFloat(e.target.value) || 0;
                  setRejectedQty(r);
                  setAcceptedQty(recdQty - r);
                }}
                className="w-full rounded-xl border border-rose-200 p-2 text-xs font-bold text-rose-700"
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
            Confirm Goods Receipt
          </button>
        </div>
      </form>
    </div>
  );
};
