import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { KpiCard } from '../components/dashboard/KpiCard';
import { ProductionTrendsChart } from '../components/dashboard/ProductionTrendsChart';
import { InventoryDistributionChart } from '../components/dashboard/InventoryDistributionChart';
import { QualityHeatmap } from '../components/dashboard/QualityHeatmap';
import { InventoryStatusTable } from '../components/dashboard/InventoryStatusTable';
import { OrderStatusList } from '../components/dashboard/OrderStatusList';
import { SlidersHorizontal, RefreshCw, Layers, ArrowUpRight } from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (view: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to fetch dashboard overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">Loading TextilePro Analytics...</p>
        </div>
      </div>
    );
  }

  const {
    kpi_cards = {},
    production_trends = [],
    inventory_distribution = [],
    qc_heatmap = [],
    inventory_status_items = [],
    order_status_items = [],
    summary = {},
  } = data || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Top Header matching TextilePro reference image */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Overview
          </h1>
          <p className="text-xs text-slate-500">
            Real-time fabric trading, job work processing & inventory visibility
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Sync</span>
          </button>

          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi_cards.production_efficiency && (
          <KpiCard type="production_efficiency" data={kpi_cards.production_efficiency} />
        )}
        {kpi_cards.current_inventory && (
          <KpiCard type="current_inventory" data={kpi_cards.current_inventory} />
        )}
        {kpi_cards.defect_rate && (
          <KpiCard type="defect_rate" data={kpi_cards.defect_rate} />
        )}
        {kpi_cards.sales_performance && (
          <KpiCard type="sales_performance" data={kpi_cards.sales_performance} />
        )}
      </div>

      {/* Middle Row Charts matching reference image */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Production Trends Spline Chart */}
        <div className="lg:col-span-1">
          <ProductionTrendsChart data={production_trends} />
        </div>

        {/* Inventory Distribution Bar Chart */}
        <div className="lg:col-span-1">
          <InventoryDistributionChart data={inventory_distribution} />
        </div>

        {/* Quality Control Heatmap */}
        <div className="lg:col-span-1">
          <QualityHeatmap data={qc_heatmap} />
        </div>
      </div>

      {/* Bottom Section: Inventory Status Table (2/3) + Order Status (1/3) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InventoryStatusTable
            items={inventory_status_items}
            onViewDetails={(item) => setSelectedItem(item)}
          />
        </div>

        <div className="lg:col-span-1">
          <OrderStatusList
            items={order_status_items}
            onSelectOrder={(orderId) => onNavigate('sales_orders')}
          />
        </div>
      </div>

      {/* Summary Material & Financial Ledger Ribbon */}
      <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/50 via-white to-indigo-50/30 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-indigo-100/50">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Fabric Pipeline & Financial Ledger Balances
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">Indian GST Compliant</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-center">
          <div className="p-2">
            <span className="text-[11px] font-medium text-slate-500">Yarn Available</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              {summary.yarn_stock_available_kg || 0} <span className="text-xs text-slate-400">KG</span>
            </p>
          </div>
          <div className="p-2">
            <span className="text-[11px] font-medium text-slate-500">Issued to Job Work</span>
            <p className="text-base font-bold text-indigo-600 mt-0.5">
              {summary.yarn_issued_to_job_workers_kg || 0} <span className="text-xs text-indigo-300">KG</span>
            </p>
          </div>
          <div className="p-2">
            <span className="text-[11px] font-medium text-slate-500">Fabric in Process</span>
            <p className="text-base font-bold text-amber-600 mt-0.5">
              {summary.fabric_in_processing_kg || 0} <span className="text-xs text-amber-300">KG</span>
            </p>
          </div>
          <div className="p-2">
            <span className="text-[11px] font-medium text-slate-500">Finished Fabric</span>
            <p className="text-base font-bold text-emerald-600 mt-0.5">
              {summary.finished_fabric_stock_kg || 0} <span className="text-xs text-emerald-300">KG</span>
            </p>
          </div>
          <div className="p-2">
            <span className="text-[11px] font-medium text-slate-500">Total Receivables</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              ₹{(summary.total_receivables || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-2">
            <span className="text-[11px] font-medium text-slate-500">Total Payables</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">
              ₹{(summary.total_payables || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Inventory Specification</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Item ID:</span>
                <span className="font-semibold text-slate-800">{selectedItem.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Product Name:</span>
                <span className="font-semibold text-slate-800">{selectedItem.product_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{selectedItem.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Current Stock:</span>
                <span className="font-bold text-indigo-600">{selectedItem.stock} {selectedItem.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Reorder Level:</span>
                <span className="font-semibold text-slate-800">{selectedItem.reorder_level} {selectedItem.unit}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Health Status:</span>
                <span className="font-bold text-emerald-600">{selectedItem.status}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  onNavigate(selectedItem.category.includes('Yarn') ? 'yarn_inventory' : 'rolls');
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm"
              >
                Go to Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
