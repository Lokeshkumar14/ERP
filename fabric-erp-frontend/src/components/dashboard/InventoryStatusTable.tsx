import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface InventoryStatusItem {
  id: string;
  product_name: string;
  category: string;
  stock: number;
  unit: string;
  reorder_level: number;
  status: string;
  status_type: 'sufficient' | 'warning' | string;
}

interface InventoryStatusTableProps {
  items: InventoryStatusItem[];
  onViewDetails: (item: InventoryStatusItem) => void;
}

export const InventoryStatusTable: React.FC<InventoryStatusTableProps> = ({
  items,
  onViewDetails,
}) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Inventory Status</h3>
          <p className="text-xs text-slate-400">Current stock availability vs reorder levels</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <span>Filter</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
              <th className="pb-3 font-semibold">ID</th>
              <th className="pb-3 font-semibold">Product Name</th>
              <th className="pb-3 font-semibold">Category</th>
              <th className="pb-3 font-semibold">Stock</th>
              <th className="pb-3 font-semibold">Reorder Level</th>
              <th className="pb-3 font-semibold">Stock Status</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr key={item.id} className="transition hover:bg-slate-50/60">
                <td className="py-3.5 font-medium text-slate-500">{item.id}</td>
                <td className="py-3.5 font-semibold text-slate-900">{item.product_name}</td>
                <td className="py-3.5 text-slate-600">{item.category}</td>
                <td className="py-3.5 font-semibold text-slate-800">
                  {item.stock} <span className="text-[10px] text-slate-400 font-normal">{item.unit || 'KG'}</span>
                </td>
                <td className="py-3.5 text-slate-500">
                  {item.reorder_level} <span className="text-[10px] text-slate-400">KG</span>
                </td>
                <td className="py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      item.status_type === 'warning' || item.status.toLowerCase().includes('need')
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="py-3.5 text-right">
                  <button
                    onClick={() => onViewDetails(item)}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 transition text-xs"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
