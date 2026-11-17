import React from 'react';
import { Invoice } from '../../types';
import { Printer, X } from 'lucide-react';

interface PrintableInvoiceProps {
  invoice: Invoice;
  onClose: () => void;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-8 shadow-2xl printable-card">
        {/* Screen Controls (Hidden on Print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            GST Tax Invoice Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Formal Tax Invoice Content */}
        <div className="space-y-6 text-slate-800 text-xs">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">TEXTILEPRO TRADING CO.</h1>
              <p className="text-[11px] text-slate-500">
                128 Cotton Market Complex, Kangeyam Road, Tirupur, Tamil Nadu - 641604
              </p>
              <p className="text-[11px] font-semibold text-slate-700 mt-1">
                GSTIN: 33AAACT9876E1Z9 | State: Tamil Nadu (33)
              </p>
              <p className="text-[11px] text-slate-500">Email: accounts@textilepro.in | Phone: +91 421 2233445</p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                TAX INVOICE
              </span>
              <p className="text-sm font-bold text-slate-900">{invoice.invoice_number}</p>
              <p className="text-[11px] text-slate-500">Date: {invoice.invoice_date}</p>
            </div>
          </div>

          {/* Billed To */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-3.5">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Billed To (Customer)</span>
              <h4 className="text-sm font-bold text-slate-900">{invoice.party_name}</h4>
              <p className="text-[11px] font-mono text-slate-700 mt-0.5">GSTIN: {invoice.party_gstin || 'Unregistered'}</p>
              <p className="text-[11px] text-slate-500 mt-1">Payment Terms: 30 Days Credit</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Dispatch Details</span>
              <p className="text-[11px] text-slate-700">Place of Supply: {invoice.is_interstate ? 'Interstate' : 'Intrastate (Tamil Nadu)'}</p>
              <p className="text-[11px] text-slate-500 mt-1">Vehicle No: TN-39-AZ-4545</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-2.5">S.No</th>
                <th className="p-2.5">Item Description</th>
                <th className="p-2.5">HSN/SAC</th>
                <th className="p-2.5 text-right">Qty (KG)</th>
                <th className="p-2.5 text-right">Rate (₹)</th>
                <th className="p-2.5 text-right">Taxable (₹)</th>
                <th className="p-2.5 text-right">GST Rate</th>
                <th className="p-2.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items?.map((it, idx) => (
                <tr key={idx}>
                  <td className="p-2.5 font-medium">{idx + 1}</td>
                  <td className="p-2.5 font-semibold text-slate-900">{it.description}</td>
                  <td className="p-2.5 font-mono">{it.hsn_sac}</td>
                  <td className="p-2.5 text-right font-medium">{it.quantity}</td>
                  <td className="p-2.5 text-right">₹{it.rate}</td>
                  <td className="p-2.5 text-right font-semibold">₹{it.taxable_value.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-right">
                    {invoice.is_interstate ? `IGST ${it.igst_pct}%` : `CGST ${it.cgst_pct}% + SGST ${it.sgst_pct}%`}
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900">
                    ₹{it.total_amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown & Grand Total */}
          <div className="flex justify-between items-start pt-2">
            <div className="w-1/2 space-y-1 text-[11px] text-slate-500">
              <span className="font-bold text-slate-700 block mb-1">Bank Payment Details:</span>
              <p>Bank: HDFC Bank Ltd, Tirupur Main Branch</p>
              <p>A/C No: 50200012345678 | IFSC: HDFC0000123</p>
              <p className="mt-2 text-[10px] text-slate-400">
                Declaration: We declare that this invoice shows actual price of the goods described and all particulars are true and correct.
              </p>
            </div>

            <div className="w-72 space-y-2 border-t border-slate-200 pt-2 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Total Taxable Amount:</span>
                <span className="font-semibold">₹{invoice.total_taxable_value.toLocaleString('en-IN')}</span>
              </div>
              {!invoice.is_interstate ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Central GST (2.5%):</span>
                    <span>₹{invoice.total_cgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (2.5%):</span>
                    <span>₹{invoice.total_sgst.toLocaleString('en-IN')}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (5.0%):</span>
                  <span>₹{invoice.total_igst.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t-2 border-slate-800 pt-1.5">
                <span>Grand Total:</span>
                <span className="text-indigo-600">₹{invoice.grand_total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-8 border-t border-slate-200">
            <div className="text-center">
              <div className="h-10 border-b border-slate-300 w-40" />
              <span className="text-[10px] text-slate-400 mt-1 block">Receiver's Signature</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-700 block mb-6">For TEXTILEPRO TRADING CO.</span>
              <div className="h-4 border-b border-slate-300 w-44" />
              <span className="text-[10px] text-slate-400 mt-1 block">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
