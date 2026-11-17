import React from 'react';
import { DeliveryChallan } from '../../types';
import { Printer, X } from 'lucide-react';

interface PrintableChallanProps {
  challan: DeliveryChallan;
  onClose: () => void;
}

export const PrintableChallan: React.FC<PrintableChallanProps> = ({ challan, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl printable-card">
        {/* Screen Controls */}
        <div className="no-print flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Delivery Challan Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <Printer className="h-4 w-4" />
              <span>Print Challan</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Challan Content */}
        <div className="space-y-6 text-slate-800 text-xs">
          <div className="text-center border-b-2 border-slate-800 pb-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">TEXTILEPRO TRADING CO.</h1>
            <p className="text-[11px] text-slate-500">128 Cotton Market Complex, Kangeyam Road, Tirupur - 641604</p>
            <h2 className="text-sm font-bold tracking-widest text-indigo-700 mt-2 uppercase">
              DELIVERY CHALLAN ({challan.dc_type.replace('_', ' ').toUpperCase()})
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p><strong>DC Number:</strong> <span className="font-mono text-indigo-600 font-bold">{challan.dc_number}</span></p>
              <p><strong>Date:</strong> {challan.dc_date}</p>
              <p><strong>Reference Order/Job:</strong> {challan.reference_job_number || challan.reference_order_number || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p><strong>Transporter:</strong> {challan.transporter || 'Direct Truck'}</p>
              <p><strong>Vehicle No:</strong> {challan.vehicle_number || 'TN-39-AZ-4545'}</p>
              <p><strong>E-way Bill:</strong> {challan.eway_bill_number || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-1">Dispatch From:</span>
              <p className="font-semibold text-slate-900">{challan.from_location}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-1">Delivered To:</span>
              <p className="font-semibold text-slate-900">{challan.to_location}</p>
              <p className="text-[11px] text-slate-600">Party: {challan.party_name}</p>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-2.5">S.No</th>
                <th className="p-2.5">Material Description</th>
                <th className="p-2.5">Roll Numbers</th>
                <th className="p-2.5 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2.5">1</td>
                <td className="p-2.5 font-semibold text-slate-900">{challan.item_description}</td>
                <td className="p-2.5 text-[11px] font-mono text-slate-600">
                  {challan.roll_numbers?.join(', ') || 'N/A'}
                </td>
                <td className="p-2.5 text-right font-bold text-slate-900">
                  {challan.quantity} {challan.unit}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-end pt-12 border-t border-slate-200">
            <div className="text-center">
              <div className="h-8 border-b border-slate-300 w-36" />
              <span className="text-[10px] text-slate-400 mt-1 block">Receiver's Sign & Stamp</span>
            </div>
            <div className="text-center">
              <div className="h-8 border-b border-slate-300 w-36" />
              <span className="text-[10px] text-slate-400 mt-1 block">Prepared By ({challan.prepared_by})</span>
            </div>
            <div className="text-center">
              <div className="h-8 border-b border-slate-300 w-36" />
              <span className="text-[10px] text-slate-400 mt-1 block">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
