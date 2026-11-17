import React, { useState } from 'react';
import { Search, Bell, Plus, Menu, X, CheckCircle, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenQuickAction: (action: string) => void;
  currentSearch: string;
  onSearchChange: (val: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenQuickAction,
  currentSearch,
  onSearchChange,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const notifications = [
    { id: 1, title: 'Low Yarn Stock Alert', desc: 'Cotton 30s Combed below reorder level (150 KG)', time: '10m ago', urgent: true },
    { id: 2, title: 'Knitting Job Completed', desc: 'Sri Lakshmi Knitting received 475 KG', time: '1h ago', urgent: false },
    { id: 3, title: 'Delivery Pending', desc: 'Order SO-2001 for ABC Textiles ready to dispatch', time: '2h ago', urgent: false },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          title="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Input matching TextilePro reference */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search here..."
            value={currentSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/70 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Right: Quick Action, Notifications, User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Action Button */}
        <div className="relative">
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create New</span>
          </button>

          {showQuickAdd && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Actions
              </div>
              <button
                onClick={() => { onOpenQuickAction('sales_order'); setShowQuickAdd(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                + Sales Order
              </button>
              <button
                onClick={() => { onOpenQuickAction('yarn_po'); setShowQuickAdd(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                + Yarn Purchase PO
              </button>
              <button
                onClick={() => { onOpenQuickAction('job_order'); setShowQuickAdd(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                + Issue Job Work Order
              </button>
              <button
                onClick={() => { onOpenQuickAction('qc_inspection'); setShowQuickAdd(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                + Quality Inspection
              </button>
              <button
                onClick={() => { onOpenQuickAction('delivery_challan'); setShowQuickAdd(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                + Delivery Challan (DC)
              </button>
              <button
                onClick={() => { onOpenQuickAction('invoice'); setShowQuickAdd(false); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
              >
                + Sales Tax Invoice
              </button>
            </div>
          )}
        </div>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl border border-slate-200/80 p-2 text-slate-600 transition hover:bg-slate-50"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] font-medium text-indigo-600 hover:underline cursor-pointer">Mark all read</span>
              </div>
              <div className="mt-2 space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="flex gap-2.5 rounded-xl p-2 hover:bg-slate-50 transition">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${n.urgent ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {n.urgent ? <ShieldAlert className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                      <p className="text-[11px] text-slate-500 leading-tight">{n.desc}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile matching reference */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-100">
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shadow-inner ring-2 ring-white">
              LK
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold text-slate-800 leading-none">Lokesh Kumar</p>
            <p className="text-[10px] font-medium text-indigo-600 leading-none mt-1">Owner & Trader</p>
          </div>
        </div>
      </div>
    </header>
  );
};
