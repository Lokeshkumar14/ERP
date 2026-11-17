import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface OrderStatusItem {
  id: string;
  customer: string;
  status: string;
  badge_color?: string;
}

interface OrderStatusListProps {
  items: OrderStatusItem[];
  onSelectOrder?: (orderId: string) => void;
}

export const OrderStatusList: React.FC<OrderStatusListProps> = ({ items, onSelectOrder }) => {
  const getBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('deliver') || s.includes('complet')) {
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    }
    if (s.includes('ship') || s.includes('transit')) {
      return 'bg-amber-50 text-amber-600 border border-amber-100';
    }
    return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Order Status</h3>
          <p className="text-xs text-slate-400">Live order fulfillment tracking</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>This Week</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      </div>

      <div className="space-y-3">
        {items.map((order) => (
          <div
            key={order.id}
            onClick={() => onSelectOrder && onSelectOrder(order.id)}
            className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 transition hover:border-indigo-100 hover:bg-slate-50/50 cursor-pointer"
          >
            <div>
              <span className="text-[11px] font-medium text-slate-400">
                Product ID: {order.id.replace('SO-', '')}
              </span>
              <h4 className="text-xs font-bold text-slate-900">{order.customer}</h4>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block mb-0.5">Order Status</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getBadgeStyle(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
