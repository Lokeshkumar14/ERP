import React from 'react';
import { ProductionBatch, JobWorkOrder } from '../../types';
import {
  ArrowLeft,
  Layers,
  Plus,
  Factory,
  ArrowRight,
  PackageCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

const NEXT_PROCESS_MAP: Record<string, string> = {
  knitting: 'washing',
  washing: 'compacting',
  compacting: 'finishing',
  dyeing: 'washing',
  finishing: 'fabric_stock',
};

interface WorkOrderDetailViewProps {
  batch: ProductionBatch;
  jobOrders: JobWorkOrder[];
  onBack: () => void;
  onOpenIssueJobForBatch?: (batch: ProductionBatch, processType?: string, readyQty?: number) => void;
  onOpenReceiveJob?: (jobOrder: JobWorkOrder) => void;
}

export const WorkOrderDetailView: React.FC<WorkOrderDetailViewProps> = ({
  batch,
  jobOrders,
  onBack,
  onOpenIssueJobForBatch,
  onOpenReceiveJob,
}) => {
  const route = batch.process_route || ['knitting', 'washing', 'compacting', 'finishing'];
  const bId = String(batch._id);
  const bNum = String(batch.batch_number || '');

  // Filter jobs belonging to this batch
  const linkedJobs = jobOrders.filter(
    (j) => String(j.batch_id) === bId || String(j.batch_number) === bNum
  );

  const currentIdx = route.indexOf(batch.current_process?.toLowerCase() || '');
  const readyForNext = (batch as any).ready_for_next_stage;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
            title="Back to All Work Orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-extrabold text-indigo-600">
                {batch.batch_number}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                  batch.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                {batch.status === 'completed' ? 'Finished Stock ✓' : `Active: ${batch.current_process}`}
              </span>
              {batch.source_type === 'sales_order' ? (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  Sales Order: {batch.source_order_number}
                </span>
              ) : (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                  Stock Production
                </span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-slate-800">
              {batch.fabric_name} · {batch.colour}
            </h2>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {readyForNext && onOpenIssueJobForBatch && batch.status !== 'completed' && (
            <button
              onClick={() => onOpenIssueJobForBatch(batch, readyForNext.to_stage, readyForNext.ready_quantity)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              <span>Move {readyForNext.ready_quantity} KG to {readyForNext.to_stage}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {onOpenIssueJobForBatch && batch.status !== 'completed' && (
            <button
              onClick={() => onOpenIssueJobForBatch(batch)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Issue Process Job</span>
            </button>
          )}
        </div>
      </div>

      {/* Specifications & Overview Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Planned Weight
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">
              {batch.planned_quantity}
            </span>
            <span className="text-xs font-bold text-slate-500">KG</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Fabric Specs
          </span>
          <div className="mt-1">
            <span className="text-base font-bold text-slate-900">
              {batch.gsm} GSM
            </span>
            <span className="text-xs text-slate-500 ml-1.5">
              · Width: {batch.width}"
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Colour / Shade
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-slate-900">
              {batch.colour}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Route Pipeline
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold capitalize text-indigo-600">
              {batch.status === 'completed' ? 'Finished Goods Stock' : batch.current_process}
            </span>
            <span className="text-xs text-slate-400">
              ({batch.status === 'completed' ? route.length : (currentIdx >= 0 ? currentIdx + 1 : 1)}/{route.length})
            </span>
          </div>
        </div>
      </div>

      {/* Process Route Pipeline (Knitting ➔ Washing ➔ Compacting ➔ Finishing) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <span>Process Route Pipeline (Partial Handover Tracking)</span>
          </h3>
          <span className="text-xs text-slate-400">
            Track weights issued, received, and moved to downstream processes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {route.map((stage: string, idx: number) => {
            const sp = (batch as any).stage_progress?.find(
              (s: any) => s.stage.toLowerCase() === stage.toLowerCase()
            );
            const issued = sp?.issued_qty || 0;
            const received = sp?.received_qty || 0;
            const pending = sp?.pending_qty || 0;
            const isReadyNext = readyForNext?.from_stage === stage;
            const readyQty = readyForNext?.ready_quantity;
            const nextStage = readyForNext?.to_stage;

            const isPassed = (sp && sp.status === 'completed') || (route.indexOf(batch.current_process) > idx && !sp) || batch.status === 'completed';
            const isCurrent = (sp && (sp.status === 'issued' || sp.status === 'partially_received')) || (batch.current_process === stage && batch.status !== 'completed');

            return (
              <div
                key={stage}
                className={`rounded-2xl border p-4 text-xs space-y-3 transition ${
                  isReadyNext
                    ? 'border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-200 shadow-xs'
                    : isCurrent
                    ? 'border-indigo-200 bg-indigo-50/20 ring-1 ring-indigo-100'
                    : isPassed
                    ? 'border-slate-200 bg-slate-50/50'
                    : 'border-slate-100 bg-white opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 capitalize flex items-center gap-2 text-sm">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </span>
                    {stage}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                      sp?.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : sp?.status === 'partially_received'
                        ? 'bg-amber-100 text-amber-800'
                        : sp?.status === 'issued'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {sp?.status?.replace('_', ' ') || 'not started'}
                  </span>
                </div>

                <div className="space-y-1.5 rounded-xl bg-white p-2.5 border border-slate-100 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Issued:</span>
                    <span className="font-semibold text-slate-800">{issued} KG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Received:</span>
                    <span className="font-bold text-emerald-600">{received} KG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pending:</span>
                    <span className="font-semibold text-amber-600">{pending} KG</span>
                  </div>
                </div>

                {/* Stage Action Button */}
                {isReadyNext && onOpenIssueJobForBatch ? (
                  <button
                    onClick={() => onOpenIssueJobForBatch(batch, nextStage, readyQty)}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition"
                  >
                    <span>Move {readyQty} KG to {nextStage}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : onOpenIssueJobForBatch && batch.status !== 'completed' ? (
                  <button
                    onClick={() => onOpenIssueJobForBatch(batch, stage)}
                    className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Plus className="h-3.5 w-3.5 text-slate-500" />
                    <span>Issue {stage}</span>
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Linked Job Work Orders & Material Deliveries */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Factory className="h-4 w-4 text-indigo-600" />
              <span>Job Orders &amp; Material Deliveries ({linkedJobs.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Receive fabric inward deliveries directly here and advance them to the next process
            </p>
          </div>

          {onOpenIssueJobForBatch && batch.status !== 'completed' && (
            <button
              onClick={() => onOpenIssueJobForBatch(batch)}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Issue Another Job</span>
            </button>
          )}
        </div>

        {linkedJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
            <Factory className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-medium text-slate-600">No job work orders issued yet for this work order.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Issue the first job (e.g. Knitting) to begin manufacturing.</p>
            {onOpenIssueJobForBatch && batch.status !== 'completed' && (
              <button
                onClick={() => onOpenIssueJobForBatch(batch, 'knitting', batch.planned_quantity)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-2xs transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Issue Knitting Job ({batch.planned_quantity} KG)</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Job Number</th>
                  <th className="pb-3">Process</th>
                  <th className="pb-3">Job Worker / Mill</th>
                  <th className="pb-3">Issued Qty</th>
                  <th className="pb-3">Received Qty</th>
                  <th className="pb-3">Pending Qty</th>
                  <th className="pb-3">Rate / KG</th>
                  <th className="pb-3">Issue DC #</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Material Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linkedJobs.map((j: JobWorkOrder) => {
                  const issued = Number(j.yarn_issued_qty || j.expected_quantity || 0);
                  const received = Number(j.received_quantity || 0);
                  const pending = Math.max(0, Math.round((issued - received) * 10) / 10);
                  const nextProcess = NEXT_PROCESS_MAP[(j.process_type || '').toLowerCase()];

                  return (
                    <tr key={j._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-bold font-mono text-indigo-600">{j.job_number}</td>
                      <td className="py-3 capitalize font-semibold text-slate-800">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold">
                          {j.process_type}
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-slate-900">{j.job_worker_name}</td>
                      <td className="py-3 font-medium text-slate-800">{issued} KG</td>
                      <td className="py-3 font-bold text-emerald-600">
                        {received > 0 ? `${received} KG` : '0 KG'}
                      </td>
                      <td className="py-3 font-semibold text-amber-600">
                        {pending > 0 ? `${pending} KG` : '0 KG'}
                      </td>
                      <td className="py-3 font-medium text-slate-600">₹{j.rate_per_kg}/KG</td>
                      <td className="py-3 font-mono text-slate-500">{j.issue_dc_number || '—'}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                            j.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : j.status === 'partially_received'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {j.status === 'partially_received' ? 'Partial' : j.status}
                        </span>
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {j.status !== 'completed' && onOpenReceiveJob && (
                            <button
                              onClick={() => onOpenReceiveJob(j)}
                              className="rounded-lg bg-indigo-600 px-3 py-1 font-bold text-white hover:bg-indigo-700 text-xs shadow-2xs transition"
                            >
                              Receive Material
                            </button>
                          )}
                          {received > 0 && nextProcess && nextProcess !== 'fabric_stock' && onOpenIssueJobForBatch && (
                            <button
                              onClick={() => onOpenIssueJobForBatch(batch, nextProcess, received)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                            >
                              <span>Move to {nextProcess}</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                          {j.status === 'completed' && nextProcess === 'fabric_stock' && (
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Finished Goods Stock ✓
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
