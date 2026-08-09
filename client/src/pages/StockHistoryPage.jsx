import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { formatDateTime, formatWeight } from '../utils/formatters';
import {
  History,
  Filter,
  Calendar,
  ArrowDownRight,
  ShoppingCart,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';

const StockHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = `/inventory/transactions?type=${selectedType}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await API.get(url);
      if (res.data.success) {
        setTransactions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stock transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedType, startDate, endDate]);

  const getTypeBadge = (type) => {
    switch (type) {
      case 'STOCK_IN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <ArrowDownRight className="w-3 h-3 mr-1" /> STOCK IN
          </span>
        );
      case 'SALE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            <ShoppingCart className="w-3 h-3 mr-1" /> SALE
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <SlidersHorizontal className="w-3 h-3 mr-1" /> ADJUSTMENT
          </span>
        );
      default:
        return <span className="text-slate-400">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <History className="w-6 h-6 text-orange-500 mr-2.5" />
          Stock Movement & Audit History
        </h1>
        <p className="text-sm text-slate-400">Complete audit log of every stock increase, sale, and manual adjustment</p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            {['ALL', 'STOCK_IN', 'SALE', 'ADJUSTMENT'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-md transition ${
                  selectedType === type
                    ? 'bg-orange-500 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'ALL' ? 'All Types' : type.replace('_', ' ')}
              </button>
            ))}
          </div>
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
            onClick={fetchTransactions}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
            title="Refresh Audit History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Movement Qty</th>
                <th className="py-3.5 px-4">Previous Stock</th>
                <th className="py-3.5 px-4">New Stock Balance</th>
                <th className="py-3.5 px-4">Reason / Notes</th>
                <th className="py-3.5 px-4">Performed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                    Fetching inventory movement audit logs...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No stock transactions recorded matching these filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-slate-300 text-xs">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      {getTypeBadge(tx.type)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {tx.product?.name || 'Deleted Product'}
                    </td>
                    <td className="py-3.5 px-4 font-black">
                      <span className={tx.type === 'STOCK_IN' || tx.quantity > 0 ? 'text-cyan-400' : 'text-orange-400'}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} {tx.product?.unit || 'kg'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatWeight(tx.previousStock, tx.product?.unit)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {formatWeight(tx.newStock, tx.product?.unit)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs max-w-xs truncate" title={tx.reason}>
                      {tx.reason || tx.reference || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs font-medium">
                      {tx.performedBy?.name || 'System'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryPage;
