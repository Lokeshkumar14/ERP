import React from 'react';
import { Settings, Box, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiCardProps {
  type: 'production_efficiency' | 'current_inventory' | 'defect_rate' | 'sales_performance';
  data: {
    title: string;
    value: string;
    subtext: string;
    change?: string;
    change_type?: string;
    comparison?: string;
  };
}

export const KpiCard: React.FC<KpiCardProps> = ({ type, data }) => {
  const getIcon = () => {
    switch (type) {
      case 'production_efficiency':
        return <Settings className="h-5 w-5 text-indigo-600" />;
      case 'current_inventory':
        return <Box className="h-5 w-5 text-indigo-600" />;
      case 'defect_rate':
        return <AlertCircle className="h-5 w-5 text-indigo-600" />;
      case 'sales_performance':
        return <TrendingUp className="h-5 w-5 text-indigo-600" />;
    }
  };

  const isPositive = data.change_type === 'positive' || (data.change && data.change.startsWith('+'));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition hover:shadow-md">
      {/* Header with Title and Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            {getIcon()}
          </div>
          <span className="text-sm font-semibold text-slate-800">{data.title}</span>
        </div>
      </div>

      {/* Main Metric Value and Subtext */}
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {data.value}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span>{data.subtext}</span>
          {data.change && (
            <div className="flex items-center gap-1">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  type === 'defect_rate'
                    ? 'bg-emerald-50 text-emerald-600' // decrease in defect rate is positive
                    : isPositive
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {data.change}
              </span>
              <span className="text-[10px] text-slate-400">{data.comparison}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
