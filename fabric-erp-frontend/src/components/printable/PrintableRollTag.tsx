import React from 'react';
import { FabricRoll } from '../../types';
import { Printer, X, Tag } from 'lucide-react';

interface PrintableRollTagProps {
  roll: FabricRoll;
  onClose: () => void;
}

export const PrintableRollTag: React.FC<PrintableRollTagProps> = ({ roll, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl printable-card">
        {/* Screen Controls */}
        <div className="no-print flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Barcode Roll Tag
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Sticker</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Tag Content */}
        <div className="rounded-xl border-2 border-slate-800 p-4 text-slate-900 space-y-3">
          <div className="text-center border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold tracking-widest uppercase">TextilePro Fabric Roll</h3>
            <div className="mt-1 flex items-center justify-center gap-1 font-mono text-base font-extrabold text-indigo-700">
              <Tag className="h-4 w-4" />
              <span>{roll.roll_number}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Batch Number:</span>
              <span className="font-bold">{roll.batch_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Quality Status:</span>
              <span className="font-bold uppercase text-emerald-600">{roll.quality_status}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Fabric:</span>
              <span className="font-bold">{roll.fabric_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Colour:</span>
              <span className="font-bold">{roll.colour}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">GSM / Width:</span>
              <span className="font-bold">{roll.gsm} GSM / {roll.width}"</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Weight (KG):</span>
              <span className="text-sm font-extrabold text-indigo-700">{roll.current_weight} KG</span>
            </div>
          </div>

          {/* Barcode Graphic Representation */}
          <div className="pt-2 text-center border-t border-slate-800">
            <div className="flex justify-center items-center gap-0.5 h-10 px-4">
              {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2].map((w, i) => (
                <div
                  key={i}
                  className="bg-black h-full"
                  style={{ width: `${w * 1.5}px` }}
                />
              ))}
            </div>
            <p className="font-mono text-[10px] tracking-widest mt-1">*{roll.roll_number}*</p>
          </div>
        </div>
      </div>
    </div>
  );
};
