import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  Receipt,
  Search,
  Calendar,
  Eye,
  Printer,
  X,
  RefreshCw,
} from 'lucide-react';

const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected sale modal
  const [viewingSale, setViewingSale] = useState(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      let url = `/sales?invoiceNumber=${invoiceSearch}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await API.get(url);
      if (res.data.success) {
        setSales(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [invoiceSearch, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <Receipt className="w-6 h-6 text-orange-500 mr-2.5" />
          Sales Transactions History
        </h1>
        <p className="text-sm text-slate-400">Search and review completed customer gas invoices</p>
      </div>

      {/* Search & Date Filter */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search invoice number..."
            value={invoiceSearch}
            onChange={(e) => setInvoiceSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            onClick={fetchSales}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sales History Table */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Sold By</th>
                <th className="py-3.5 px-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                    Fetching sales history records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No sales invoices found for selected criteria.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-orange-400">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      {sale.items.map((i) => `${i.productName} (${i.quantity} ${i.product?.unit || 'kg'})`).join(', ')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-400">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs">
                      {sale.soldBy?.name || 'Staff'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setViewingSale(sale)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs inline-flex items-center space-x-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-orange-400" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      {viewingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setViewingSale(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Sales Invoice Receipt</h3>
              <p className="text-xs text-orange-400 font-bold mt-0.5">{viewingSale.invoiceNumber}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Issued on {formatDateTime(viewingSale.createdAt)} by {viewingSale.soldBy?.name}
              </p>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="space-y-2">
                <p className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Purchased Items</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {viewingSale.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-white">{item.productName}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-400">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(viewingSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Discount:</span>
                  <span>{formatCurrency(viewingSale.discount)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-emerald-400 pt-1">
                  <span>Total Revenue:</span>
                  <span>{formatCurrency(viewingSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Payment Method:</span>
                  <span className="font-bold text-white">{viewingSale.paymentMethod}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setViewingSale(null)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;
