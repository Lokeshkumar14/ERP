import React, { useState } from 'react';
import { api } from '../../api/client';
import { X, Factory, Building2, MapPin, Percent, Phone, Mail } from 'lucide-react';

interface CreatePartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'supplier' | 'job_worker';
}

export const CreatePartyModal: React.FC<CreatePartyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'job_worker',
}) => {
  const [name, setName] = useState('');
  const [partyCode, setPartyCode] = useState('');
  const [isSupplier, setIsSupplier] = useState(defaultType === 'supplier');
  const [isJobWorker, setIsJobWorker] = useState(defaultType === 'job_worker');
  
  // Job work services offered
  const [services, setServices] = useState<string[]>(
    defaultType === 'job_worker' ? ['knitting'] : []
  );

  // Processing rates per kg
  const [knittingRate, setKnittingRate] = useState<number>(14.5);
  const [washingRate, setWashingRate] = useState<number>(12.0);
  const [compactingRate, setCompactingRate] = useState<number>(10.5);
  const [finishingRate, setFinishingRate] = useState<number>(15.0);
  const [dyeingRate, setDyeingRate] = useState<number>(42.0);

  const [gstin, setGstin] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Address
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Tirupur');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('641602');

  const [paymentTerms, setPaymentTerms] = useState('30 Days');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleToggleService = (svc: string) => {
    if (services.includes(svc)) {
      setServices(services.filter((s) => s !== svc));
    } else {
      setServices([...services, svc]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const partyTypes: string[] = [];
    if (isSupplier) partyTypes.push('supplier');
    if (isJobWorker) partyTypes.push('job_worker');

    if (partyTypes.length === 0) {
      alert('Please select at least one party type (Yarn Supplier or Job Worker)');
      return;
    }

    const rates: Record<string, number> = {};
    if (services.includes('knitting')) rates['knitting'] = Number(knittingRate);
    if (services.includes('washing')) rates['washing'] = Number(washingRate);
    if (services.includes('compacting')) rates['compacting'] = Number(compactingRate);
    if (services.includes('finishing')) rates['finishing'] = Number(finishingRate);
    if (services.includes('dyeing')) rates['dyeing'] = Number(dyeingRate);

    setSubmitting(true);
    try {
      await api.createParty({
        name,
        party_code: partyCode.trim() || undefined,
        party_types: partyTypes,
        services: isJobWorker ? services : [],
        gstin,
        contact_person: contactPerson,
        phone,
        email,
        address: {
          street,
          city,
          state,
          state_code: '33',
          pincode,
        },
        processing_rates: rates,
        payment_terms: paymentTerms,
        opening_balance: Number(openingBalance),
        status: 'active',
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`Failed to create party: ${err}`);
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
              <Factory className="h-5 w-5 text-indigo-600" />
              <span>Add Yarn Supplier or Job-Work Company</span>
            </h3>
            <p className="text-xs text-slate-400">
              Spinning mills, knitting factories, compacting & finishing units
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

        {/* Entity Type Selection */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
          <label className="text-xs font-bold text-slate-800 block">Party Entity Type *</label>
          <div className="flex flex-wrap gap-4 text-xs font-medium">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSupplier}
                onChange={(e) => setIsSupplier(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Yarn Supplier / Spinning Mill</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isJobWorker}
                onChange={(e) => setIsJobWorker(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Job-Work Processing Company</span>
            </label>
          </div>
        </div>

        {/* Company & Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Company / Mill Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sri Lakshmi Knitting Works"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Party Code (Auto if empty)</label>
            <input
              type="text"
              placeholder="e.g. SUP-1002 or JW-1004"
              value={partyCode}
              onChange={(e) => setPartyCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Job work processes offered */}
        {isJobWorker && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Job-Work Services &amp; Default Rates (₹/KG)</span>
              <span className="text-[10px] text-slate-400">Select all applicable processes</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={services.includes('knitting')}
                    onChange={() => handleToggleService('knitting')}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Knitting</span>
                </label>
                {services.includes('knitting') && (
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Rate ₹/kg"
                    value={knittingRate}
                    onChange={(e) => setKnittingRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white focus:outline-none"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={services.includes('washing')}
                    onChange={() => handleToggleService('washing')}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Washing</span>
                </label>
                {services.includes('washing') && (
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Rate ₹/kg"
                    value={washingRate}
                    onChange={(e) => setWashingRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white focus:outline-none"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={services.includes('compacting')}
                    onChange={() => handleToggleService('compacting')}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Compacting</span>
                </label>
                {services.includes('compacting') && (
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Rate ₹/kg"
                    value={compactingRate}
                    onChange={(e) => setCompactingRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white focus:outline-none"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={services.includes('finishing')}
                    onChange={() => handleToggleService('finishing')}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Finishing</span>
                </label>
                {services.includes('finishing') && (
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Rate ₹/kg"
                    value={finishingRate}
                    onChange={(e) => setFinishingRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white focus:outline-none"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={services.includes('dyeing')}
                    onChange={() => handleToggleService('dyeing')}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Dyeing</span>
                </label>
                {services.includes('dyeing') && (
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Rate ₹/kg"
                    value={dyeingRate}
                    onChange={(e) => setDyeingRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-1.5 text-xs bg-white focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Contact Person</label>
            <input
              type="text"
              placeholder="e.g. S. Sundaram"
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
              placeholder="e.g. +91 98422 11000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="e.g. accounts@party.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* GSTIN & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">GSTIN</label>
            <input
              type="text"
              placeholder="33AAAAA0000A1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">City</label>
            <input
              type="text"
              placeholder="Tirupur / Perundurai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">State</label>
            <input
              type="text"
              placeholder="Tamil Nadu"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Terms & Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Payment Terms</label>
            <input
              type="text"
              placeholder="e.g. 30 Days or Immediate"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
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
            {submitting ? 'Saving...' : 'Save Party Master'}
          </button>
        </div>
      </form>
    </div>
  );
};
