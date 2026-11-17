import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Party } from '../types';
import { Plus, Factory, Building2, MapPin, Search, Phone, Mail } from 'lucide-react';

interface PartiesPageProps {
  onOpenCreateParty: (type?: 'supplier' | 'job_worker') => void;
}

export const PartiesPage: React.FC<PartiesPageProps> = ({ onOpenCreateParty }) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await api.getParties();
      setParties(res);
    } catch (err) {
      console.error('Failed to load parties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const filteredParties = parties.filter((p) => {
    // Type filter
    if (filterType === 'supplier' && !p.party_types.includes('supplier')) return false;
    if (filterType === 'job_worker' && !p.party_types.includes('job_worker')) return false;
    if (filterType === 'knitting' && (!p.services || !p.services.includes('knitting'))) return false;
    if (filterType === 'washing_compacting' && (!p.services || (!p.services.includes('washing') && !p.services.includes('compacting')))) return false;
    if (filterType === 'finishing' && (!p.services || (!p.services.includes('finishing') && !p.services.includes('dyeing')))) return false;

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCode = p.party_code?.toLowerCase().includes(q);
      const matchGst = p.gstin?.toLowerCase().includes(q);
      const matchContact = p.contact_person?.toLowerCase().includes(q);
      return matchName || matchCode || matchGst || matchContact;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Suppliers &amp; Job-Work Units
          </h1>
          <p className="text-xs text-slate-500">
            Directory of yarn spinning mills, knitting companies, washing &amp; compacting units, finishing factories and processing rates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCreateParty('supplier')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 shadow-xs hover:bg-indigo-100 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add Yarn Supplier</span>
          </button>
          <button
            onClick={() => onOpenCreateParty('job_worker')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add Knitting / Job Worker</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Parties ({parties.length})
          </button>
          <button
            onClick={() => setFilterType('supplier')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filterType === 'supplier'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Yarn Suppliers
          </button>
          <button
            onClick={() => setFilterType('knitting')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filterType === 'knitting'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Knitting Mills
          </button>
          <button
            onClick={() => setFilterType('washing_compacting')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filterType === 'washing_compacting'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Washing &amp; Compacting
          </button>
          <button
            onClick={() => setFilterType('finishing')}
            className={`rounded-lg px-3 py-1.5 transition ${
              filterType === 'finishing'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Finishing &amp; Dyeing
          </button>
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search party by name, code, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Directory Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading directory...</div>
      ) : filteredParties.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <Factory className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No parties found</h4>
          <p className="text-xs text-slate-400 mt-1">
            Click "+ Add Yarn Supplier" or "+ Add Knitting / Job Worker" above to register new partners.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParties.map((p) => (
            <div
              key={p._id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between pb-2 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600 block">
                    {p.party_code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  {p.party_types.map((t) => (
                    <span
                      key={t}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        t === 'supplier'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Contact Person</span>
                    <span className="font-semibold text-slate-800">{p.contact_person || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Phone</span>
                    <span className="font-medium text-slate-700">{p.phone || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">GSTIN</span>
                  <span className="font-mono text-xs font-semibold text-slate-800">
                    {p.gstin || 'Unregistered'}
                  </span>
                </div>

                {p.services && p.services.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">
                      Processing Services &amp; Rates
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.services.map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 capitalize"
                        >
                          {s}: ₹{p.processing_rates?.[s] || 0}/kg
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {p.address && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-50">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    {p.address.city}, {p.address.state}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
