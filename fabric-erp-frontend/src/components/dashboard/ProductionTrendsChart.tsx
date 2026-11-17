import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';

interface ProductionTrendsChartProps {
  data: Array<{ month: string; units: number; target?: number }>;
}

export const ProductionTrendsChart: React.FC<ProductionTrendsChartProps> = ({ data }) => {
  const [period, setPeriod] = useState('Monthly');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const units = payload[0].value;
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/95 px-3 py-1.5 text-xs text-white shadow-xl">
          <p className="font-semibold">{label}</p>
          <p className="text-indigo-300">Total Unit {units}/150</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Production Trends</h3>
          <p className="text-xs text-slate-400">Total units produced across stages</p>
        </div>

        <div className="relative">
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
            <span>{period}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="productionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              domain={[0, 90]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="natural"
              dataKey="units"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#productionGradient)"
              activeDot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
