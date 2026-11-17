import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { QualityInspection } from '../types';
import { Plus, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Search } from 'lucide-react';

interface QualityPageProps {
  onOpenCreateInspection: () => void;
}

export const QualityPage: React.FC<QualityPageProps> = ({ onOpenCreateInspection }) => {
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const res = await api.getInspections();
      setInspections(res);
    } catch (err) {
      console.error('Failed to load inspections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'rejected':
        return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'rework':
        return 'bg-purple-50 text-purple-600 border border-purple-100';
      default:
        return 'bg-amber-50 text-amber-600 border border-amber-100';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quality Inspection & Testing
          </h1>
          <p className="text-xs text-slate-500">
            Standard operating procedure verification: GSM, fabric width, shade variation, shrinkage & defect logging
          </p>
        </div>

        <button
          onClick={onOpenCreateInspection}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span>Record Inspection</span>
        </button>
      </div>

      {/* QC Inspections Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Inspection ID</th>
                <th className="pb-3">Stage</th>
                <th className="pb-3">Roll / Batch</th>
                <th className="pb-3">Target vs Actual GSM</th>
                <th className="pb-3">Width</th>
                <th className="pb-3">Shade Match</th>
                <th className="pb-3">Defects Logged</th>
                <th className="pb-3">Inspector</th>
                <th className="pb-3">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {inspections.map((qc) => (
                <tr key={qc._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold font-mono text-indigo-600">{qc.inspection_number}</td>
                  <td className="py-3.5 capitalize font-medium text-slate-700">{qc.stage}</td>
                  <td className="py-3.5 font-semibold text-slate-800">{qc.roll_number || qc.batch_id || 'N/A'}</td>
                  <td className="py-3.5">
                    <span className="font-semibold text-slate-900">{qc.actual_gsm} GSM</span>
                    {qc.target_gsm && (
                      <span className="text-[10px] text-slate-400 block">Target: {qc.target_gsm}</span>
                    )}
                  </td>
                  <td className="py-3.5 text-slate-700">{qc.actual_width}"</td>
                  <td className="py-3.5 capitalize font-medium text-slate-600">
                    {qc.shade_match.replace('_', ' ')}
                  </td>
                  <td className="py-3.5">
                    {qc.defects && qc.defects.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {qc.defects.map((d, i) => (
                          <span key={i} className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600">
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-600 font-medium">None ✓</span>
                    )}
                  </td>
                  <td className="py-3.5 text-slate-500">{qc.inspector_name}</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                        qc.quality_status
                      )}`}
                    >
                      {qc.quality_status}
                    </span>
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
