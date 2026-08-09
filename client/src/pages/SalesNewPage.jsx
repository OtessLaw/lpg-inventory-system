import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency, formatWeight } from '../utils/formatters';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Printer,
  RefreshCw,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Scale,
  DollarSign,
} from 'lucide-react';

const SalesNewPage = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart / Line items
  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Entry Mode: 'weight' (by kg) or 'amount' (by money GH₵)
  const [entryMode, setEntryMode] = useState('weight');
  const [quantityInput, setQuantityInput] = useState('');
  const [amountInput, setAmountInput] = useState('');

  // Payment fields
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discount, setDiscount] = useState('0');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Invoice success modal
  const [completedSale, setCompletedSale] = useState(null);

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
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  const handleAddToCart = (e) => {
    e.preventDefault();
    setError('');

    if (!selectedProduct) {
      setError('Please select a product.');
      return;
    }

    let calculatedQty = 0;
    let calculatedTotal = 0;

    if (entryMode === 'weight') {
      calculatedQty = Number(quantityInput);
      if (isNaN(calculatedQty) || calculatedQty <= 0) {
        setError('Please enter a valid weight in kg greater than 0.');
        return;
      }
      calculatedTotal = Number((calculatedQty * selectedProduct.sellingPrice).toFixed(2));
    } else {
      // Entry Mode is Amount (GH₵)
      const amt = Number(amountInput);
      if (isNaN(amt) || amt <= 0) {
        setError('Please enter a valid amount in GH₵ greater than 0.');
        return;
      }
      if (selectedProduct.sellingPrice <= 0) {
        setError('Product selling price must be greater than 0.');
        return;
      }
      calculatedTotal = amt;
      // Calculate exact kg: Amount / Selling Price per kg
      calculatedQty = Number((amt / selectedProduct.sellingPrice).toFixed(4));
    }

    // Check stock availability
    const existingInCart = cart.find((item) => item.product === selectedProduct._id);
    const existingQty = existingInCart ? existingInCart.quantity : 0;
    const totalQtyNeeded = Number((existingQty + calculatedQty).toFixed(4));

    if (totalQtyNeeded > selectedProduct.currentStock) {
      setError(
        `Insufficient stock! Cannot sell ${totalQtyNeeded} ${selectedProduct.unit} of '${selectedProduct.name}'. Available: ${selectedProduct.currentStock} ${selectedProduct.unit}.`
      );
      return;
    }

    if (existingInCart) {
      setCart(
        cart.map((item) =>
          item.product === selectedProduct._id
            ? {
                ...item,
                quantity: totalQtyNeeded,
                total: Number((item.total + calculatedTotal).toFixed(2)),
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product: selectedProduct._id,
          productName: selectedProduct.name,
          unit: selectedProduct.unit,
          quantity: calculatedQty,
          unitPrice: selectedProduct.sellingPrice,
          total: calculatedTotal,
          availableStock: selectedProduct.currentStock,
        },
      ]);
    }

    setQuantityInput('');
    setAmountInput('');
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter((item) => item.product !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const numDiscount = Math.max(0, Number(discount) || 0);
  const grandTotal = Math.max(0, subtotal - numDiscount);

  const handleCompleteSale = async () => {
    setError('');
    if (cart.length === 0) {
      setError('Cart is empty. Please add items before completing sale.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/sales', {
        items: cart.map((i) => ({
          productId: i.product,
          quantity: i.quantity,
        })),
        discount: numDiscount,
        paymentMethod,
      });

      if (res.data.success) {
        setCompletedSale(res.data.data.sale);
        setCart([]);
        setDiscount('0');
        // Refresh product stock
        fetchProducts();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete sale checkout.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <ShoppingCart className="w-6 h-6 text-orange-500 mr-2.5" />
          Point of Sale (POS) - New LPG Sale
        </h1>
        <p className="text-sm text-slate-400">Sell gas by weight (kg) or cash amount (GH₵) with instant stock balance deduction</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selection & Add Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-5">
            <h3 className="text-base font-bold text-white">Select Product & Sale Mode</h3>

            {loading ? (
              <div className="py-8 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                Loading inventory catalog...
              </div>
            ) : (
              <form onSubmit={handleAddToCart} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Select Inventory Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} — {formatCurrency(p.sellingPrice)} / {p.unit} ({p.currentStock} {p.unit} in stock)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock availability indicator */}
                {selectedProduct && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-slate-400">Available Tank Stock:</span>
                      <span className="ml-2 font-bold text-orange-400 text-sm">
                        {formatWeight(selectedProduct.currentStock, selectedProduct.unit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Selling Price:</span>
                      <span className="ml-2 font-bold text-emerald-400 text-sm">
                        {formatCurrency(selectedProduct.sellingPrice)} / {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
                )}

                {/* Entry Mode Toggle: By Weight vs By Money Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    How does the customer want to buy?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEntryMode('weight')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition ${
                        entryMode === 'weight'
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-lg'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Scale className="w-4 h-4 text-orange-400" />
                      <span>Sell By Weight (kg)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEntryMode('amount')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center space-x-2 transition ${
                        entryMode === 'amount'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Sell By Amount (GH₵)</span>
                    </button>
                  </div>
                </div>

                {/* Inputs depending on Mode */}
                {entryMode === 'weight' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Weight to Dispense ({selectedProduct?.unit || 'kg'})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={quantityInput}
                        onChange={(e) => setQuantityInput(e.target.value)}
                        placeholder="e.g. 12.5"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Calculated Price (GH₵)
                      </label>
                      <div className="px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-emerald-400 font-black text-base">
                        {quantityInput && selectedProduct
                          ? formatCurrency(Number(quantityInput) * selectedProduct.sellingPrice)
                          : 'GH₵ 0.00'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Cash Amount Paid (GH₵)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        placeholder="e.g. 25.00"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-emerald-400 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Calculated Gas Volume (kg)
                      </label>
                      <div className="px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-orange-400 font-black text-base">
                        {amountInput && selectedProduct && selectedProduct.sellingPrice > 0
                          ? formatWeight((Number(amountInput) / selectedProduct.sellingPrice).toFixed(2), selectedProduct.unit)
                          : '0.00 kg'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Calculation Helper Explanation */}
                {entryMode === 'amount' && amountInput && selectedProduct && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    💡 Customer pays <strong>GH₵ {amountInput}</strong> at <strong>GH₵ {selectedProduct.sellingPrice}/kg</strong> = Exactly <strong>{(Number(amountInput) / selectedProduct.sellingPrice).toFixed(2)} kg</strong> will be deducted from your storage tank.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedProduct || selectedProduct.currentStock <= 0}
                  className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item to Cart</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Cart & Checkout Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between h-full space-y-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center">
                  <Receipt className="w-4 h-4 text-orange-400 mr-2" />
                  Current Checkout Items ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs font-semibold text-rose-400 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Cart Item List */}
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    No items in cart. Add gas or accessories to checkout.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white text-sm">{item.productName}</p>
                        <p className="text-slate-400 mt-0.5">
                          {Number(item.quantity).toFixed(2)} {item.unit} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-black text-emerald-400 text-sm">
                          {formatCurrency(item.total)}
                        </span>
                        <button
                          onClick={() => handleRemoveFromCart(item.product)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment & Totals */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Cash', label: 'Cash', icon: Banknote },
                    { id: 'Mobile Money', label: 'Mobile Money', icon: Smartphone },
                    { id: 'Card', label: 'Card', icon: CreditCard },
                    { id: 'Bank Transfer', label: 'Bank Transfer', icon: Receipt },
                  ].map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`flex items-center justify-center py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          paymentMethod === pm.id
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 mr-1.5" />
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-200">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Discount (GH₵):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="flex justify-between items-center text-base pt-2 border-t border-slate-800 font-black">
                  <span className="text-white">Total Amount:</span>
                  <span className="text-emerald-400 text-xl">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleCompleteSale}
                disabled={submitting || cart.length === 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 transition"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{submitting ? 'Processing Invoice...' : 'Complete & Process Sale'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setCompletedSale(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-800">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Sale Completed Successfully</h3>
              <p className="text-xs text-slate-400">Invoice Number: <span className="font-bold text-orange-400">{completedSale.invoiceNumber}</span></p>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {completedSale.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-200">{i.productName}</p>
                      <p className="text-[11px] text-slate-400">{Number(i.quantity).toFixed(2)} kg × {formatCurrency(i.unitPrice)}</p>
                    </div>
                    <span className="font-bold text-white">{formatCurrency(i.total)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(completedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Discount:</span>
                  <span>{formatCurrency(completedSale.discount)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-emerald-400 pt-1">
                  <span>Total Amount Paid:</span>
                  <span>{formatCurrency(completedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Payment Method:</span>
                  <span className="font-bold text-white">{completedSale.paymentMethod}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex space-x-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition"
              >
                Done / Next Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesNewPage;
