import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Customer } from '../../types';
import { Plus, Trash2, X } from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [orderType, setOrderType] = useState<'made_to_order' | 'stock_based'>('made_to_order');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [items, setItems] = useState([
    {
      fabric: 'Single Jersey',
      gsm: 160,
      width: 72,
      colour: 'Black',
      quantity: 500,
      unit_rate: 350,
      discount_pct: 0,
      tax_pct: 5,
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      api.getCustomers().then((res) => {
        setCustomers(res);
        if (res.length > 0 && !customerId) {
          setCustomerId(res[0]._id);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addItem = () => {
    setItems([
      ...items,
      {
        fabric: 'French Terry',
        gsm: 240,
        width: 72,
        colour: 'Navy Blue',
        quantity: 300,
        unit_rate: 380,
        discount_pct: 0,
        tax_pct: 5,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSalesOrder({
        customer_id: customerId,
        order_type: orderType,
        required_delivery_date: deliveryDate,
        remarks,
        items,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`Failed to create order: ${err}`);
    }
  };

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unit_rate, 0);
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Create Customer Sales Order</h3>
            <p className="text-xs text-slate-400">Order-based or stock-based fabric production</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Customer</label>
            <select
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.customer_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
            >
              <option value="made_to_order">Made-to-Order (MTO)</option>
              <option value="stock_based">Stock-Based Order</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Delivery Target Date</label>
            <input
              type="date"
              required
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Fabric Items List */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-slate-800">Fabric Order Items</h4>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 text-xs">
                <div className="col-span-3">
                  <input
                    type="text"
                    value={item.fabric}
                    onChange={(e) => updateItem(idx, 'fabric', e.target.value)}
                    placeholder="Fabric structure"
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={item.colour}
                    onChange={(e) => updateItem(idx, 'colour', e.target.value)}
                    placeholder="Colour"
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.gsm}
                    onChange={(e) => updateItem(idx, 'gsm', parseFloat(e.target.value) || 0)}
                    placeholder="GSM"
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="Qty (KG)"
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white font-semibold"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={item.unit_rate}
                    onChange={(e) => updateItem(idx, 'unit_rate', parseFloat(e.target.value) || 0)}
                    placeholder="Rate/KG"
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white font-semibold"
                  />
                </div>
                <div className="col-span-1 text-right">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Remarks */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Remarks & Instructions</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Packaging requirements, delivery notes"
              className="w-full rounded-xl border border-slate-200 p-2 text-xs"
            />
          </div>
          <div className="space-y-1 text-right">
            <p className="text-slate-500">Subtotal: <strong>₹{subtotal.toLocaleString('en-IN')}</strong></p>
            <p className="text-slate-500">Tax (5%): <strong>₹{tax.toLocaleString('en-IN')}</strong></p>
            <p className="text-sm font-bold text-slate-900">
              Total: <span className="text-indigo-600">₹{grandTotal.toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm"
          >
            Confirm & Save Order
          </button>
        </div>
      </form>
    </div>
  );
};
