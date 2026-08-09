import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { formatWeight, formatCurrency } from '../utils/formatters';
import { ArrowDownRight, Package, Truck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const StockInPage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, suppRes] = await Promise.all([
          API.get('/products?activeOnly=true'),
          API.get('/suppliers?activeOnly=true'),
        ]);

        if (prodRes.data.success) {
          setProducts(prodRes.data.data);
          if (prodRes.data.data.length > 0) {
            setSelectedProductId(prodRes.data.data[0]._id);
            setUnitCost(prodRes.data.data[0].costPrice);
          }
        }
        if (suppRes.data.success) {
          setSuppliers(suppRes.data.data);
          if (suppRes.data.data.length > 0) {
            setSelectedSupplierId(suppRes.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load products/suppliers:', err);
        setError('Failed to load initial data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleProductChange = (productId) => {
    setSelectedProductId(productId);
    const prod = products.find((p) => p._id === productId);
    if (prod) {
      setUnitCost(prod.costPrice);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage(null);

    const qty = Number(quantity);
    if (!selectedProductId || isNaN(qty) || qty <= 0) {
      setError('Please select a product and enter a valid quantity greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/inventory/stock-in', {
        productId: selectedProductId,
        quantity: qty,
        supplierId: selectedSupplierId || null,
        unitCost: Number(unitCost) || 0,
        reference: reference.trim(),
        notes: notes.trim(),
      });

      if (res.data.success) {
        setMessage(res.data.message);
        setQuantity('');
        setReference('');
        setNotes('');
        // Refresh products list to show new current stock
        const updatedProdRes = await API.get('/products?activeOnly=true');
        if (updatedProdRes.data.success) {
          setProducts(updatedProdRes.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record stock entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <ArrowDownRight className="w-6 h-6 text-cyan-400 mr-2.5" />
          Record Stock Received (Stock In)
        </h1>
        <p className="text-sm text-slate-400">
          Replenish warehouse LPG gas bulk or cylinder inventory from suppliers
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{message}</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">
              Current available stock: {formatWeight(selectedProduct?.currentStock, selectedProduct?.unit)}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Stock-In Form */}
      <div className="glass-card rounded-2xl border border-slate-800 p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
            Loading catalog data...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Product Banner */}
            {selectedProduct && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Target Inventory Item</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedProduct.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Stock</span>
                  <p className="text-lg font-black text-orange-400">
                    {formatWeight(selectedProduct.currentStock, selectedProduct.unit)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Select Product */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Product *
                </label>
                <div className="relative">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    required
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.currentStock} {p.unit} in stock)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Supplier */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Supplier
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">No Supplier Specified</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity Received */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Quantity Received ({selectedProduct?.unit || 'kg'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              {/* Unit Cost Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Unit Cost Price (GH₵)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="12.50"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Delivery Reference / Invoice */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Invoice / Delivery Note Reference
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. DEL-2026-089"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Notes / Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Stock Note / Description
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Weekly bulk refill shipment"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Calculations Preview */}
            {quantity && selectedProduct && (
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Updated New Stock Calculation:</span>
                <span className="font-bold text-orange-400 text-sm">
                  {selectedProduct.currentStock} {selectedProduct.unit} + {quantity} {selectedProduct.unit} ={' '}
                  <span className="underline">{Number(selectedProduct.currentStock) + Number(quantity)} {selectedProduct.unit}</span>
                </span>
              </div>
            )}

            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Back to Inventory
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-sm font-bold shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center space-x-2"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>{submitting ? 'Recording Stock...' : 'Confirm & Record Stock In'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default StockInPage;
