import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Customer } from '../types';
import { Plus, Users, Phone, Mail, MapPin, BookOpen, Tag, History, Printer, X, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';

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
  const [specialRate, setSpecialRate] = useState<string | number>('340');
  const [savingRate, setSavingRate] = useState(false);
  const [rateFeedback, setRateFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    if (!selectedCustomerId) {
      setRateFeedback({ type: 'error', text: 'Please select a customer first.' });
      return;
    }
    const parsedRate = parseFloat(String(specialRate));
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setRateFeedback({ type: 'error', text: 'Please enter a valid rate greater than 0.' });
      return;
    }
    try {
      setSavingRate(true);
      setRateFeedback(null);
      await api.setCustomerPrice(selectedCustomerId, {
        fabric_name: specialFabric.trim(),
        colour: specialColour.trim(),
        special_rate: parsedRate,
      });
      await loadCustomerDetails(selectedCustomerId);
      setRateFeedback({ type: 'success', text: `Saved ₹${parsedRate.toFixed(2)}/KG for ${specialFabric} (${specialColour})` });
      setTimeout(() => setRateFeedback(null), 4000);
    } catch (err: any) {
      console.error('Save rate failed:', err);
      setRateFeedback({ type: 'error', text: err?.message || 'Failed to save customer rate. Please check backend connection.' });
    } finally {
      setSavingRate(false);
    }
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!confirm('Remove this custom rate?')) return;
    try {
      await api.deleteCustomerPrice(selectedCustomerId, priceId);
      await loadCustomerDetails(selectedCustomerId);
      setRateFeedback({ type: 'success', text: 'Rate removed successfully.' });
      setTimeout(() => setRateFeedback(null), 3000);
    } catch (err: any) {
      alert(`Error removing rate: ${err?.message || err}`);
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Customer-Specific Fabric Price Lists</h3>
              <p className="text-xs text-slate-500">Configure special contract rates per KG agreed for specific fabric structures and colours.</p>
            </div>
            {customers.length > 0 ? (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">Customer:</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.customer_code})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {customers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50">
              <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Customers Added Yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Please add a customer first to manage contract price lists.</p>
              <button
                onClick={onOpenCreateCustomer}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" /> Add First Customer
              </button>
            </div>
          ) : (
            <>
              {rateFeedback && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                    rateFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {rateFeedback.type === 'success' ? (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{rateFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleSavePrice} className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Fabric Structure</label>
                  <input
                    type="text"
                    required
                    list="fabric-structures"
                    value={specialFabric}
                    onChange={(e) => setSpecialFabric(e.target.value)}
                    placeholder="e.g. Single Jersey"
                    className="w-full rounded-lg border border-slate-200 p-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="fabric-structures">
                    <option value="Single Jersey" />
                    <option value="French Terry" />
                    <option value="Loop Knit" />
                    <option value="Rib 1x1" />
                    <option value="Fleece" />
                    <option value="Interlock" />
                    <option value="Pique" />
                  </datalist>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Colour / Shade</label>
                  <input
                    type="text"
                    required
                    list="colour-shades"
                    value={specialColour}
                    onChange={(e) => setSpecialColour(e.target.value)}
                    placeholder="e.g. Black"
                    className="w-full rounded-lg border border-slate-200 p-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="colour-shades">
                    <option value="Black" />
                    <option value="White" />
                    <option value="Navy Blue" />
                    <option value="Grey Melange" />
                    <option value="Royal Blue" />
                    <option value="Red" />
                    <option value="Olive Green" />
                  </datalist>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contract Rate (₹/KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={specialRate}
                    onChange={(e) => setSpecialRate(e.target.value)}
                    placeholder="340.00"
                    className="w-full rounded-lg border border-slate-200 p-2 bg-white font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={savingRate}
                    className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    {savingRate ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      'Save Contract Rate'
                    )}
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Fabric Structure</th>
                      <th className="pb-3">Colour / Shade</th>
                      <th className="pb-3">Agreed Special Rate</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {priceList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No custom agreed rates set for {selectedCust?.name || 'this customer'} yet. Fill the form above to add one.
                        </td>
                      </tr>
                    ) : (
                      priceList.map((p, idx) => (
                        <tr key={p._id || idx} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 font-semibold text-slate-900">{selectedCust?.name || p.customer_name}</td>
                          <td className="py-3 font-medium text-slate-800">{p.fabric_name}</td>
                          <td className="py-3 text-slate-600">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700">
                              {p.colour}
                            </span>
                          </td>
                          <td className="py-3 font-bold text-indigo-600 text-sm">
                            ₹{Number(p.special_rate).toFixed(2)} <span className="text-[11px] font-normal text-slate-500">/ KG</span>
                          </td>
                          <td className="py-3 text-right">
                            {p._id ? (
                              <button
                                onClick={() => handleDeletePrice(p._id)}
                                title="Remove rate"
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
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
