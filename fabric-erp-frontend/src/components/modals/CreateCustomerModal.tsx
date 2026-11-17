import React, { useState } from 'react';
import { api } from '../../api/client';
import { X, Building2, User, Phone, Mail, MapPin, CreditCard, ShieldCheck } from 'lucide-react';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Tirupur');
  const [state, setState] = useState('Tamil Nadu');
  const [stateCode, setStateCode] = useState('33');
  const [pincode, setPincode] = useState('641602');
  const [creditLimit, setCreditLimit] = useState<number>(500000);
  const [creditDays, setCreditDays] = useState<number>(30);
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCustomer({
        name,
        customer_code: customerCode.trim() || undefined,
        contact_person: contactPerson,
        phone,
        email,
        gstin,
        pan,
        billing_address: {
          street,
          city,
          state,
          state_code: stateCode,
          pincode,
        },
        shipping_addresses: [
          {
            street,
            city,
            state,
            state_code: stateCode,
            pincode,
          },
        ],
        credit_limit: Number(creditLimit),
        credit_days: Number(creditDays),
        opening_balance: Number(openingBalance),
        status: 'active',
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`Failed to create customer: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <span>Add New Customer Master</span>
            </h3>
            <p className="text-xs text-slate-400">
              Register fabric buying customer, contact details, GSTIN, and credit terms
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Company & Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Company / Customer Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ABC Textiles Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Customer Code (Auto if empty)
            </label>
            <input
              type="text"
              placeholder="e.g. CUS-1005"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Contact Person</label>
            <input
              type="text"
              placeholder="e.g. Rajesh Kumar"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              placeholder="e.g. +91 98450 12345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="e.g. orders@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* GSTIN & PAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">GSTIN (15 Digits)</label>
            <input
              type="text"
              placeholder="e.g. 33AAAAA0000A1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">PAN Number</label>
            <input
              type="text"
              placeholder="e.g. AAAAA0000A"
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Billing Address */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-3">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-indigo-600" />
            Billing &amp; Delivery Address
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Street address / Factory / Building"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="City (e.g. Tirupur)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="State (Tamil Nadu)"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Credit & Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Credit Limit (₹)</label>
            <input
              type="number"
              min="0"
              value={creditLimit}
              onChange={(e) => setCreditLimit(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Credit Period (Days)</label>
            <input
              type="number"
              min="0"
              value={creditDays}
              onChange={(e) => setCreditDays(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Opening Balance (₹)</label>
            <input
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer buttons */}
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
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Customer Master'}
          </button>
        </div>
      </form>
    </div>
  );
};
