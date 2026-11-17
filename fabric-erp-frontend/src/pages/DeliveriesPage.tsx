import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SalesOrder, FabricRoll } from '../types';
import { Truck, CheckCircle2, AlertCircle, PackageCheck, ArrowRight } from 'lucide-react';

export const DeliveriesPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [availableRolls, setAvailableRolls] = useState<FabricRoll[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispatch workflow modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
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
      setAvailableRolls(rList.filter((r) => r.quality_status === 'approved'));
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || selectedRollIds.length === 0) {
      alert('Please select a customer sales order and at least one fabric roll to dispatch.');
      return;
    }

    try {
      await api.createDelivery({
        sales_order_id: selectedOrderId,
        roll_ids: selectedRollIds,
        transporter,
        vehicle_number: vehicleNumber,
        eway_bill_number: ewayBill,
      });
      setDispatchModalOpen(false);
      setSelectedOrderId('');
      setSelectedRollIds([]);
      setTransporter('');
      setVehicleNumber('');
      setEwayBill('');
      fetchData();
    } catch (err) {
      alert(`Dispatch error: ${err}`);
    }
  };

  const toggleRoll = (rid: string) => {
    setSelectedRollIds((prev) =>
      prev.includes(rid) ? prev.filter((id) => id !== rid) : [...prev, rid]
    );
  };

  const selectedTotalWeight = availableRolls
    .filter((r) => selectedRollIds.includes(r._id))
    .reduce((sum, r) => sum + r.current_weight, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Sales Deliveries
          </h1>
          <p className="text-xs text-slate-500">
            Fulfill orders by allocating approved finished fabric rolls, auto-generating DCs and updating order stages
          </p>
        </div>

        <button
          onClick={() => setDispatchModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Truck className="h-4 w-4" />
          <span>Fulfill & Dispatch Order</span>
        </button>
      </div>

      {/* Dispatched Deliveries Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Dispatches</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Delivery ID</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Sales Order</th>
                <th className="pb-3">DC Number</th>
                <th className="pb-3">Dispatched Qty</th>
                <th className="pb-3">Roll Numbers</th>
                <th className="pb-3">Vehicle Details</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deliveries.map((del) => (
                <tr key={del._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold font-mono text-indigo-600">{del.delivery_number}</td>
                  <td className="py-3.5 text-slate-500">{del.delivery_date}</td>
                  <td className="py-3.5 font-semibold text-slate-900">{del.customer_name}</td>
                  <td className="py-3.5 font-medium text-slate-800">{del.sales_order_number}</td>
                  <td className="py-3.5 font-mono text-purple-700">{del.delivery_challan_number}</td>
                  <td className="py-3.5 font-bold text-emerald-600">{del.quantity_kg} KG</td>
                  <td className="py-3.5">
                    <span className="text-[11px] text-slate-600">
                      {del.roll_numbers?.join(', ') || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500">{del.vehicle_number || 'Direct'}</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                      Dispatched ✓
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispatch Modal */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleDispatch} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Dispatch Order Delivery</h3>
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Select Pending Sales Order</label>
              <select
                required
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose Sales Order --</option>
                {orders.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.order_number} - {o.customer_name} ({o.total_quantity} KG)
                  </option>
                ))}
              </select>
            </div>

            {/* Roll Selection Table */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Select Available Approved Rolls</label>
                <span className="text-xs font-bold text-indigo-600">
                  Selected: {selectedTotalWeight.toFixed(1)} KG ({selectedRollIds.length} rolls)
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 p-2 text-xs">
                {availableRolls.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No approved finished rolls available in stock.</div>
                ) : (
                  availableRolls.map((roll) => (
                    <label key={roll._id} className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer rounded-lg">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedRollIds.includes(roll._id)}
                          onChange={() => toggleRoll(roll._id)}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-bold text-slate-800">{roll.roll_number}</span>
                        <span className="text-slate-500">({roll.fabric_name} - {roll.colour})</span>
                      </div>
                      <span className="font-bold text-emerald-600">{roll.current_weight} KG</span>
                    </label>
                  ))
                )}
              </div>
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
                  placeholder="e.g. TN-39-AZ-1122"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">E-way Bill (if &gt; ₹50k)</label>
                <input
                  type="text"
                  value={ewayBill}
                  onChange={(e) => setEwayBill(e.target.value)}
                  placeholder="e.g. EWB-9918273"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedRollIds.length === 0}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Confirm Dispatch
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
