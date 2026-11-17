import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DeliveryChallan } from '../types';
import { Plus, Printer, Truck, FileText, Ban } from 'lucide-react';

interface DeliveryChallansPageProps {
  onOpenCreateDc: () => void;
  onPrintChallan?: (dc: DeliveryChallan) => void;
}

export const DeliveryChallansPage: React.FC<DeliveryChallansPageProps> = ({
  onOpenCreateDc,
  onPrintChallan,
}) => {
  const [dcs, setDcs] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDcs = async () => {
    try {
      setLoading(true);
      const res = await api.getDeliveryChallans();
      setDcs(res);
    } catch (err) {
      console.error('Failed to load delivery challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDcs();
  }, []);

  const handleCancelDc = async (dcId: string) => {
    const reason = prompt('Please enter reason for DC cancellation:');
    if (!reason) return;
    try {
      await api.cancelChallan(dcId, reason);
      fetchDcs();
    } catch (err) {
      alert(`Failed to cancel DC: ${err}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Delivery Challans (DC)
          </h1>
          <p className="text-xs text-slate-500">
            Official delivery challan documentation for all material transit (Yarn, Job Work, Godown, Customer)
          </p>
        </div>

        <button
          onClick={onOpenCreateDc}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Delivery Challan</span>
        </button>
      </div>

      {/* Challan Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">DC Number</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">DC Type</th>
                <th className="pb-3">Party Name</th>
                <th className="pb-3">From &rarr; To Location</th>
                <th className="pb-3">Quantity</th>
                <th className="pb-3">Vehicle & Transporter</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dcs.map((dc) => (
                <tr key={dc._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold font-mono text-indigo-600">{dc.dc_number}</td>
                  <td className="py-3.5 text-slate-500">{dc.dc_date}</td>
                  <td className="py-3.5 capitalize font-medium text-slate-700">
                    {dc.dc_type.replace('_', ' ')}
                  </td>
                  <td className="py-3.5 font-semibold text-slate-900">{dc.party_name || 'Internal Transfer'}</td>
                  <td className="py-3.5 text-slate-600">
                    {dc.from_location} &rarr; {dc.to_location}
                  </td>
                  <td className="py-3.5 font-bold text-slate-900">{dc.quantity} {dc.unit}</td>
                  <td className="py-3.5 text-slate-500">
                    {dc.vehicle_number ? `${dc.vehicle_number} (${dc.transporter || 'Direct'})` : '—'}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        dc.status === 'dispatched'
                          ? 'bg-indigo-50 text-indigo-600'
                          : dc.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {dc.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right space-x-2">
                    {onPrintChallan && (
                      <button
                        onClick={() => onPrintChallan(dc)}
                        className="font-semibold text-indigo-600 hover:text-indigo-800 text-xs inline-flex items-center gap-1"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print</span>
                      </button>
                    )}
                    {dc.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelDc(dc._id)}
                        className="font-semibold text-rose-500 hover:text-rose-700 text-xs"
                      >
                        Cancel
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
