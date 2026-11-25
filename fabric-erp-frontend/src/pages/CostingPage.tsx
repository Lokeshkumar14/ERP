import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ProductionBatch } from '../types';
import { DollarSign, TrendingUp, Layers, CheckCircle, PieChart, ArrowUpRight } from 'lucide-react';

export const CostingPage: React.FC = () => {
  const [profitability, setProfitability] = useState<any[]>([]);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [batchCosting, setBatchCosting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pList, bList] = await Promise.all([api.getOrdersProfitability(), api.getBatches()]);
      setProfitability(pList);
      setBatches(bList);
      if (bList.length > 0) {
        setSelectedBatchId(bList[0]._id);
        const bCost = await api.getBatchCosting(bList[0]._id);
        setBatchCosting(bCost);
      }
    } catch (err) {
      console.error('Failed to load costing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBatchSelect = async (bid: string) => {
    setSelectedBatchId(bid);
    try {
      const bCost = await api.getBatchCosting(bid);
      setBatchCosting(bCost);
    } catch (err) {
      console.error('Failed to load batch costing:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Work Order Costing & Order Profitability
        </h1>
        <p className="text-xs text-slate-500">
          Traceable cost accumulation (Yarn raw materials, knitting, washing, compacting, finishing & transport)
        </p>
      </div>

      {/* Work Order Costing Engine Breakdown */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Production Work Order Cost Accumulation</h3>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Select Work Order:</label>
            <select
              value={selectedBatchId}
              onChange={(e) => handleBatchSelect(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.batch_number} - {b.fabric_name} ({b.planned_quantity} KG)
                </option>
              ))}
            </select>
          </div>
        </div>

        {batchCosting && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl bg-indigo-50/50 p-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Planned Quantity</span>
                <span className="text-base font-bold text-slate-900">{batchCosting.planned_quantity} KG</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Accumulated Cost</span>
                <span className="text-base font-bold text-indigo-600">
                  ₹{batchCosting.total_production_cost.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Unit Cost Per Finished KG</span>
                <span className="text-base font-bold text-emerald-600">
                  ₹{batchCosting.cost_per_kg} / KG
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="pb-3">Cost Item</th>
                    <th className="pb-3">Rate (₹)</th>
                    <th className="pb-3">Quantity</th>
                    <th className="pb-3 text-right">Subtotal Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {batchCosting.cost_breakdown?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-semibold text-slate-800">{item.item}</td>
                      <td className="py-3 text-slate-600">₹{item.rate}/KG</td>
                      <td className="py-3 text-slate-700">{item.qty} KG</td>
                      <td className="py-3 font-bold text-slate-900 text-right">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Customer Orders Profitability Analysis */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Customer Order Profitability & Margin Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Order Number</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Quantity</th>
                <th className="pb-3">Revenue (excl tax)</th>
                <th className="pb-3">Production Cost</th>
                <th className="pb-3">Net Profit</th>
                <th className="pb-3 text-right">Margin (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {profitability.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold font-mono text-indigo-600">{p.order_number}</td>
                  <td className="py-3.5 font-semibold text-slate-900">{p.customer_name}</td>
                  <td className="py-3.5 text-slate-700 font-medium">{p.total_quantity} KG</td>
                  <td className="py-3.5 text-slate-800 font-medium">₹{p.revenue.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 text-slate-600">₹{p.production_cost.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 font-bold text-emerald-600">
                    ₹{p.estimated_profit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 text-right font-bold">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-emerald-700 text-xs">
                      +{p.margin_percentage}%
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
