import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Customer } from '../types';
import { Plus, Users, Phone, Mail, MapPin, BookOpen, Tag, History, Printer, X } from 'lucide-react';

interface CustomersPageProps {
  onOpenCreateCustomer: () => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ onOpenCreateCustomer }) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'pricing' | 'history' | 'statement'>('directory');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerHistory, setCustomerHistory] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [priceList, setPriceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Price List form
  const [specialFabric, setSpecialFabric] = useState('Single Jersey');
  const [specialColour, setSpecialColour] = useState('Black');
  const [specialRate, setSpecialRate] = useState(340);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers();
      setCustomers(res);
      if (res.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(res[0]._id);
        loadCustomerDetails(res[0]._id);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetails = async (cid: string) => {
    try {
      const [hist, ledg, prices] = await Promise.all([
        api.getCustomerHistory(cid),
        api.getCustomerLedger(cid),
        api.getCustomerPriceList(cid),
      ]);
      setCustomerHistory(hist);
      setLedgerData(ledg);
      setPriceList(prices);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSelectCustomer = (cid: string) => {
    setSelectedCustomerId(cid);
    loadCustomerDetails(cid);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    try {
      await api.setCustomerPrice(selectedCustomerId, {
        fabric_name: specialFabric,
        colour: specialColour,
        special_rate: specialRate,
      });
      loadCustomerDetails(selectedCustomerId);
      alert('Special customer rate saved successfully!');
    } catch (err) {
      alert(`Error saving rate: ${err}`);
    }
  };

  const selectedCust = customers.find((c) => c._id === selectedCustomerId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Management & CRM
          </h1>
          <p className="text-xs text-slate-500">
            Maintain customer masters, customer-specific price lists, order & delivery history, and ledger statements
          </p>
        </div>

        <button
          onClick={onOpenCreateCustomer}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 transition ${
            activeTab === 'directory'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Customer Directory ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`pb-3 transition ${
            activeTab === 'pricing'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Customer Price Lists
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 transition ${
            activeTab === 'history'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Order & Delivery History
        </button>
        <button
          onClick={() => setActiveTab('statement')}
          className={`pb-3 transition ${
            activeTab === 'statement'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Statement of Account (Ledger)
        </button>
      </div>

      {/* Tab 1: Directory */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((c) => (
            <div key={c._id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-600">{c.customer_code}</span>
                  <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                  {c.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block">Contact Person</span>
                  <span className="font-semibold text-slate-800">{c.contact_person || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">GSTIN</span>
                  <span className="font-mono text-slate-700">{c.gstin || 'Unregistered'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Credit Limit / Days</span>
                  <span className="font-semibold text-slate-800">
                    ₹{(c.credit_limit || 0).toLocaleString('en-IN')} ({c.credit_days} days)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Current Outstanding</span>
                  <span className="font-bold text-indigo-600">
                    ₹{(c.current_balance || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {c.billing_address && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-50">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    {c.billing_address.city}, {c.billing_address.state} ({c.billing_address.pincode})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Customer Price Lists */}
      {activeTab === 'pricing' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Customer-Specific Fabric Price Lists</h3>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Customer:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold"
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleSavePrice} className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl bg-indigo-50/40 p-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Fabric Structure</label>
              <input
                type="text"
                required
                value={specialFabric}
                onChange={(e) => setSpecialFabric(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 bg-white"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Colour / Shade</label>
              <input
                type="text"
                required
                value={specialColour}
                onChange={(e) => setSpecialColour(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 bg-white"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Contract Rate (₹/KG)</label>
              <input
                type="number"
                required
                value={specialRate}
                onChange={(e) => setSpecialRate(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-200 p-2 bg-white font-bold text-indigo-700"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700"
              >
                Save Contract Rate
              </button>
            </div>
          </form>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Customer</th>
                <th className="pb-3">Fabric</th>
                <th className="pb-3">Colour</th>
                <th className="pb-3">Special Agreed Rate (₹/KG)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50/60">
                <td className="py-3 font-semibold text-slate-900">{selectedCust?.name}</td>
                <td className="py-3 font-medium text-slate-800">Single Jersey</td>
                <td className="py-3 text-slate-600">Black</td>
                <td className="py-3 font-bold text-indigo-600">₹340.00 / KG (Standard: ₹350)</td>
              </tr>
              {priceList.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 font-semibold text-slate-900">{selectedCust?.name}</td>
                  <td className="py-3 font-medium text-slate-800">{p.fabric_name}</td>
                  <td className="py-3 text-slate-600">{p.colour}</td>
                  <td className="py-3 font-bold text-indigo-600">₹{p.special_rate}.00 / KG</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Order & Delivery History */}
      {activeTab === 'history' && customerHistory && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Order & Delivery Timeline: {selectedCust?.name}
            </h3>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold"
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 p-4">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Order History ({customerHistory.orders_count})</h4>
              <div className="space-y-2 text-xs">
                {customerHistory.orders?.map((o: any) => (
                  <div key={o._id} className="flex justify-between p-2 rounded-lg bg-slate-50">
                    <div>
                      <span className="font-bold font-mono text-indigo-600">{o.order_number}</span>
                      <p className="text-[10px] text-slate-500">{o.order_date}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-900">{o.total_quantity} KG</span>
                      <span className="block text-[10px] text-indigo-600 font-semibold">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 p-4">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Delivery Dispatches ({customerHistory.deliveries_count})</h4>
              <div className="space-y-2 text-xs">
                {customerHistory.deliveries?.map((d: any) => (
                  <div key={d._id} className="flex justify-between p-2 rounded-lg bg-emerald-50/40">
                    <div>
                      <span className="font-bold font-mono text-emerald-700">{d.delivery_number}</span>
                      <p className="text-[10px] text-slate-500">DC: {d.delivery_challan_number}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-800">{d.quantity_kg} KG</span>
                      <span className="block text-[10px] text-slate-500">{d.delivery_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Statement of Account (Ledger) */}
      {activeTab === 'statement' && ledgerData && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Statement of Account</h3>
              <p className="text-xs text-slate-400">Customer: {selectedCust?.name} | GSTIN: {selectedCust?.gstin}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Statement</span>
            </button>
          </div>

          <div className="flex justify-between items-center rounded-xl bg-indigo-50/60 p-3 text-xs">
            <span className="text-slate-600">Credit Limit: ₹{(selectedCust?.credit_limit || 0).toLocaleString('en-IN')}</span>
            <span className="text-sm font-bold text-indigo-700">
              Net Outstanding Balance: ₹{(ledgerData.current_balance || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Transaction</th>
                  <th className="pb-3">Reference No</th>
                  <th className="pb-3 text-right">Debit (₹)</th>
                  <th className="pb-3 text-right">Credit (₹)</th>
                  <th className="pb-3 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ledgerData.ledger?.map((entry: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 text-slate-500">{entry.date}</td>
                    <td className="py-3 font-semibold text-slate-800">{entry.type}</td>
                    <td className="py-3 font-mono text-indigo-600">{entry.reference}</td>
                    <td className="py-3 text-right font-medium text-slate-800">
                      {entry.debit ? `₹${entry.debit.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 text-right font-medium text-emerald-600">
                      {entry.credit ? `₹${entry.credit.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 font-bold text-slate-900 text-right">
                      ₹{entry.balance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
