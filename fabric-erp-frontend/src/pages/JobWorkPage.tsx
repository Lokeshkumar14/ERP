import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ProductionBatch, JobWorkOrder } from '../types';
import { Plus, Factory, ArrowRight, CheckCircle2, RotateCcw, AlertTriangle, Layers, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface JobWorkPageProps {
  onOpenCreateBatch?: () => void;
  onOpenIssueJob: () => void;
  onOpenReceiveJob: (jobOrder: JobWorkOrder) => void;
}

export const JobWorkPage: React.FC<JobWorkPageProps> = ({
  onOpenCreateBatch,
  onOpenIssueJob,
  onOpenReceiveJob,
}) => {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [jobOrders, setJobOrders] = useState<JobWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);

  // Search & Filter States for Work Orders (Large dataset handling)
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [batchPage, setBatchPage] = useState(1);
  const batchPageSize = 6;

  // Job Work Orders Table Search & Pagination
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobPage, setJobPage] = useState(1);
  const jobPageSize = 8;

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

  const filteredBatches = batches.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.batch_number.toLowerCase().includes(q) ||
      (b.source_order_number || '').toLowerCase().includes(q) ||
      b.fabric_name.toLowerCase().includes(q) ||
      b.colour.toLowerCase().includes(q);

    const matchesStage =
      stageFilter === 'all' ||
      (stageFilter === 'completed' ? b.status === 'completed' : b.current_process?.toLowerCase() === stageFilter.toLowerCase());

    const matchesSource =
      sourceFilter === 'all' ||
      (sourceFilter === 'sales_order' ? b.source_type === 'sales_order' : b.source_type !== 'sales_order');

    return matchesSearch && matchesStage && matchesSource;
  });

  const totalBatchPages = Math.max(1, Math.ceil(filteredBatches.length / batchPageSize));
  const paginatedBatches = filteredBatches.slice((batchPage - 1) * batchPageSize, batchPage * batchPageSize);

  const filteredJobs = jobOrders.filter((j) => {
    const q = jobSearchQuery.toLowerCase();
    return (
      j.job_number.toLowerCase().includes(q) ||
      (j.batch_number || '').toLowerCase().includes(q) ||
      (j.job_worker_name || '').toLowerCase().includes(q) ||
      j.process_type.toLowerCase().includes(q)
    );
  });

  const totalJobPages = Math.max(1, Math.ceil(filteredJobs.length / jobPageSize));
  const paginatedJobs = filteredJobs.slice((jobPage - 1) * jobPageSize, jobPage * jobPageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Work Orders & Job Work Process
          </h1>
          <p className="text-xs text-slate-500">
            Orchestrate production work orders, external job-work routes (Knitting, Washing, Compacting, Finishing) and material reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCreateBatch && (
            <button
              onClick={onOpenCreateBatch}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100 transition"
            >
              <Layers className="h-4 w-4" />
              <span>+ New Work Order</span>
            </button>
          )}

          <button
            onClick={onOpenIssueJob}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Issue Job Work Order</span>
          </button>
        </div>
      </div>

      {/* Work Orders Search, Filter & Quick Stats (Optimized for Large Data) */}
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by WO #, Order # (e.g. SO-2001), fabric, colour..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setBatchPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Filter Source:</span>
            <div className="flex rounded-xl bg-slate-100 p-0.5">
              <button
                onClick={() => { setSourceFilter('all'); setBatchPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  sourceFilter === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setSourceFilter('sales_order'); setBatchPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  sourceFilter === 'sales_order' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                MTO Orders
              </button>
              <button
                onClick={() => { setSourceFilter('stock_production'); setBatchPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  sourceFilter === 'stock_production' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock
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
              onClick={() => { setStageFilter(st); setBatchPage(1); }}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                stageFilter === st
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-400">
            {filteredBatches.length} Work Order{filteredBatches.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Production Work Orders Route Overview Grid */}
      {filteredBatches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400 space-y-2">
          <Layers className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="font-semibold text-slate-600">No work orders match the selected filters</p>
          <p>Try clearing your search or change the stage filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {paginatedBatches.map((batch) => {
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
      )}

      {/* Work Orders Pagination */}
      {filteredBatches.length > batchPageSize && (
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-xs text-slate-500">
          <span>
            Showing <strong>{((batchPage - 1) * batchPageSize) + 1}</strong> to{' '}
            <strong>{Math.min(batchPage * batchPageSize, filteredBatches.length)}</strong> of{' '}
            <strong>{filteredBatches.length}</strong> Work Orders
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={batchPage === 1}
              onClick={() => setBatchPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-semibold text-slate-700">
              {batchPage} / {totalBatchPages}
            </span>
            <button
              disabled={batchPage === totalBatchPages}
              onClick={() => setBatchPage((p) => Math.min(totalBatchPages, p + 1))}
              className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Active Job Work Orders & Material Receipts */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Job Work Orders & Material Movement</h3>
            <p className="text-[11px] text-slate-400">Track outward material issues to knitting/dyeing units & inward receipts</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search job #, WO #, worker..."
              value={jobSearchQuery}
              onChange={(e) => {
                setJobSearchQuery(e.target.value);
                setJobPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Job Number</th>
                <th className="pb-3">Work Order</th>
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
              {paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No job work orders found matching search criteria.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((j) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Job Orders Pagination */}
        {filteredJobs.length > jobPageSize && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>
              Showing <strong>{((jobPage - 1) * jobPageSize) + 1}</strong> to{' '}
              <strong>{Math.min(jobPage * jobPageSize, filteredJobs.length)}</strong> of{' '}
              <strong>{filteredJobs.length}</strong> Job Orders
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={jobPage === 1}
                onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-semibold text-slate-700">
                {jobPage} / {totalJobPages}
              </span>
              <button
                disabled={jobPage === totalJobPages}
                onClick={() => setJobPage((p) => Math.min(totalJobPages, p + 1))}
                className="rounded-lg border border-slate-200 p-1 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
