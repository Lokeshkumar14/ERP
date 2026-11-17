import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AuditLog } from '../types';
import { History, Shield, Clock, UserCheck, RefreshCw } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(moduleFilter);
      setLogs(res);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Immutable Audit Trail & System Activity
          </h1>
          <p className="text-xs text-slate-500">
            Tamper-proof financial, stock movement, status changes, and user audit logs
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Module Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {['', 'auth', 'sales_orders', 'purchase_orders', 'job_work', 'fabric_rolls', 'quality', 'delivery_challans', 'invoices', 'accounts'].map((m) => (
          <button
            key={m}
            onClick={() => setModuleFilter(m)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              moduleFilter === m
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {m ? m.replace('_', ' ').toUpperCase() : 'ALL MODULES'}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Module</th>
                <th className="pb-3">Record ID</th>
                <th className="pb-3">Activity Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 font-mono text-[11px] text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 font-semibold text-slate-900">{log.user || 'Admin'}</td>
                  <td className="py-3 font-medium capitalize text-indigo-600">{log.action.replace('_', ' ')}</td>
                  <td className="py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 uppercase">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-[11px] text-slate-500">{log.record_id}</td>
                  <td className="py-3 text-slate-800">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
