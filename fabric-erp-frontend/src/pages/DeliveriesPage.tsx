import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SalesOrder } from '../types';
import { Truck, CheckCircle2, AlertCircle, PackageCheck, ArrowRight, Layers } from 'lucide-react';

export const DeliveriesPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [availableStock, setAvailableStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispatch workflow modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [dispatchQty, setDispatchQty] = useState<number>(0);
  const [transporter, setTransporter] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [ewayBill, setEwayBill] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dList, oList, rList] = await Promise.all([
        api.getDeliveries(),
        api.getSalesOrders(),
        api.getRolls({ process: 'finished', is_delivered: false }),
      ]);
      setDeliveries(dList);
      setOrders(oList.filter((o) => o.status !== 'Completed' && o.status !== 'Cancelled'));
      setAvailableStock(rList);
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedOrder = orders.find((o) => o._id === selectedOrderId);

  // Calculate order pending quantity
  const orderDeliveredSoFar = deliveries
    .filter((d) => d.sales_order_id === selectedOrderId)
    .reduce((sum, d) => sum + (d.quantity_kg || 0), 0);

  const totalOrdered = selectedOrder
    ? selectedOrder.items.reduce((sum, it) => sum + it.quantity, 0)
    : 0;

  const pendingOrderBalance = Math.max(0, totalOrdered - orderDeliveredSoFar);

  const totalWarehouseStockKg = availableStock.reduce(
    (sum, s) => sum + (s.current_weight || 0),
    0
  );

  const handleSelectOrder = (oid: string) => {
    setSelectedOrderId(oid);
    const ord = orders.find((o) => o._id === oid);
    if (ord) {
      const delSoFar = deliveries
        .filter((d) => d.sales_order_id === oid)
        .reduce((sum, d) => sum + (d.quantity_kg || 0), 0);
      const total = ord.items.reduce((sum, it) => sum + it.quantity, 0);
      const pending = Math.max(0, total - delSoFar);
      setDispatchQty(pending);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || dispatchQty <= 0) {
      alert('Please select a customer sales order and enter valid dispatch quantity in KG.');
      return;
    }

    try {
      await api.createDelivery({
        sales_order_id: selectedOrderId,
        quantity_kg: Number(dispatchQty),
        transporter,
        vehicle_number: vehicleNumber,
        eway_bill_number: ewayBill,
      });
      setDispatchModalOpen(false);
      setSelectedOrderId('');
      setDispatchQty(0);
      setTransporter('');
      setVehicleNumber('');
      setEwayBill('');
      fetchData();
      alert('Sales delivery dispatched and Delivery Challan generated successfully!');
    } catch (err) {
      alert(`Dispatch error: ${err}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Sales Deliveries &amp; Dispatch
          </h1>
          <p className="text-xs text-slate-500">
            Fulfill orders by dispatching finished fabric weight in KG, auto-generating DCs and tracking fulfillment
          </p>
        </div>

        <button
          onClick={() => setDispatchModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Truck className="h-4 w-4" />
          <span>Fulfill &amp; Dispatch Order</span>
        </button>
      </div>

      {/* Dispatched Deliveries Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Sales Deliveries (DCs)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Delivery ID</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Sales Order</th>
                <th className="pb-3">Delivery Challan</th>
                <th className="pb-3">Dispatched Qty</th>
                <th className="pb-3">Vehicle / Transport</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No dispatches recorded yet. Click "Fulfill &amp; Dispatch Order" above to create one.
                  </td>
                </tr>
              ) : (
                deliveries.map((del) => (
                  <tr key={del._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 font-bold font-mono text-indigo-600">{del.delivery_number}</td>
                    <td className="py-3.5 text-slate-500">{del.delivery_date}</td>
                    <td className="py-3.5 font-semibold text-slate-900">{del.customer_name}</td>
                    <td className="py-3.5 font-medium text-slate-800">{del.sales_order_number}</td>
                    <td className="py-3.5 font-mono text-purple-700 font-bold">{del.delivery_challan_number}</td>
                    <td className="py-3.5">
                      <span className="font-bold text-emerald-600 text-sm">
                        {Number(del.quantity_kg || 0).toFixed(2)}
                      </span>{' '}
                      <span className="text-[11px] text-slate-400 font-semibold">KG</span>
                    </td>
                    <td className="py-3.5 text-slate-600">
                      {del.transporter ? `${del.transporter} (${del.vehicle_number || 'Direct'})` : (del.vehicle_number || 'Self Pickup')}
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                        Dispatched ✓
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Modal */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleDispatch}
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                <span>Dispatch Customer Fabric Order</span>
              </h3>
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Select Pending Sales Order *
              </label>
              <select
                required
                value={selectedOrderId}
                onChange={(e) => handleSelectOrder(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose Sales Order to Deliver --</option>
                {orders.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.order_number} — {o.customer_name} (Total: {o.total_quantity} KG)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Order Summary */}
            {selectedOrder && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-indigo-100">
                  <span className="font-bold text-slate-900">{selectedOrder.customer_name}</span>
                  <span className="text-[11px] font-mono font-bold text-indigo-700">{selectedOrder.order_number}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-1.5 bg-white rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Ordered</span>
                    <span className="font-bold text-slate-900">{totalOrdered} KG</span>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Delivered So Far</span>
                    <span className="font-bold text-slate-600">{orderDeliveredSoFar} KG</span>
                  </div>
                  <div className="p-1.5 bg-white rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Pending Balance</span>
                    <span className="font-bold text-indigo-600">{pendingOrderBalance} KG</span>
                  </div>
                </div>
                <div className="pt-1">
                  <span className="text-[11px] text-slate-500 font-medium">Order items: </span>
                  <span className="text-[11px] text-slate-700">
                    {selectedOrder.items.map((it) => `${it.fabric} ${it.colour} (${it.quantity} KG)`).join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Dispatch Quantity Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Dispatch Quantity (KG) *
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Warehouse Stock: <strong>{totalWarehouseStockKg.toFixed(1)} KG</strong>
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={dispatchQty || ''}
                onChange={(e) => setDispatchQty(parseFloat(e.target.value) || 0)}
                placeholder="Enter fabric weight in KG"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-indigo-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Transport Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Transporter</label>
                <input
                  type="text"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  placeholder="e.g. VRL Logistics"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="e.g. TN-39-AZ-4545"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">E-Way Bill No.</label>
                <input
                  type="text"
                  value={ewayBill}
                  onChange={(e) => setEwayBill(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm"
              >
                Confirm Dispatch ({dispatchQty || 0} KG)
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
