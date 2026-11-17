import React, { useState } from 'react';
import { api } from '../../api/client';
import { X } from 'lucide-react';

interface CreateDcModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDcModal: React.FC<CreateDcModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [dcType, setDcType] = useState('yarn_issue');
  const [partyName, setPartyName] = useState('Sri Lakshmi Knitting Works');
  const [fromLoc, setFromLoc] = useState('Main Yarn Godown');
  const [toLoc, setToLoc] = useState('Sri Lakshmi Knitting Factory');
  const [itemDesc, setItemDesc] = useState('Cotton 30s Combed Yarn (Lot LOT-COT-301)');
  const [quantity, setQuantity] = useState(500);
  const [transporter, setTransporter] = useState('VRL Logistics');
  const [vehicleNo, setVehicleNo] = useState('TN-39-AZ-4545');
  const [ewayBill, setEwayBill] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDeliveryChallan({
        dc_type: dcType,
        party_name: partyName,
        from_location: fromLoc,
        to_location: toLoc,
        item_description: itemDesc,
        quantity: Number(quantity),
        unit: 'KG',
        transporter,
        vehicle_number: vehicleNo,
        eway_bill_number: ewayBill,
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(`DC creation error: ${err}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Create Delivery Challan (DC)</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">DC Movement Type</label>
            <select
              value={dcType}
              onChange={(e) => setDcType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
            >
              <option value="yarn_issue">Yarn Issue DC</option>
              <option value="yarn_return">Yarn Return DC</option>
              <option value="knitted_fabric_issue">Knitted Fabric Issue DC</option>
              <option value="washing_issue">Washing Issue DC</option>
              <option value="compacting_issue">Compacting Issue DC</option>
              <option value="finishing_issue">Finishing Issue DC</option>
              <option value="godown_transfer">Internal Godown Transfer DC</option>
              <option value="customer_delivery">Customer Delivery DC</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Party / Consignee Name</label>
            <input
              type="text"
              required
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">From Location</label>
              <input
                type="text"
                required
                value={fromLoc}
                onChange={(e) => setFromLoc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">To Destination</label>
              <input
                type="text"
                required
                value={toLoc}
                onChange={(e) => setToLoc(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Material Description</label>
            <input
              type="text"
              required
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Quantity (KG)</label>
            <input
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Vehicle Number</label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Transporter</label>
              <input
                type="text"
                value={transporter}
                onChange={(e) => setTransporter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2 text-xs"
              />
            </div>
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
            Generate Delivery Challan
          </button>
        </div>
      </form>
    </div>
  );
};
