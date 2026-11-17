import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Customer, Party } from '../../types';
import { X } from 'lucide-react';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [invoiceType, setInvoiceType] = useState<'sales' | 'purchase' | 'job_work'>('sales');
  const [parties, setParties] = useState<any[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [isInterstate, setIsInterstate] = useState(false);
  const [description, setDescription] = useState('Finished Knitted Fabric (Single Jersey)');
  const [quantity, setQuantity] = useState(500);
  const [rate, setRate] = useState(350);

  useEffect(() => {
    if (isOpen) {
      if (invoiceType === 'sales') {
        api.getCustomers().then((res) => {
          setParties(res);
          if (res.length > 0 && !selectedPartyId) setSelectedPartyId(res[0]._id);
        });
      } else {
        api.getParties().then((res) => {
          setParties(res);
          if (res.length > 0 && !selectedPartyId) setSelectedPartyId(res[0]._id);
        });
      }
    }
  }, [isOpen, invoiceType]);

  if (!isOpen) return null;

  const taxableValue = quantity * rate;
  const gstRate = 5.0;
  const taxAmount = taxableValue * 0.05;
  const grandTotal = taxableValue + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selected = parties.find((p) => p._id === selectedPartyId);
      await api.createInvoice({
        invoice_type: invoiceType,
        party_id: selectedPartyId,
        party_name: selected?.name || 'Party',
        party_gstin: selected?.gstin || '',
        is_interstate: isInterstate,
        items: [
          {
            description,
            hsn_sac: invoiceType === 'job_work' ? '9988' : '6006',
            quantity: Number(quantity),
            unit: 'KG',
            rate: Number(rate),
            discount: 0,
            taxable_value: taxableValue,
            cgst_pct: isInterstate ? 0 : 2.5,
            cgst_amount: isInterstate ? 0 : taxAmount / 2,
            sgst_pct: isInterstate ? 0 : 2.5,
            sgst_amount: isInterstate ? 0 : taxAmount / 2,
            igst_pct: isInterstate ? 5.0 : 0,
            igst_amount: isInterstate ? taxAmount : 0,
            total_amount: grandTotal,
          },
        ],
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`Invoice creation error: ${err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Create GST Tax Invoice</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Invoice Category</label>
            <select
              value={invoiceType}
              onChange={(e) => {
                setInvoiceType(e.target.value as any);
                setSelectedPartyId('');
              }}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
            >
              <option value="sales">Fabric Sales Invoice (Customer)</option>
              <option value="purchase">Yarn Purchase Invoice (Supplier)</option>
              <option value="job_work">Processing Charges Invoice (Job Worker)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              {invoiceType === 'sales' ? 'Customer' : 'Vendor / Job Worker'}
            </label>
            <select
              required
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Choose {invoiceType === 'sales' ? 'Customer' : 'Vendor / Job Worker'} --</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.gstin ? `(${p.gstin})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="interstate"
              checked={isInterstate}
              onChange={(e) => setIsInterstate(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="interstate" className="font-semibold text-slate-700 cursor-pointer">
              Interstate Supply (IGST 5%) instead of Intrastate (CGST 2.5% + SGST 2.5%)
            </label>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Item Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs"
            />
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
              <label className="font-semibold text-slate-700 block mb-1">Rate (₹/KG)</label>
              <input
                type="number"
                required
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 space-y-1 text-right">
            <div className="flex justify-between text-slate-500">
              <span>Taxable Value:</span>
              <span>₹{taxableValue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST (5%):</span>
              <span>₹{taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
              <span>Grand Total:</span>
              <span className="text-indigo-600">₹{grandTotal.toLocaleString('en-IN')}</span>
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
            Generate Tax Invoice
          </button>
        </div>
      </form>
    </div>
  );
};
