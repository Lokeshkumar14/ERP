import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Customer, Party, Invoice } from '../../types';
import { X } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [paymentType, setPaymentType] = useState<
    'customer_receipt' | 'supplier_payment' | 'job_worker_payment' | 'expense'
  >('customer_receipt');

  const [parties, setParties] = useState<any[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState(50000);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer (NEFT/RTGS)');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (paymentType === 'customer_receipt') {
        api.getCustomers().then((res) => {
          setParties(res);
          if (res.length > 0) setSelectedPartyId(res[0]._id);
        });
        api.getInvoices().then((invs) => {
          setInvoices(invs.filter((i) => i.invoice_type === 'sales' && i.payment_status !== 'paid'));
        });
      } else if (paymentType === 'expense') {
        setParties([]);
        setInvoices([]);
      } else {
        api.getParties().then((res) => {
          setParties(res);
          if (res.length > 0) setSelectedPartyId(res[0]._id);
        });
        api.getInvoices().then((invs) => {
          setInvoices(invs.filter((i) => i.invoice_type !== 'sales' && i.payment_status !== 'paid'));
        });
      }
    }
  }, [isOpen, paymentType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selected = parties.find((p) => p._id === selectedPartyId);
      const selectedInv = invoices.find((i) => i._id === selectedInvoiceId);

      await api.recordPayment({
        payment_type: paymentType,
        party_id: selectedPartyId || undefined,
        party_name: selected?.name || (paymentType === 'expense' ? 'Operational Expense' : ''),
        amount: Number(amount),
        payment_mode: paymentMode,
        reference_number: referenceNo,
        allocated_invoice_id: selectedInvoiceId || undefined,
        allocated_invoice_number: selectedInv?.invoice_number || undefined,
        notes,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`Payment recording error: ${err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Record Payment / Receipt Voucher</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Transaction Category</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
            >
              <option value="customer_receipt">Customer Receipt (Incoming Fund)</option>
              <option value="supplier_payment">Yarn Supplier Payment (Outgoing Fund)</option>
              <option value="job_worker_payment">Job Worker Payment (Outgoing Fund)</option>
              <option value="expense">Operational Expense (Transport / Labour)</option>
            </select>
          </div>

          {paymentType !== 'expense' && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                {paymentType === 'customer_receipt' ? 'Customer' : 'Vendor'}
              </label>
              <select
                required
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose {paymentType === 'customer_receipt' ? 'Customer' : 'Vendor'} --</option>
                {parties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {invoices.length > 0 && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Allocate Against Invoice (Optional)</label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  const inv = invoices.find((i) => i._id === e.target.value);
                  if (inv) setAmount(inv.outstanding_amount);
                }}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none font-mono"
              >
                <option value="">-- No direct invoice allocation (Advance / On Account) --</option>
                {invoices.map((inv) => (
                  <option key={inv._id} value={inv._id}>
                    {inv.invoice_number} (Outstanding: ₹{inv.outstanding_amount.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-indigo-700"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
              >
                <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Transaction Ref / Cheque No</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. UTR-9988112233"
              className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Notes / Narration</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment remarks"
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
            Confirm & Save Voucher
          </button>
        </div>
      </form>
    </div>
  );
};
