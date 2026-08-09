import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { formatCurrency, formatWeight } from '../utils/formatters';
import {
  BarChart3,
  Calendar,
  Download,
  Flame,
  DollarSign,
  TrendingUp,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'sales' | 'inventory'

  // Daily Report State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState(null);

  // Sales Report State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesReportData, setSalesReportData] = useState(null);

  // Inventory Report State
  const [inventoryReportData, setInventoryReportData] = useState(null);

  const [loading, setLoading] = useState(true);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/reports/daily?date=${selectedDate}`);
      if (res.data.success) {
        setDailyData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch daily report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      let url = '/reports/sales';
      if (startDate) url += `?startDate=${startDate}`;
      if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`;

      const res = await API.get(url);
      if (res.data.success) {
        setSalesReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const res = await API.get('/reports/inventory');
      if (res.data.success) {
        setInventoryReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch inventory report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyReport();
    } else if (activeTab === 'sales') {
      fetchSalesReport();
    } else if (activeTab === 'inventory') {
      fetchInventoryReport();
    }
  }, [activeTab, selectedDate, startDate, endDate]);

  // Export to CSV helper
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'daily' && dailyData) {
      csvContent += 'Metric,Value\n';
      csvContent += `Report Date,${dailyData.formattedDate}\n`;
      csvContent += `Opening Stock,${dailyData.openingStockKg} kg\n`;
      csvContent += `Stock Received,${dailyData.stockReceivedKg} kg\n`;
      csvContent += `LPG Sold,${dailyData.stockSoldKg} kg\n`;
      csvContent += `Adjustments,${dailyData.adjustmentsKg} kg\n`;
      csvContent += `Closing Stock,${dailyData.closingStockKg} kg\n`;
      csvContent += `Total Sales Revenue,GH₵ ${dailyData.totalSalesRevenue}\n`;
      csvContent += `Number of Sales,${dailyData.numberOfSales}\n`;
      csvContent += `Average Sale,GH₵ ${dailyData.averageSaleAmount}\n`;
    } else if (activeTab === 'sales' && salesReportData) {
      csvContent += 'Metric,Value\n';
      csvContent += `Total Revenue,GH₵ ${salesReportData.totalRevenue}\n`;
      csvContent += `Total LPG Sold,${salesReportData.totalLpgKgSold} kg\n`;
      csvContent += `Number of Sales,${salesReportData.numberOfSales}\n`;
      csvContent += `Average Sale,GH₵ ${salesReportData.averageSaleAmount}\n`;
    } else if (activeTab === 'inventory' && inventoryReportData) {
      csvContent += 'Item Name,Category,Stock,Unit,Cost Valuation,Retail Valuation,Status\n';
      inventoryReportData.items.forEach((item) => {
        csvContent += `"${item.name}",${item.category},${item.currentStock},${item.unit},GH₵ ${item.costValuation},GH₵ ${item.retailValuation},${item.status}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lpg_${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <BarChart3 className="w-6 h-6 text-orange-500 mr-2.5" />
            Analytics & Reports
          </h1>
          <p className="text-sm text-slate-400">Generate daily inventory balance, sales summaries, and valuation reports</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition"
        >
          <Download className="w-4 h-4 text-orange-400" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 max-w-md">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'daily' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Daily Inventory Report
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'sales' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Sales Summary
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'inventory' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Valuation Report
        </button>
      </div>

      {/* Tab 1: Daily Inventory Report */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-slate-300">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="font-semibold">Select Report Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
              />
            </div>

            <button
              onClick={fetchDailyReport}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
              Computing daily inventory balance...
            </div>
          ) : dailyData ? (
            <div className="space-y-6">
              {/* Daily Title Banner */}
              <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center">
                <p className="text-xs uppercase tracking-wider font-bold text-orange-400">Daily Inventory Balance Audit</p>
                <h2 className="text-xl font-black text-white mt-0.5">{dailyData.formattedDate}</h2>
              </div>

              {/* Mathematical Equation Balance Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Opening Stock</span>
                  <h3 className="text-2xl font-black text-white mt-1">{formatWeight(dailyData.openingStockKg, 'kg')}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Start of day balance</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">+ 2. Received</span>
                  <h3 className="text-2xl font-black text-cyan-300 mt-1">{formatWeight(dailyData.stockReceivedKg, 'kg')}</h3>
                  <p className="text-[10px] text-cyan-400/80 mt-0.5">Refilled stock in</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">- 3. LPG Sold</span>
                  <h3 className="text-2xl font-black text-orange-300 mt-1">{formatWeight(dailyData.stockSoldKg, 'kg')}</h3>
                  <p className="text-[10px] text-orange-400/80 mt-0.5">Quantity sold today</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">+/- 4. Adjustments</span>
                  <h3 className="text-2xl font-black text-amber-300 mt-1">
                    {dailyData.adjustmentsKg > 0 ? `+${dailyData.adjustmentsKg}` : dailyData.adjustmentsKg} kg
                  </h3>
                  <p className="text-[10px] text-amber-400/80 mt-0.5">Manual audit corrections</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-extrabold">= 5. Closing Stock</span>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatWeight(dailyData.closingStockKg, 'kg')}</h3>
                  <p className="text-[10px] text-emerald-300 mt-0.5">End of day available stock</p>
                </div>
              </div>

              {/* Financial Performance Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-5 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sales Revenue</span>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(dailyData.totalSalesRevenue)}</h3>
                </div>

                <div className="glass-card p-5 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Number of Sales</span>
                  <h3 className="text-2xl font-black text-white mt-1">{dailyData.numberOfSales} Invoices</h3>
                </div>

                <div className="glass-card p-5 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Sale Amount</span>
                  <h3 className="text-2xl font-black text-blue-400 mt-1">{formatCurrency(dailyData.averageSaleAmount)}</h3>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Sales Summary */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs text-slate-300 w-full md:w-auto">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>Range From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              onClick={fetchSalesReport}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
              Computing sales summary metrics...
            </div>
          ) : salesReportData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(salesReportData.totalRevenue)}</h3>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total LPG Sold</span>
                  <h3 className="text-2xl font-black text-white mt-1">{formatWeight(salesReportData.totalLpgKgSold, 'kg')}</h3>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Invoices</span>
                  <h3 className="text-2xl font-black text-white mt-1">{salesReportData.numberOfSales}</h3>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Invoice Value</span>
                  <h3 className="text-2xl font-black text-blue-400 mt-1">{formatCurrency(salesReportData.averageSaleAmount)}</h3>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div className="glass-card p-5 rounded-2xl border border-slate-800">
                <h3 className="text-base font-bold text-white mb-4">Payment Methods Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(salesReportData.paymentMethodBreakdown || {}).map(([method, amount]) => (
                    <div key={method} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <span className="text-slate-400 font-semibold">{method}</span>
                      <p className="text-lg font-bold text-white mt-1">{formatCurrency(amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 3: Inventory Valuation */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
              Calculating inventory valuation...
            </div>
          ) : inventoryReportData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Warehouse LPG</span>
                  <h3 className="text-2xl font-black text-orange-400 mt-1">{formatWeight(inventoryReportData.totalStockKg, 'kg')}</h3>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valuation (Cost Price)</span>
                  <h3 className="text-2xl font-black text-white mt-1">{formatCurrency(inventoryReportData.totalCostValue)}</h3>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valuation (Retail Price)</span>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(inventoryReportData.totalRetailValue)}</h3>
                </div>

                <div className="glass-card p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Potential Gross Profit</span>
                  <h3 className="text-2xl font-black text-teal-400 mt-1">{formatCurrency(inventoryReportData.potentialProfit)}</h3>
                </div>
              </div>

              <div className="glass-card rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                        <th className="py-3.5 px-4">Item Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Stock Level</th>
                        <th className="py-3.5 px-4">Cost Price</th>
                        <th className="py-3.5 px-4">Selling Price</th>
                        <th className="py-3.5 px-4">Cost Valuation</th>
                        <th className="py-3.5 px-4">Retail Valuation</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {inventoryReportData.items.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3.5 px-4 font-bold text-white">{item.name}</td>
                          <td className="py-3.5 px-4 text-slate-300 text-xs">{item.category}</td>
                          <td className="py-3.5 px-4 font-bold text-white">{formatWeight(item.currentStock, item.unit)}</td>
                          <td className="py-3.5 px-4 text-slate-300">{formatCurrency(item.costPrice)}</td>
                          <td className="py-3.5 px-4 text-emerald-400 font-semibold">{formatCurrency(item.sellingPrice)}</td>
                          <td className="py-3.5 px-4 text-slate-200">{formatCurrency(item.costValuation)}</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400">{formatCurrency(item.retailValuation)}</td>
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-300">{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
