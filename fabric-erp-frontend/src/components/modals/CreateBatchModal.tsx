import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SalesOrder } from '../../types';
import { X, Layers, Sparkles } from 'lucide-react';

interface CreateBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialOrder?: SalesOrder | null;
}

const AVAILABLE_PROCESSES = [
  { id: 'knitting', label: 'Knitting (Grey Fabric)' },
  { id: 'washing', label: 'Washing' },
  { id: 'compacting', label: 'Compacting & Stenter' },
  { id: 'finishing', label: 'Finishing & Inspection' },
  { id: 'dyeing', label: 'Dyeing (Optional)' },
];

export const CreateBatchModal: React.FC<CreateBatchModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialOrder,
}) => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [sourceType, setSourceType] = useState<'sales_order' | 'stock_production'>('sales_order');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  
  const [fabricName, setFabricName] = useState('Single Jersey');
  const [colour, setColour] = useState('Black');
  const [gsm, setGsm] = useState<number | string>(160);
  const [width, setWidth] = useState<number | string>(72);
  const [plannedQty, setPlannedQty] = useState<number | string>(500);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([
    'knitting',
    'washing',
    'compacting',
    'finishing',
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getSalesOrders()
        .then((data: SalesOrder[]) => {
          setOrders(data);
          const pending = data.filter((o) => {
            const rem = o.remaining_quantity !== undefined ? o.remaining_quantity : (o.total_quantity - (o.planned_quantity || 0));
            return rem > 0;
          });

          if (initialOrder) {
            const rem = initialOrder.remaining_quantity !== undefined ? initialOrder.remaining_quantity : (initialOrder.total_quantity - (initialOrder.planned_quantity || 0));
            if (rem > 0) {
              setSourceType('sales_order');
              handleOrderSelect(initialOrder._id, [initialOrder, ...data]);
            } else {
              alert(`Sales Order ${initialOrder.order_number} is already fully planned (${initialOrder.total_quantity} KG). Cannot create more work orders for it.`);
              if (pending.length > 0) {
                handleOrderSelect(pending[0]._id, pending);
              } else {
                setSourceType('stock_production');
              }
            }
          } else if (pending.length > 0) {
            handleOrderSelect(pending[0]._id, pending);
          } else {
            setSelectedOrderId('');
          }
        })
        .catch((err: any) => console.error('Failed to load orders for batch create:', err));
    }
  }, [isOpen, initialOrder]);

  const handleOrderSelect = (orderId: string, orderList = orders) => {
    setSelectedOrderId(orderId);
    const order = orderList.find((o) => o._id === orderId);
    if (order) {
      if (order.items && order.items.length > 0) {
        const item = order.items[0];
        setFabricName(item.fabric || 'Single Jersey');
        setColour(item.colour || 'Navy Blue');
        setGsm(item.gsm || 160);
        setWidth(item.width || 72);
      }
      const remaining = order.remaining_quantity !== undefined ? order.remaining_quantity : (order.total_quantity || 500);
      setPlannedQty(remaining > 0 ? remaining : 0);
    }
  };

  const toggleProcess = (procId: string) => {
    if (selectedProcesses.includes(procId)) {
      if (selectedProcesses.length <= 1) {
        alert('A work order must have at least one production step.');
        return;
      }
      setSelectedProcesses(selectedProcesses.filter((p) => p !== procId));
    } else {
      setSelectedProcesses([...selectedProcesses, procId]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (sourceType === 'sales_order') {
        const selectedOrder = orders.find((o) => o._id === selectedOrderId);
        if (!selectedOrder) {
          alert('Please select an active sales order.');
          setLoading(false);
          return;
        }
        const rem = selectedOrder.remaining_quantity !== undefined ? selectedOrder.remaining_quantity : (selectedOrder.total_quantity - (selectedOrder.planned_quantity || 0));
        if (rem <= 0) {
          alert(`Sales Order ${selectedOrder.order_number} is already 100% planned into work orders (${selectedOrder.total_quantity} KG). No further work orders allowed.`);
          setLoading(false);
          return;
        }
        if (Number(plannedQty) > rem) {
          alert(`Cannot allocate ${plannedQty} KG. Only ${rem} KG remaining unallocated for Sales Order ${selectedOrder.order_number}.`);
          setLoading(false);
          return;
        }
      }

      const selectedOrder = orders.find((o) => o._id === selectedOrderId);
      await api.createBatch({
        source_type: sourceType,
        source_order_id: sourceType === 'sales_order' ? selectedOrderId : undefined,
        source_order_number: sourceType === 'sales_order' ? selectedOrder?.order_number : undefined,
        fabric_name: fabricName,
        colour,
        gsm: Number(gsm),
        width: Number(width),
        planned_quantity: Number(plannedQty),
        process_route: selectedProcesses,
        notes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Failed to create work order: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Create New Production Work Order</h3>
              <p className="text-xs text-slate-400">Initialize a fabric production work order (MTO or Stock Production)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Source Type Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Production Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSourceType('sales_order')}
              className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                sourceType === 'sales_order'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 ring-2 ring-indigo-100'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Against Sales Order (MTO)
            </button>
            <button
              type="button"
              onClick={() => setSourceType('stock_production')}
              className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                sourceType === 'stock_production'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 ring-2 ring-indigo-100'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Layers className="h-4 w-4" />
              Own Stock Production
            </button>
          </div>
        </div>

        {/* Sales Order Selector (if sales_order) */}
        {sourceType === 'sales_order' && (() => {
          const pendingOrders = orders.filter((o) => {
            const rem = o.remaining_quantity !== undefined ? o.remaining_quantity : (o.total_quantity - (o.planned_quantity || 0));
            return rem > 0;
          });

          return (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Select Customer Sales Order *</label>
              {pendingOrders.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>All Sales Orders are 100% Planned</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    There are no sales orders with pending unallocated weight. No more work orders can be created against existing orders. To produce fabric for warehouse inventory, please click <strong>Own Stock Production</strong> above.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select an order with pending balance...</option>
                  {pendingOrders.map((o) => {
                    const rem = o.remaining_quantity !== undefined ? o.remaining_quantity : (o.total_quantity - (o.planned_quantity || 0));
                    return (
                      <option key={o._id} value={o._id}>
                        {o.order_number} - {o.customer_name} ({rem} KG remaining of {o.total_quantity} KG)
                      </option>
                    );
                  })}
                </select>
              )}

              {(() => {
                const currentOrder = orders.find((o) => o._id === selectedOrderId);
                if (!currentOrder) return null;
                const planned = currentOrder.planned_quantity || 0;
                const total = currentOrder.total_quantity || 0;
                const remaining = currentOrder.remaining_quantity !== undefined ? currentOrder.remaining_quantity : Math.max(0, total - planned);
                return (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs space-y-2 mt-2">
                    <div className="flex justify-between items-center font-bold text-slate-800">
                      <span>Order: {currentOrder.order_number} ({currentOrder.customer_name})</span>
                      <span className="text-indigo-600 font-bold">{total} KG Requirement</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-indigo-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Total Ordered</span>
                        <strong className="text-slate-800">{total} KG</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Already in W.O.</span>
                        <strong className="text-indigo-600">{planned} KG</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Unallocated Balance</span>
                        <strong className={remaining > 0 ? "text-emerald-700 font-bold" : "text-slate-500"}>
                          {remaining} KG
                        </strong>
                      </div>
                    </div>
                    {currentOrder.linked_work_orders && currentOrder.linked_work_orders.length > 0 && (
                      <div className="pt-1 text-[11px] text-slate-500">
                        <span className="font-semibold block mb-1">Existing Work Orders for this order:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentOrder.linked_work_orders.map((wo) => (
                            <span
                              key={wo.batch_number}
                              className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-700 border border-indigo-200"
                            >
                              {wo.batch_number}: {wo.planned_quantity} KG ({wo.current_process})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* Fabric Specifications */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Fabric Structure / Name *</label>
            <input
              type="text"
              required
              value={fabricName}
              onChange={(e) => setFabricName(e.target.value)}
              placeholder="e.g. Single Jersey, Interlock, Rib"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Colour / Shade *</label>
            <input
              type="text"
              required
              value={colour}
              onChange={(e) => setColour(e.target.value)}
              placeholder="e.g. Navy Blue, Jet Black"
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">GSM *</label>
            <input
              type="number"
              required
              value={gsm}
              onChange={(e) => setGsm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Width (Inches) *</label>
            <input
              type="number"
              required
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Planned Quantity */}
        <div>
          <label className="font-semibold text-slate-700 block mb-1 text-xs">Target Planned Quantity (KG) *</label>
          <div className="relative">
            <input
              type="number"
              required
              min="1"
              value={plannedQty}
              onChange={(e) => setPlannedQty(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
            <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">KG</span>
          </div>
        </div>

        {/* Process Route Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Process Route Sequence
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            Select the outsourced job-work steps for this work order. The system tracks material through each stage.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_PROCESSES.map((proc) => {
              const isChecked = selectedProcesses.includes(proc.id);
              return (
                <label
                  key={proc.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-xs transition ${
                    isChecked
                      ? 'border-indigo-500 bg-indigo-50/40 text-slate-900 font-semibold'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleProcess(proc.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{proc.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1 text-xs">Notes / Special Instructions</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Export quality, Lycra percentage, specific loop length"
            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Work Order'}
          </button>
        </div>
      </form>
    </div>
  );
};
