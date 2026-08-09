import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency, formatWeight } from '../utils/formatters';
import {
  Flame,
  TrendingUp,
  DollarSign,
  Receipt,
  ArrowDownRight,
  ShoppingCart,
  RefreshCw,
  BarChart2,
  Package,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [salesChartData, setSalesChartData] = useState([]);
  const [stockChartData, setStockChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, salesRes, stockRes] = await Promise.all([
        API.get('/dashboard/summary'),
        API.get('/dashboard/sales-chart?days=7'),
        API.get('/dashboard/stock-chart?days=7'),
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (salesRes.data.success) setSalesChartData(salesRes.data.data);
      if (stockRes.data.success) setStockChartData(stockRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mb-3" />
        <p className="text-sm font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2">
      {/* 1. Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link
          to="/sales/new"
          className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl flex items-center justify-between transition group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">New Sale (POS)</h2>
              <p className="text-xs text-emerald-100 mt-0.5">Sell gas to customer</p>
            </div>
          </div>
          <span className="px-4 py-2 bg-white text-emerald-950 rounded-xl font-bold text-xs group-hover:scale-105 transition">
            Start Sale →
          </span>
        </Link>

        <Link
          to="/inventory/stock-in"
          className="p-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xl flex items-center justify-between transition group"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <ArrowDownRight className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">Record Stock In</h2>
              <p className="text-xs text-cyan-100 mt-0.5">Tanker refill delivery</p>
            </div>
          </div>
          <span className="px-4 py-2 bg-white text-cyan-950 rounded-xl font-bold text-xs group-hover:scale-105 transition">
            Add Stock →
          </span>
        </Link>
      </div>

      {/* 2. Key Metrics Cards (Spacious 4-Card Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Tank Stock */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-bold">
            <span>Tank Stock Balance</span>
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-3xl font-black text-orange-400 font-display">
            {formatWeight(summary?.currentLpgStockKg || 0, 'kg')}
          </h3>
        </div>

        {/* Card 2: Today's Gas Sold */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-bold">
            <span>Today's Gas Sold</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-3xl font-black text-white font-display">
            {formatWeight(summary?.todayLpgSoldKg || 0, 'kg')}
          </h3>
        </div>

        {/* Card 3: Today's Revenue */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-bold">
            <span>Today's Revenue</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-3xl font-black text-emerald-400 font-display">
            {formatCurrency(summary?.todaySalesRevenue || 0)}
          </h3>
        </div>

        {/* Card 4: Sales Count */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs uppercase tracking-wider font-bold">
            <span>Completed Sales</span>
            <Receipt className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-3xl font-black text-white font-display">
            {summary?.todayTransactionCount || 0}
          </h3>
        </div>
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Sales Revenue Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white font-display flex items-center">
            <BarChart2 className="w-4 h-4 text-emerald-400 mr-2" />
            7-Day Sales Revenue (GH₵)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '10px', color: '#fff' }}
                  formatter={(val) => [`GH₵ ${val}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Movement Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white font-display flex items-center">
            <Package className="w-4 h-4 text-orange-400 mr-2" />
            7-Day Gas Dispensed (kg)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '10px', color: '#fff' }}
                  formatter={(val) => [`${val} kg`, 'Gas Out']}
                />
                <Bar dataKey="stockOut" name="Gas Sold (kg)" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
