import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ProductionBatch, JobWorkOrder } from '../types';
import { WorkOrderDetailView } from '../components/work_orders/WorkOrderDetailView';
import {
  Plus,
  Search,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  LayoutGrid,
  ArrowRight,
  Factory,
  CheckCircle2,
} from 'lucide-react';

interface WorkOrdersPageProps {
  onOpenCreateBatch: () => void;
  onOpenIssueJobForBatch?: (batch: ProductionBatch, processType?: string, readyQty?: number) => void;
  onOpenReceiveJob?: (jobOrder: JobWorkOrder) => void;
}

export const WorkOrdersPage: React.FC<WorkOrdersPageProps> = ({
  onOpenCreateBatch,
  onOpenIssueJobForBatch,
  onOpenReceiveJob,
}) => {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [jobOrders, setJobOrders] = useState<JobWorkOrder[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Search, Filter & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = viewMode === 'table' ? 10 : 6;

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const [bList, jList] = await Promise.all([
        api.getBatches(),
        api.getJobOrders(),
      ]);
      setBatches(bList);
      setJobOrders(jList);
    } catch (err) {
      console.error('Failed to load work orders & jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const getJobsForBatch = (b: ProductionBatch) => {
    const bId = String(b._id);
    const bNum = String(b.batch_number || '');
    return jobOrders.filter(
      (j) => String(j.batch_id) === bId || String(j.batch_number) === bNum
    );
  };

  const filteredBatches = batches.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.batch_number.toLowerCase().includes(q) ||
      (b.source_order_number || '').toLowerCase().includes(q) ||
      b.fabric_name.toLowerCase().includes(q) ||
      b.colour.toLowerCase().includes(q);

    const matchesStage =
      stageFilter === 'all' ||
      (stageFilter === 'completed'
        ? b.status === 'completed'
        : b.current_process?.toLowerCase() === stageFilter.toLowerCase());

    const matchesSource =
      sourceFilter === 'all' ||
      (sourceFilter === 'sales_order'
        ? b.source_type === 'sales_order'
        : b.source_type !== 'sales_order');

    return matchesSearch && matchesStage && matchesSource;
  });

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / pageSize));
  const paginatedBatches = filteredBatches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Quick Metrics
  const totalPlannedKg = batches.reduce((sum, b) => sum + (b.planned_quantity || 0), 0);
  const activeCount = batches.filter((b) => b.status !== 'completed').length;
  const completedCount = batches.filter((b) => b.status === 'completed').length;

  // Selected Work Order Details View
  const selectedBatch = batches.find((b) => b._id === selectedBatchId);
  if (selectedBatchId && selectedBatch) {
    return (
      <WorkOrderDetailView
        batch={selectedBatch}
        jobOrders={jobOrders}
        onBack={() => {
          setSelectedBatchId(null);
          fetchBatches();
        }}
        onOpenIssueJobForBatch={(batch, proc, qty) => {
          if (onOpenIssueJobForBatch) {
            onOpenIssueJobForBatch(batch, proc, qty);
          }
        }}
        onOpenReceiveJob={(job) => {
          if (onOpenReceiveJob) {
            onOpenReceiveJob(job);
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Production Work Orders
          </h1>
          <p className="text-xs text-slate-500">
            Click on any work order row to inspect full process routes (Knitting, Washing, Compacting, Finishing) and linked job orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => { setViewMode('table'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Dense Table View"
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => { setViewMode('cards'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visual Cards View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            onClick={onOpenCreateBatch}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ New Work Order</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Work Orders</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{batches.length}</span>
            <span className="text-xs text-slate-500">runs</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">In Active Production</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600">{activeCount}</span>
            <span className="text-xs text-slate-500">in-progress</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Completed W.O.</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600">{completedCount}</span>
            <span className="text-xs text-slate-500">finished</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Planned Weight</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalPlannedKg.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-500 font-semibold">KG</span>
          </div>
        </div>
      </div>

      {/* Search, Filter Bar */}
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by WO #, Sales Order #, fabric structure, colour..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Source:</span>
            <div className="flex rounded-xl bg-slate-100 p-0.5">
              <button
                onClick={() => { setSourceFilter('all'); setCurrentPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  sourceFilter === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setSourceFilter('sales_order'); setCurrentPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  sourceFilter === 'sales_order' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Against Orders
              </button>
              <button
                onClick={() => { setSourceFilter('stock_production'); setCurrentPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  sourceFilter === 'stock_production' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock Production
              </button>
            </div>
          </div>
        </div>

        {/* Process Stage Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Stages:</span>
          {['all', 'knitting', 'washing', 'compacting', 'finishing', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => { setStageFilter(st); setCurrentPage(1); }}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                stageFilter === st
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-400 font-medium">
            {filteredBatches.length} Work Order{filteredBatches.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Main View: Clean High-Density Table with Row-Click Details */}
      {viewMode === 'table' ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-3">Work Order #</th>
                  <th className="pb-3">Source / Sales Order</th>
                  <th className="pb-3">Fabric Structure</th>
                  <th className="pb-3">Colour &amp; Shade</th>
                  <th className="pb-3">Specs (GSM · Width)</th>
                  <th className="pb-3">Planned Qty</th>
                  <th className="pb-3">Process Route Progress</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">Loading work orders...</td>
                  </tr>
                ) : paginatedBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No work orders found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedBatches.map((batch) => {
                    const route = batch.process_route || ['knitting', 'washing', 'compacting', 'finishing'];
                    const currentIdx = route.indexOf(batch.current_process);
                    const linkedJobs = getJobsForBatch(batch);
                    const readyNext = (batch as any).ready_for_next_stage;

                    return (
                      <tr
                        key={batch._id}
                        onClick={() => setSelectedBatchId(batch._id)}
                        className="group cursor-pointer transition hover:bg-indigo-50/40"
                        title="Click to view full work order stage details"
                      >
                        {/* WO Number */}
                        <td className="py-3.5 font-bold font-mono text-indigo-600 text-sm group-hover:underline">
                          <div className="flex items-center gap-2">
                            <span>{batch.batch_number}</span>
                            {linkedJobs.length > 0 && (
                              <span className="rounded-full bg-indigo-50 px-1.5 py-0.2 text-[10px] font-bold text-indigo-600 border border-indigo-100">
                                {linkedJobs.length} {linkedJobs.length === 1 ? 'job' : 'jobs'}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Source Order */}
                        <td className="py-3.5">
                          {batch.source_type === 'sales_order' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                              {batch.source_order_number || 'Order Ref'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                              Stock Production
                            </span>
                          )}
                        </td>

                        {/* Fabric Name */}
                        <td className="py-3.5 font-semibold text-slate-900">
                          {batch.fabric_name}
                        </td>

                        {/* Colour */}
                        <td className="py-3.5 font-medium text-slate-700">
                          {batch.colour}
                        </td>

                        {/* GSM & Width */}
                        <td className="py-3.5 text-slate-500">
                          {batch.gsm} GSM · {batch.width}"
                        </td>

                        {/* Planned Weight */}
                        <td className="py-3.5 font-bold text-slate-900">
                          {batch.planned_quantity} <span className="text-[10px] text-slate-400 font-semibold">KG</span>
                        </td>

                        {/* Route Stepper & Progress */}
                        <td className="py-3.5">
                          <div className="space-y-1.5 min-w-[190px]">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-indigo-700 capitalize text-[11px]">
                                {batch.status === 'completed' ? 'Finished Stock ✓' : `Active: ${batch.current_process}`}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({batch.status === 'completed' ? route.length : (currentIdx >= 0 ? currentIdx + 1 : 1)}/{route.length})
                              </span>
                            </div>

                            {/* Stepper Dots */}
                            <div className="flex items-center gap-1">
                              {route.map((step, idx) => {
                                const sp = (batch as any).stage_progress?.find((s: any) => s.stage.toLowerCase() === step.toLowerCase());
                                const isPassed = (sp && sp.status === 'completed') || (route.indexOf(batch.current_process) > idx && !sp) || batch.status === 'completed';
                                const isCurrent = (sp && (sp.status === 'issued' || sp.status === 'partially_received')) || (batch.current_process === step && batch.status !== 'completed');
                                
                                return (
                                  <div
                                    key={step}
                                    title={`${step.toUpperCase()}: ${sp ? `${sp.received_qty}/${sp.issued_qty} KG (Pending: ${sp.pending_qty} KG)` : step}`}
                                    className={`h-2 flex-1 rounded-full transition ${
                                      isPassed
                                        ? 'bg-emerald-500'
                                        : isCurrent
                                        ? 'bg-indigo-600 ring-2 ring-indigo-200'
                                        : 'bg-slate-200'
                                    }`}
                                  />
                                );
                              })}
                            </div>

                            {/* Ready next stage handover banner */}
                            {readyNext ? (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                  <span>{readyNext.ready_quantity} KG ready for {readyNext.to_stage}</span>
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              batch.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {batch.status === 'completed' ? 'Completed' : 'In Production'}
                          </span>
                        </td>

                        {/* Action: View Details / Move */}
                        <td className="py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {readyNext && onOpenIssueJobForBatch && batch.status !== 'completed' && (
                              <button
                                onClick={() => onOpenIssueJobForBatch(batch, readyNext.to_stage, readyNext.ready_quantity)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-2xs transition"
                              >
                                <span>Move {readyNext.ready_quantity} KG</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedBatchId(batch._id)}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
                            >
                              <span>View Stages &amp; Jobs</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          {filteredBatches.length > pageSize && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * pageSize, filteredBatches.length)}</strong> of{' '}
                <strong>{filteredBatches.length}</strong> Work Orders
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Visual Cards View (Alternate Option) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {paginatedBatches.map((batch) => {
              const route = batch.process_route || ['knitting', 'washing', 'compacting', 'finishing'];
              const linkedJobs = getJobsForBatch(batch);
              const readyNext = (batch as any).ready_for_next_stage;

              return (
                <div
                  key={batch._id}
                  onClick={() => setSelectedBatchId(batch._id)}
                  className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        {batch.source_type === 'sales_order' ? `Sales Order: ${batch.source_order_number}` : 'Own Stock Production'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {batch.batch_number} - {batch.fabric_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                        {batch.planned_quantity} KG
                      </span>
                    </div>
                  </div>

                  {/* Processing Route Timeline */}
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
                    <span>Colour: <strong className="text-slate-800">{batch.colour}</strong> (GSM {batch.gsm} · {batch.width}")</span>
                    <span>
                      Current Stage: <strong className="capitalize text-indigo-600 font-bold">{batch.current_process}</strong>
                    </span>
                  </div>

                  {/* Card Bottom: Click to Open Details */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {linkedJobs.length} Job Order{linkedJobs.length !== 1 ? 's' : ''} Issued
                    </span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {readyNext && onOpenIssueJobForBatch && batch.status !== 'completed' && (
                        <button
                          onClick={() => onOpenIssueJobForBatch(batch, readyNext.to_stage, readyNext.ready_quantity)}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
                        >
                          Move {readyNext.ready_quantity} KG →
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedBatchId(batch._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        <span>View Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cards View Pagination */}
          {filteredBatches.length > pageSize && (
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-xs text-slate-500">
              <span>
                Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong> to{' '}
                <strong>{Math.min(currentPage * pageSize, filteredBatches.length)}</strong> of{' '}
                <strong>{filteredBatches.length}</strong> Work Orders
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
