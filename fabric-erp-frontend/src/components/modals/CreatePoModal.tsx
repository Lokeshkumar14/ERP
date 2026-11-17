import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Party } from '../../types';
import { X } from 'lucide-react';

interface CreatePoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatePoModal: React.FC<CreatePoModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [yarnName, setYarnName] = useState('Cotton 30s Combed');
  const [count, setCount] = useState('30s');
  const [quantity, setQuantity] = useState(1000);
  const [rate, setRate] = useState(240);

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
      await api.createPurchaseOrder({
        supplier_id: supplierId,
        expected_delivery_date: expectedDate,
        items: [
          {
            yarn_name: yarnName,
            count,
            quantity: Number(quantity),
            rate: Number(rate),
            tax_pct: 5,
          },
        ],
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`PO creation error: ${err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">New Yarn Purchase Order</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Yarn Supplier</label>
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
                placeholder="e.g. 30s, 40s"
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Quantity (KG)</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unit Rate (₹/KG)</label>
              <input
                type="number"
                required
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Expected Delivery Date</label>
            <input
              type="date"
              required
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs"
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-right">
            <span className="text-slate-500">Estimated Total: </span>
            <strong className="text-sm text-indigo-600">
              ₹{(quantity * rate * 1.05).toLocaleString('en-IN')} (incl. 5% GST)
            </strong>
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
            Issue Purchase Order
          </button>
        </div>
      </form>
    </div>
  );
};
