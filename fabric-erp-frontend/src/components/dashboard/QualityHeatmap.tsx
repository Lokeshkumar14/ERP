import React from 'react';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

interface QualityHeatmapProps {
  data: Array<{
    row: number;
    Jan: number;
    Feb: number;
    Mar: number;
    Apr: number;
    May: number;
    Jun: number;
  }>;
}

export const QualityHeatmap: React.FC<QualityHeatmapProps> = ({ data }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  const getIntensityClass = (value: number) => {
    if (value >= 8) return 'bg-indigo-900 text-white';
    if (value >= 6) return 'bg-indigo-700 text-white';
    if (value >= 4) return 'bg-indigo-500 text-white';
    if (value >= 2) return 'bg-indigo-300 text-indigo-900';
    if (value >= 1) return 'bg-indigo-100 text-indigo-900';
    return 'bg-indigo-50/50 text-indigo-900';
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">Quality Control Heatmap</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <button className="text-slate-400 hover:text-slate-700">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px]">This Week</span>
            <button className="text-slate-400 hover:text-slate-700">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid Heatmap */}
      <div className="mt-4">
        <div className="flex flex-col gap-1.5">
          {data.map((rowItem) => (
            <div key={rowItem.row} className="flex items-center gap-2">
              <span className="w-4 text-right text-[11px] font-medium text-slate-400">
                {rowItem.row}
              </span>
              <div className="grid flex-1 grid-cols-6 gap-1.5">
                {months.map((m) => {
                  const val = (rowItem as any)[m] || 0;
                  return (
                    <div
                      key={m}
                      title={`${m} (Stage ${rowItem.row}): ${val} defects checked`}
                      className={`h-7 rounded-lg transition-transform hover:scale-105 cursor-pointer flex items-center justify-center text-[10px] font-semibold ${getIntensityClass(
                        val
                      )}`}
                    >
                      {val > 4 ? val : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Month Column Labels */}
          <div className="flex items-center gap-2 mt-1">
            <span className="w-4" />
            <div className="grid flex-1 grid-cols-6 gap-1.5 text-center text-[10px] font-medium text-slate-400">
              {months.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
