import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Payment, Customer } from '../types';
import { Plus, DollarSign, ArrowDownLeft, ArrowUpRight, BookOpen, Layers } from 'lucide-react';

interface AccountsPageProps {
  onOpenRecordPayment: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({ onOpenRecordPayment }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [financials, setFinancials] = useState<any>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payList, finData, custList] = await Promise.all([
        api.getPayments(),
        api.getFinancialOverview(),
        api.getCustomers(),
      ]);
      setPayments(payList);
      setFinancials(finData.summary || {});
      setCustomers(custList);
      if (custList.length > 0) {
        setSelectedCustomer(custList[0]._id);
        const lRes = await api.getCustomerLedger(custList[0]._id);
        setLedgerData(lRes);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectCustomer = async (cid: string) => {
    setSelectedCustomer(cid);
    try {
      const lRes = await api.getCustomerLedger(cid);
      setLedgerData(lRes);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Accounts & Payment Management
          </h1>
          <p className="text-xs text-slate-500">
            Track customer receipts, supplier payments, job work disbursements, and ledger statements
          </p>
        </div>

        <button
          onClick={onOpenRecordPayment}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span>Record Payment / Receipt</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Revenue (Sales)</span>
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            ₹{(financials.total_sales || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400">Total invoiced fabric sales</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Customer Receivables</span>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-600">
            ₹{(financials.receivables || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400">Outstanding payments due</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Supplier & Job Payables</span>
            <ArrowDownLeft className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-600">
            ₹{(financials.payables || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400">Pending supplier dues</span>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Operational Expenses</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            ₹{(financials.total_expenses || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400">Transport, labour & handling</span>
        </div>
      </div>

      {/* Customer Ledger Statement Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Customer Ledger Statement</h3>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Select Customer:</label>
            <select
              value={selectedCustomer}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.customer_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {ledgerData && (
          <div>
            <div className="mb-4 flex items-center justify-between rounded-xl bg-indigo-50/50 p-3 text-xs">
              <span className="font-semibold text-slate-700">
                Customer: <strong>{ledgerData.customer?.name}</strong> | Credit Limit: ₹
                {(ledgerData.customer?.credit_limit || 0).toLocaleString('en-IN')}
              </span>
              <span className="font-bold text-indigo-700 text-sm">
                Current Balance: ₹{(ledgerData.current_balance || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Transaction Type</th>
                    <th className="pb-3">Reference No</th>
                    <th className="pb-3">Debit (₹)</th>
                    <th className="pb-3">Credit (₹)</th>
                    <th className="pb-3 text-right">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ledgerData.ledger?.map((entry: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 text-slate-500">{entry.date}</td>
                      <td className="py-3 font-semibold text-slate-800">{entry.type}</td>
                      <td className="py-3 font-mono text-indigo-600">{entry.reference}</td>
                      <td className="py-3 font-medium text-slate-800">
                        {entry.debit ? `₹${entry.debit.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 font-medium text-emerald-600">
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

      {/* Recent Payments & Receipts Table */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Payment & Receipt Vouchers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3">Voucher Number</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Party Name</th>
                <th className="pb-3">Mode</th>
                <th className="pb-3">Reference / Cheque</th>
                <th className="pb-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-bold font-mono text-indigo-600">{p.payment_number}</td>
                  <td className="py-3.5 capitalize font-medium text-slate-700">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        p.payment_type.includes('receipt')
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {p.payment_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500">{p.payment_date}</td>
                  <td className="py-3.5 font-semibold text-slate-900">{p.party_name || 'General Expense'}</td>
                  <td className="py-3.5 text-slate-600">{p.payment_mode}</td>
                  <td className="py-3.5 font-mono text-slate-500">{p.reference_number || '—'}</td>
                  <td className="py-3.5 font-bold text-slate-900 text-right">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
