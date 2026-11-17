import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Invoice } from '../types';
import { Plus, Printer, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface InvoicesPageProps {
  onOpenCreateInvoice: () => void;
  onPrintInvoice?: (invoice: Invoice) => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  onOpenCreateInvoice,
  onPrintInvoice,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'sales' | 'purchase' | 'job_work'>('all');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.getInvoices();
      setInvoices(res);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(
    (inv) => typeFilter === 'all' || inv.invoice_type === typeFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            GST Invoices & Credit Notes
          </h1>
          <p className="text-xs text-slate-500">
            Indian GST compliant Tax Invoices (HSN 6006, SAC 9988, CGST/SGST/IGST breakdown)
          </p>
        </div>

        <button
          onClick={onOpenCreateInvoice}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Tax Invoice</span>
        </button>
      </div>

      {/* Type Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'sales', 'purchase', 'job_work'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
              typeFilter === t
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Invoice Number</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Party Name</th>
                <th className="pb-3">GSTIN</th>
                <th className="pb-3">Taxable Value</th>
                <th className="pb-3">GST Tax</th>
                <th className="pb-3">Total Amount</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold font-mono text-indigo-600">{inv.invoice_number}</td>
                  <td className="py-3.5 capitalize font-medium text-slate-700">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px]">
                      {inv.invoice_type}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500">{inv.invoice_date}</td>
                  <td className="py-3.5 font-semibold text-slate-900">{inv.party_name}</td>
                  <td className="py-3.5 font-mono text-[11px] text-slate-500">{inv.party_gstin || 'Unregistered'}</td>
                  <td className="py-3.5 text-slate-800 font-medium">₹{inv.total_taxable_value.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 text-slate-600">₹{inv.total_tax_amount.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 font-bold text-slate-900">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        inv.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-600'
                          : inv.payment_status === 'partially_paid'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {inv.payment_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {onPrintInvoice && (
                      <button
                        onClick={() => onPrintInvoice(inv)}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 text-xs inline-flex items-center gap-1"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
