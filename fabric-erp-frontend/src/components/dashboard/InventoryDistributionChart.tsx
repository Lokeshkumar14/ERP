import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MoreVertical } from 'lucide-react';

interface InventoryDistributionProps {
  data: Array<{ year: string; raw: number; finished: number }>;
}

export const InventoryDistributionChart: React.FC<InventoryDistributionProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-xl">
          <p className="font-semibold text-slate-300">{label}</p>
          <div className="mt-1 space-y-0.5">
            <p className="text-indigo-400">Raw: {payload[0].value}M</p>
            <p className="text-violet-300">Finished: {payload[1].value}M</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-900">Inventory Distribution</h3>
        <button className="text-slate-400 hover:text-slate-600">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
          <span>Raw Materials</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-300" />
          <span>Finished Goods</span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={(val) => `${val}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="raw" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={18} />
            <Bar dataKey="finished" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
