import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Godown } from '../types';
import { Plus, Warehouse, ArrowRightLeft, Layers } from 'lucide-react';

export const GodownsPage: React.FC = () => {
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGodowns = async () => {
    try {
      setLoading(true);
      const res = await api.getGodowns();
      setGodowns(res);
    } catch (err) {
      console.error('Failed to load godowns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGodowns();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Godown & Warehouse Management
        </h1>
        <p className="text-xs text-slate-500">
          Track storage locations, physical stock balances (Yarn vs Fabric Rolls), and internal location transfers
        </p>
      </div>

      {/* Godowns Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {godowns.map((g) => (
          <div key={g._id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Warehouse className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600">{g.godown_code}</span>
                  <h3 className="text-base font-bold text-slate-900">{g.name}</h3>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                {g.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50/70 p-3 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Yarn Stock</span>
                <span className="font-bold text-slate-900">{g.current_yarn_stock_kg || 0} KG</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Fabric Rolls</span>
                <span className="font-bold text-indigo-600">{g.current_fabric_stock_kg || 0} KG</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Total Stored</span>
                <span className="font-bold text-emerald-600">{g.total_stock_kg || 0} KG</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-50">
              <span>Location: <strong>{g.location}</strong></span>
              <span>In-charge: <strong>{g.contact_person || 'Murugan G.'}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
