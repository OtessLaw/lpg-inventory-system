import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { formatWeight } from '../utils/formatters';
import { SlidersHorizontal, AlertTriangle, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const AdjustmentPage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('DECREASE');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await API.get('/products?activeOnly=true');
        if (res.data.success) {
          setProducts(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedProductId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to fetch product list.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage(null);

    const qty = Number(quantity);
    if (!selectedProductId || isNaN(qty) || qty <= 0) {
      setError('Please select a product and enter a valid quantity greater than 0.');
      return;
    }

    if (!reason || reason.trim() === '') {
      setError('Mandatory Rule 5: A clear reason MUST be specified for stock adjustments (e.g. Gas leakage, physical audit difference).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/inventory/adjustment', {
        productId: selectedProductId,
        adjustmentType,
        quantity: qty,
        reason: reason.trim(),
        reference: reference.trim(),
      });

      if (res.data.success) {
        setMessage(res.data.message);
        setQuantity('');
        setReason('');
        setReference('');
        // Refresh products list to show new stock
        const prodRes = await API.get('/products?activeOnly=true');
        if (prodRes.data.success) {
          setProducts(prodRes.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record stock adjustment.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <SlidersHorizontal className="w-6 h-6 text-amber-500 mr-2.5" />
          Stock Inventory Adjustment
        </h1>
        <p className="text-sm text-slate-400">
          Record legitimate inventory corrections for leakage, damaged cylinders, or count audits
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start space-x-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{message}</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">
              Updated inventory balance: {formatWeight(selectedProduct?.currentStock, selectedProduct?.unit)}
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

      <div className="glass-card rounded-2xl border border-slate-800 p-6 shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
            Loading products...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selected Product Banner */}
            {selectedProduct && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Selected Product</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedProduct.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Stock</span>
                  <p className="text-lg font-black text-amber-400">
                    {formatWeight(selectedProduct.currentStock, selectedProduct.unit)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Product Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Product *
                </label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Adjustment Action *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('DECREASE')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      adjustmentType === 'DECREASE'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    - DECREASE STOCK
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('INCREASE')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      adjustmentType === 'INCREASE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    + INCREASE STOCK
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Quantity ({selectedProduct?.unit || 'kg'}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 5.5"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              {/* Reference */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Audit / Document Reference
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. AUDIT-2026-Q3"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Mandatory Reason Input */}
            <div>
              <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Mandatory Adjustment Reason *
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify precise cause: e.g., Gas cylinder valve leakage detected during daily safety inspection, physical audit count difference, or measurement calibration."
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Rule 5: Adjustments without an explicit reason will be rejected by the backend audit system.
              </p>
            </div>

            {/* Preview math */}
            {quantity && selectedProduct && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Adjustment Result:</span>
                <span className="font-bold text-amber-300 text-sm">
                  {selectedProduct.currentStock} {selectedProduct.unit} {adjustmentType === 'DECREASE' ? '-' : '+'} {quantity} {selectedProduct.unit} ={' '}
                  <span className="underline">
                    {adjustmentType === 'DECREASE'
                      ? selectedProduct.currentStock - Number(quantity)
                      : selectedProduct.currentStock + Number(quantity)}{' '}
                    {selectedProduct.unit}
                  </span>
                </span>
              </div>
            )}

            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
              >
                {submitting ? 'Recording Adjustment...' : 'Apply Stock Adjustment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdjustmentPage;
