import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Product } from '../types';
import { Plus, Layers, Sparkles, Tag, CheckCircle2, X } from 'lucide-react';

export const ProductMasterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fabric' | 'yarn' | 'variants'>('fabric');
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createVariantOpen, setCreateVariantOpen] = useState(false);

  // Form states for Product
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'fabric' | 'yarn'>('fabric');
  const [prodComposition, setProdComposition] = useState('100% Cotton');
  const [prodStructure, setProdStructure] = useState('Single Jersey');
  const [prodGsm, setProdGsm] = useState(160);
  const [prodWidth, setProdWidth] = useState(72);

  // Form states for Variant
  const [selectedProductId, setSelectedProductId] = useState('');
  const [varColour, setVarColour] = useState('Black');
  const [varGsm, setVarGsm] = useState(160);
  const [varWidth, setVarWidth] = useState(72);
  const [varRate, setVarRate] = useState(350);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fabrics, yarns] = await Promise.all([
        api.getProducts('fabric'),
        api.getProducts('yarn'),
      ]);
      setProducts([...fabrics, ...yarns]);
      if (fabrics.length > 0 && !selectedProductId) {
        setSelectedProductId(fabrics[0]._id);
      }
    } catch (err) {
      console.error('Failed to load product masters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProduct({
        name: prodName,
        category: prodCategory,
        composition: prodComposition,
        structure: prodCategory === 'fabric' ? prodStructure : undefined,
        default_gsm: prodCategory === 'fabric' ? prodGsm : undefined,
        default_width: prodCategory === 'fabric' ? prodWidth : undefined,
        unit: 'KG',
      });
      setCreateProductOpen(false);
      setProdName('');
      fetchData();
    } catch (err) {
      alert(`Product creation error: ${err}`);
    }
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const parent = products.find((p) => p._id === selectedProductId);
    const code = `${parent?.product_code || 'FAB'}-${varColour.substring(0, 3).toUpperCase()}-${varGsm}`;
    const newVariant = {
      _id: `var_${Date.now()}`,
      product_id: selectedProductId,
      variant_code: code,
      fabric_name: parent?.name || 'Fabric',
      colour: varColour,
      gsm: varGsm,
      width: varWidth,
      composition: parent?.composition || '100% Cotton',
      standard_rate: varRate,
      unit: 'KG',
    };
    setVariants((prev) => [newVariant, ...prev]);
    setCreateVariantOpen(false);
  };

  const fabricProducts = products.filter((p) => p.category === 'fabric');
  const yarnProducts = products.filter((p) => p.category === 'yarn');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Product & Fabric Master
          </h1>
          <p className="text-xs text-slate-500">
            Define fabric structures, yarn specifications, counts, and colour/GSM variant specifications
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setProdCategory(activeTab === 'yarn' ? 'yarn' : 'fabric');
              setCreateProductOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add New {activeTab === 'yarn' ? 'Yarn' : 'Fabric'}</span>
          </button>
          <button
            onClick={() => setCreateVariantOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Add Fabric Specification Variant</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('fabric')}
          className={`pb-3 transition ${
            activeTab === 'fabric'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Fabric Master ({fabricProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('yarn')}
          className={`pb-3 transition ${
            activeTab === 'yarn'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Yarn Master ({yarnProducts.length})
        </button>
        <button
          onClick={() => setActiveTab('variants')}
          className={`pb-3 transition ${
            activeTab === 'variants'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Fabric Specifications & Colour Variants ({variants.length + 4})
        </button>
      </div>

      {/* Tab 1: Fabric Master Table */}
      {activeTab === 'fabric' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-3">Fabric Code</th>
                  <th className="pb-3">Fabric Name</th>
                  <th className="pb-3">Knit Structure</th>
                  <th className="pb-3">Composition</th>
                  <th className="pb-3">Default GSM</th>
                  <th className="pb-3">Default Width</th>
                  <th className="pb-3">UOM</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fabricProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 font-bold font-mono text-indigo-600">{p.product_code}</td>
                    <td className="py-3.5 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3.5 text-slate-700">{p.structure || p.name}</td>
                    <td className="py-3.5 text-slate-600">{p.composition}</td>
                    <td className="py-3.5 font-medium text-slate-800">{p.default_gsm} GSM</td>
                    <td className="py-3.5 text-slate-600">{p.default_width}"</td>
                    <td className="py-3.5 font-mono text-slate-500">{p.unit}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                        {p.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Yarn Master Table */}
      {activeTab === 'yarn' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-3">Yarn Code</th>
                  <th className="pb-3">Yarn Name</th>
                  <th className="pb-3">Standard Count</th>
                  <th className="pb-3">Composition</th>
                  <th className="pb-3">UOM</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {yarnProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 font-bold font-mono text-purple-700">{p.product_code}</td>
                    <td className="py-3.5 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3.5 text-slate-700">30s / 40s</td>
                    <td className="py-3.5 text-slate-600">{p.composition}</td>
                    <td className="py-3.5 font-mono text-slate-500">{p.unit}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Fabric Specifications / Variants */}
      {activeTab === 'variants' && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
          <div className="text-xs text-slate-500">
            Each base fabric structure supports multiple GSM, widths, shades, and colours with distinct variant codes.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="pb-3">Variant Code</th>
                  <th className="pb-3">Base Fabric</th>
                  <th className="pb-3">Colour / Shade</th>
                  <th className="pb-3">GSM</th>
                  <th className="pb-3">Width</th>
                  <th className="pb-3">Composition</th>
                  <th className="pb-3">Standard Rate (₹/KG)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* Default variants */}
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-mono font-bold text-indigo-600">FAB-1001-BLK-160</td>
                  <td className="py-3.5 font-semibold text-slate-900">Single Jersey</td>
                  <td className="py-3.5 font-medium text-slate-800">Jet Black</td>
                  <td className="py-3.5">160 GSM</td>
                  <td className="py-3.5">72"</td>
                  <td className="py-3.5 text-slate-600">100% Cotton</td>
                  <td className="py-3.5 font-bold text-slate-900">₹350.00</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-mono font-bold text-indigo-600">FAB-1001-NVY-160</td>
                  <td className="py-3.5 font-semibold text-slate-900">Single Jersey</td>
                  <td className="py-3.5 font-medium text-slate-800">Navy Blue</td>
                  <td className="py-3.5">160 GSM</td>
                  <td className="py-3.5">72"</td>
                  <td className="py-3.5 text-slate-600">100% Cotton</td>
                  <td className="py-3.5 font-bold text-slate-900">₹350.00</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-mono font-bold text-indigo-600">FAB-1002-NVY-240</td>
                  <td className="py-3.5 font-semibold text-slate-900">French Terry</td>
                  <td className="py-3.5 font-medium text-slate-800">Navy Blue</td>
                  <td className="py-3.5">240 GSM</td>
                  <td className="py-3.5">72"</td>
                  <td className="py-3.5 text-slate-600">100% Cotton</td>
                  <td className="py-3.5 font-bold text-slate-900">₹380.00</td>
                </tr>
                <tr className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 font-mono font-bold text-indigo-600">FAB-1003-MEL-220</td>
                  <td className="py-3.5 font-semibold text-slate-900">Loop Knit</td>
                  <td className="py-3.5 font-medium text-slate-800">Melange Grey</td>
                  <td className="py-3.5">220 GSM</td>
                  <td className="py-3.5">72"</td>
                  <td className="py-3.5 text-slate-600">95% Cotton 5% Spandex</td>
                  <td className="py-3.5 font-bold text-slate-900">₹360.00</td>
                </tr>
                {variants.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/60 transition bg-indigo-50/20">
                    <td className="py-3.5 font-mono font-bold text-indigo-600">{v.variant_code}</td>
                    <td className="py-3.5 font-semibold text-slate-900">{v.fabric_name}</td>
                    <td className="py-3.5 font-medium text-slate-800">{v.colour}</td>
                    <td className="py-3.5">{v.gsm} GSM</td>
                    <td className="py-3.5">{v.width}"</td>
                    <td className="py-3.5 text-slate-600">{v.composition}</td>
                    <td className="py-3.5 font-bold text-slate-900">₹{v.standard_rate}.00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {createProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateProduct} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Master Product</h3>
              <button type="button" onClick={() => setCreateProductOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Category</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
                >
                  <option value="fabric">Fabric (Finished / Greige)</option>
                  <option value="yarn">Yarn (Raw Material)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder={prodCategory === 'fabric' ? 'e.g. Single Jersey' : 'e.g. Cotton 30s Combed'}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Composition</label>
                <input
                  type="text"
                  value={prodComposition}
                  onChange={(e) => setProdComposition(e.target.value)}
                  placeholder="e.g. 100% Cotton, 95% Cotton 5% Spandex"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                />
              </div>

              {prodCategory === 'fabric' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Default GSM</label>
                      <input
                        type="number"
                        value={prodGsm}
                        onChange={(e) => setProdGsm(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Default Width (")</label>
                      <input
                        type="number"
                        value={prodWidth}
                        onChange={(e) => setProdWidth(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Structure Type</label>
                    <select
                      value={prodStructure}
                      onChange={(e) => setProdStructure(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
                    >
                      <option value="Single Jersey">Single Jersey</option>
                      <option value="French Terry">French Terry</option>
                      <option value="Loop Knit">Loop Knit</option>
                      <option value="Rib 1x1">Rib 1x1</option>
                      <option value="Interlock">Interlock</option>
                      <option value="Pique">Pique</option>
                      <option value="Fleece">Fleece</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateProductOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm"
              >
                Save Product Master
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Variant Modal */}
      {createVariantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateVariant} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Fabric Specification Variant</h3>
              <button type="button" onClick={() => setCreateVariantOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Base Fabric</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none"
                >
                  {fabricProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.product_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Colour / Shade</label>
                <input
                  type="text"
                  required
                  value={varColour}
                  onChange={(e) => setVarColour(e.target.value)}
                  placeholder="e.g. Charcoal Grey, Royal Blue, Olive Green"
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Specification GSM</label>
                  <input
                    type="number"
                    required
                    value={varGsm}
                    onChange={(e) => setVarGsm(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Width (")</label>
                  <input
                    type="number"
                    required
                    value={varWidth}
                    onChange={(e) => setVarWidth(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Standard Selling Rate (₹/KG)</label>
                <input
                  type="number"
                  required
                  value={varRate}
                  onChange={(e) => setVarRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-indigo-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateVariantOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white hover:bg-purple-700 shadow-sm"
              >
                Add Variant
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
