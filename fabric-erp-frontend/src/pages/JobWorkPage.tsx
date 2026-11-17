import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ProductionBatch, JobWorkOrder } from '../types';
import { Plus, Factory, ArrowRight, CheckCircle2, RotateCcw, AlertTriangle, Layers } from 'lucide-react';

interface JobWorkPageProps {
  onOpenIssueJob: () => void;
  onOpenReceiveJob: (jobOrder: JobWorkOrder) => void;
}

export const JobWorkPage: React.FC<JobWorkPageProps> = ({
  onOpenIssueJob,
  onOpenReceiveJob,
}) => {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [jobOrders, setJobOrders] = useState<JobWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bList, jList] = await Promise.all([api.getBatches(), api.getJobOrders()]);
      setBatches(bList);
      setJobOrders(jList);
      if (bList.length > 0 && !selectedBatch) {
        setSelectedBatch(bList[0]);
      }
    } catch (err) {
      console.error('Failed to load job work:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Job Work & Process Engine
          </h1>
          <p className="text-xs text-slate-500">
            Orchestrate external job-work routes (Knitting, Washing, Compacting, Finishing) and material reconciliation
          </p>
        </div>

        <button
          onClick={onOpenIssueJob}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Issue Job Work Order</span>
        </button>
      </div>

      {/* Production Batches Route Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {batches.map((batch) => {
          const isSelected = selectedBatch?._id === batch._id;
          const route = batch.process_route || ['knitting', 'washing', 'compacting', 'finishing'];

          return (
            <div
              key={batch._id}
              onClick={() => setSelectedBatch(batch)}
              className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md ${
                isSelected ? 'border-indigo-400 ring-2 ring-indigo-50' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    {batch.source_type === 'sales_order' ? `Order: ${batch.source_order_number}` : 'Stock Production'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {batch.batch_number} - {batch.fabric_name}
                  </h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {batch.planned_quantity} KG
                </span>
              </div>

              {/* Configurable Processing Route Timeline */}
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">Process Route</span>
                <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                  {route.map((step, idx) => {
                    const isPassed = route.indexOf(batch.current_process) > idx || batch.status === 'completed';
                    const isCurrent = batch.current_process === step && batch.status !== 'completed';

                    return (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                              isPassed
                                ? 'bg-emerald-600 text-white'
                                : isCurrent
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-100'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isPassed ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`mt-1 text-[10px] capitalize font-medium ${
                              isCurrent ? 'text-indigo-600 font-bold' : 'text-slate-500'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                        {idx < route.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 ${
                              isPassed ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-50">
                <span>Colour: <strong className="text-slate-800">{batch.colour}</strong> (GSM {batch.gsm})</span>
                <span>Current Stage: <strong className="capitalize text-indigo-600">{batch.current_process}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Job Work Orders & Material Receipts */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Job Work Orders & Material Movement</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Job Number</th>
                <th className="pb-3">Batch</th>
                <th className="pb-3">Process</th>
                <th className="pb-3">Job Worker</th>
                <th className="pb-3">Expected Qty</th>
                <th className="pb-3">Received Qty</th>
                <th className="pb-3">Variance</th>
                <th className="pb-3">Rate/KG</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {jobOrders.map((j) => (
                <tr key={j._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold text-indigo-600">{j.job_number}</td>
                  <td className="py-3.5 font-semibold text-slate-800">{j.batch_number}</td>
                  <td className="py-3.5 capitalize font-medium text-slate-700">{j.process_type}</td>
                  <td className="py-3.5 text-slate-900 font-semibold">{j.job_worker_name}</td>
                  <td className="py-3.5 font-medium text-slate-800">{j.expected_quantity} KG</td>
                  <td className="py-3.5 font-bold text-emerald-600">
                    {j.received_quantity ? `${j.received_quantity} KG` : 'Pending'}
                  </td>
                  <td className="py-3.5 font-medium text-slate-500">
                    {j.reconciliation_variance !== undefined ? (
                      <span className={j.reconciliation_variance === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                        {j.reconciliation_variance} KG
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3.5 font-medium text-slate-700">₹{j.rate_per_kg}/KG</td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        j.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {j.status !== 'completed' ? (
                      <button
                        onClick={() => onOpenReceiveJob(j)}
                        className="rounded-lg bg-indigo-50 px-3 py-1 font-semibold text-indigo-600 hover:bg-indigo-100 text-xs transition"
                      >
                        Receive Material
                      </button>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-600">Received ✓</span>
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
