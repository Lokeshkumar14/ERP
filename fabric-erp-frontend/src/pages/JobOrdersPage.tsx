import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { JobWorkOrder } from '../types';
import { Plus, Search, Filter, Factory, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, ArrowDownRight, ArrowUpRight, ArrowRight } from 'lucide-react';

const NEXT_PROCESS_LOOKUP: Record<string, string> = {
  knitting: 'washing',
  washing: 'compacting',
  compacting: 'finishing',
  dyeing: 'washing',
  finishing: 'fabric_stock',
};

interface JobOrdersPageProps {
  onOpenIssueJob: () => void;
  onOpenReceiveJob: (jobOrder: JobWorkOrder) => void;
  onForwardJobToNextStage?: (jobOrder: JobWorkOrder, nextProcess: string, qty: number) => void;
}

export const JobOrdersPage: React.FC<JobOrdersPageProps> = ({
  onOpenIssueJob,
  onOpenReceiveJob,
  onForwardJobToNextStage,
}) => {
  const [jobOrders, setJobOrders] = useState<JobWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [processFilter, setProcessFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchJobOrders = async () => {
    try {
      setLoading(true);
      const jList = await api.getJobOrders();
      setJobOrders(jList);
    } catch (err) {
      console.error('Failed to load job orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobOrders();
  }, []);

  const filteredJobs = jobOrders.filter((j) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      j.job_number.toLowerCase().includes(q) ||
      (j.batch_number || '').toLowerCase().includes(q) ||
      (j.job_worker_name || '').toLowerCase().includes(q) ||
      j.process_type.toLowerCase().includes(q);

    const matchesProcess =
      processFilter === 'all' || j.process_type.toLowerCase() === processFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'all' || j.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesProcess && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Summary Metrics
  const totalIssued = jobOrders.reduce((sum, j) => sum + (j.expected_quantity || 0), 0);
  const totalReceived = jobOrders.reduce((sum, j) => sum + (j.received_quantity || 0), 0);
  const totalVariance = jobOrders.reduce((sum, j) => sum + (j.reconciliation_variance || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Job Work Orders & Material Movement
          </h1>
          <p className="text-xs text-slate-500">
            Track material issues to outsourced units (Knitting, Washing, Compacting, Finishing) and inward receipts
          </p>
        </div>

        <button
          onClick={onOpenIssueJob}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>+ Issue Job Work Order</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Job Orders</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{jobOrders.length}</span>
            <span className="text-xs text-slate-500 font-medium">orders</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Material Issued</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-indigo-600">{totalIssued.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-500 font-medium">KG</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Total Received</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-600">{totalReceived.toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-500 font-medium">KG</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Process Variance / Loss</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-extrabold ${totalVariance <= 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {totalVariance.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-medium">KG</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Job #, Work Order #, job worker..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Status:</span>
            <div className="flex rounded-xl bg-slate-100 p-0.5">
              <button
                onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => { setStatusFilter('issued'); setCurrentPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  statusFilter === 'issued' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Issued (Pending)
              </button>
              <button
                onClick={() => { setStatusFilter('completed'); setCurrentPage(1); }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                  statusFilter === 'completed' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Process Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Process:</span>
          {['all', 'knitting', 'washing', 'compacting', 'finishing', 'dyeing'].map((proc) => (
            <button
              key={proc}
              onClick={() => { setProcessFilter(proc); setCurrentPage(1); }}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                processFilter === proc
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {proc}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-400 font-medium">
            {filteredJobs.length} Job Order{filteredJobs.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Main Job Orders Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Job Number</th>
                <th className="pb-3">Work Order Ref</th>
                <th className="pb-3">Process Type</th>
                <th className="pb-3">Job Worker / Unit</th>
                <th className="pb-3">Expected Qty</th>
                <th className="pb-3">Received Qty</th>
                <th className="pb-3">Variance / Loss</th>
                <th className="pb-3">Rate / KG</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading job work orders...
                  </td>
                </tr>
              ) : paginatedJobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No job work orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((j) => (
                  <tr key={j._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 font-bold font-mono text-indigo-600">{j.job_number}</td>
                    <td className="py-3.5 font-semibold text-slate-800 font-mono">{j.batch_number}</td>
                    <td className="py-3.5 capitalize font-medium text-slate-700">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        {j.process_type}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-900 font-semibold">{j.job_worker_name}</td>
                    <td className="py-3.5 font-medium text-slate-800">{j.expected_quantity} KG</td>
                    <td className="py-3.5 font-bold text-emerald-600">
                      {j.received_quantity ? `${j.received_quantity} KG` : 'Pending'}
                    </td>
                    <td className="py-3.5 font-medium text-slate-500">
                      {j.reconciliation_variance !== undefined ? (
                        <span className={j.reconciliation_variance === 0 ? 'text-emerald-600' : 'text-amber-600 font-semibold'}>
                          {j.reconciliation_variance} KG
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 font-medium text-slate-700">₹{j.rate_per_kg}/KG</td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                          j.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : j.status === 'partially_received'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {j.status === 'partially_received' ? 'Partial Delivery' : j.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {j.status !== 'completed' && (
                          <button
                            onClick={() => onOpenReceiveJob(j)}
                            className="rounded-lg bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-600 hover:bg-indigo-100 text-xs transition"
                          >
                            Receive Material
                          </button>
                        )}
                        {Number(j.received_quantity) > 0 && NEXT_PROCESS_LOOKUP[(j.process_type || '').toLowerCase()] && NEXT_PROCESS_LOOKUP[(j.process_type || '').toLowerCase()] !== 'fabric_stock' && onForwardJobToNextStage && (
                          <button
                            onClick={() =>
                              onForwardJobToNextStage(
                                j,
                                NEXT_PROCESS_LOOKUP[(j.process_type || '').toLowerCase()] || 'washing',
                                Number(j.received_quantity)
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                            title={`Forward received fabric to ${NEXT_PROCESS_LOOKUP[(j.process_type || '').toLowerCase()]}`}
                          >
                            <span>Forward → {NEXT_PROCESS_LOOKUP[(j.process_type || '').toLowerCase()]}</span>
                          </button>
                        )}
                        {j.status === 'completed' && Number(j.received_quantity) > 0 && NEXT_PROCESS_LOOKUP[(j.process_type || '').toLowerCase()] === 'fabric_stock' && (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Fabric In Stock ✓
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredJobs.length > pageSize && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>
              Showing <strong>{((currentPage - 1) * pageSize) + 1}</strong> to{' '}
              <strong>{Math.min(currentPage * pageSize, filteredJobs.length)}</strong> of{' '}
              <strong>{filteredJobs.length}</strong> Job Orders
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
    </div>
  );
};
