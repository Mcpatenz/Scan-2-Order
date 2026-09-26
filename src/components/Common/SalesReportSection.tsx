import React, { useState } from 'react';
import { Order } from '../../types';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  TrendingUp,
  Receipt,
  Search,
  UserCheck,
} from 'lucide-react';
import { generatePdfReport, ReportFilterOptions } from '../../utils/pdfGenerator';

interface SalesReportSectionProps {
  orders: Order[];
  userName: string;
  role: 'Cashier' | 'Admin';
}

export const SalesReportSection: React.FC<SalesReportSectionProps> = ({
  orders,
  userName,
  role,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentYearStr = new Date().getFullYear().toString();

  // Filter States
  const [periodType, setPeriodType] = useState<'date' | 'month' | 'year' | 'all'>('date');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [diningFilter, setDiningFilter] = useState<'all' | 'dine_in' | 'takeout'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter logic
  const filteredOrders = orders.filter(o => {
    const dateStr = o.createdAt.slice(0, 10);
    const monthStr = o.createdAt.slice(0, 7);
    const yearStr = o.createdAt.slice(0, 4);

    if (periodType === 'date' && selectedDate && dateStr !== selectedDate) return false;
    if (periodType === 'month' && selectedMonth && monthStr !== selectedMonth) return false;
    if (periodType === 'year' && selectedYear && yearStr !== selectedYear) return false;

    if (paymentStatusFilter === 'paid' && o.paymentStatus !== 'paid') return false;
    if (paymentStatusFilter === 'unpaid' && o.paymentStatus !== 'unpaid') return false;

    if (diningFilter === 'dine_in' && o.diningOption !== 'dine_in') return false;
    if (diningFilter === 'takeout' && o.diningOption !== 'takeout') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.tableNumber.includes(q) ||
        (o.cashierName && o.cashierName.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  // Analytics Metrics
  const totalPaidRevenue = filteredOrders
    .filter(o => o.paymentStatus === 'paid' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalUnpaidAmount = filteredOrders
    .filter(o => o.paymentStatus === 'unpaid' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const paidOrdersCount = filteredOrders.filter(
    o => o.paymentStatus === 'paid' && o.status !== 'cancelled'
  ).length;

  const avgOrderValue = paidOrdersCount > 0 ? totalPaidRevenue / paidOrdersCount : 0;

  // Method Breakdown
  const cashSales = filteredOrders
    .filter(o => o.paymentStatus === 'paid' && o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.total, 0);

  const cardSales = filteredOrders
    .filter(o => o.paymentStatus === 'paid' && o.paymentMethod === 'card')
    .reduce((sum, o) => sum + o.total, 0);

  const gcashSales = filteredOrders
    .filter(o => o.paymentStatus === 'paid' && o.paymentMethod === 'gcash')
    .reduce((sum, o) => sum + o.total, 0);

  // Download PDF handler
  const handleDownloadPdf = () => {
    const filterOptions: ReportFilterOptions = {
      periodType,
      selectedDate,
      selectedMonth,
      selectedYear,
      paymentStatus: paymentStatusFilter,
      diningOption: diningFilter,
      generatedBy: userName,
      role,
    };

    generatePdfReport(filteredOrders, filterOptions);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & PDF Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-black text-white">
              {role} Financial & Sales Reports
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <UserCheck className="h-3.5 w-3.5 text-sky-400" />
            <span>Active User: <strong className="text-slate-200">{userName}</strong> ({role})</span>
          </p>
        </div>

        <button
          onClick={handleDownloadPdf}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition"
        >
          <Download className="h-4 w-4" /> Download Official PDF Report
        </button>
      </div>

      {/* Filter Controls Card */}
      <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Report Filter & Period Selector
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setPeriodType('date');
                setSelectedDate(todayStr);
              }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={() => {
                setPeriodType('month');
                setSelectedMonth(currentMonthStr);
              }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              This Month
            </button>
            <button
              onClick={() => {
                setPeriodType('year');
                setSelectedYear(currentYearStr);
              }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              This Year
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* Period Type Selection */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">Filter By Period:</label>
            <select
              value={periodType}
              onChange={e => setPeriodType(e.target.value as any)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-white font-bold focus:border-emerald-500 focus:outline-none"
            >
              <option value="date">Daily (By Specific Date)</option>
              <option value="month">Monthly (By Month)</option>
              <option value="year">Yearly (By Year)</option>
              <option value="all">All Time History</option>
            </select>
          </div>

          {/* Date Picker (conditional) */}
          {periodType === 'date' && (
            <div>
              <label className="block text-slate-400 font-bold mb-1">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-white font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {/* Month Picker (conditional) */}
          {periodType === 'month' && (
            <div>
              <label className="block text-slate-400 font-bold mb-1">Select Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-white font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {/* Year Picker (conditional) */}
          {periodType === 'year' && (
            <div>
              <label className="block text-slate-400 font-bold mb-1">Select Year:</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-white font-bold focus:border-emerald-500 focus:outline-none"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          )}

          {/* Payment Status Filter */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">Payment Status:</label>
            <select
              value={paymentStatusFilter}
              onChange={e => setPaymentStatusFilter(e.target.value as any)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-white font-bold focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid Orders Only</option>
              <option value="unpaid">Unpaid / Pending Bills</option>
            </select>
          </div>

          {/* Dining Option Filter */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">Dining Option:</label>
            <select
              value={diningFilter}
              onChange={e => setDiningFilter(e.target.value as any)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-white font-bold focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Dining Options</option>
              <option value="dine_in">Dine In</option>
              <option value="takeout">Takeout</option>
            </select>
          </div>

        </div>

        {/* Search inside report */}
        <div className="relative pt-2">
          <Search className="absolute left-3.5 top-5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search report by Order ID, Table #, Customer or Cashier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Net Sales Revenue</span>
            <DollarSign className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-2">${totalPaidRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{paidOrdersCount} paid transactions in period</p>
        </div>

        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Average Order Value</span>
            <TrendingUp className="h-5 w-5 text-sky-400" />
          </div>
          <p className="text-3xl font-black text-sky-400 mt-2">${avgOrderValue.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 mt-1">Per paid customer ticket</p>
        </div>

        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Unpaid Pending Bills</span>
            <Receipt className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-400 mt-2">${totalUnpaidAmount.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 mt-1">Uncollected open bills</p>
        </div>

        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Filtered Records</span>
            <FileSpreadsheet className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-purple-400 mt-2">{filteredOrders.length}</p>
          <p className="text-[10px] text-slate-500 mt-1">Matching current filter parameters</p>
        </div>

      </div>

      {/* Payment Method Breakdown Bar */}
      <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-lg space-y-3">
        <h4 className="text-xs font-extrabold uppercase text-slate-300 tracking-wider">
          Payment Method Breakdown (Paid Revenue)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Cash Payments</span>
            </div>
            <span className="text-sm font-black text-emerald-400">${cashSales.toFixed(2)}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-200">Credit / Debit Card</span>
            </div>
            <span className="text-sm font-black text-sky-400">${cardSales.toFixed(2)}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-200">GCash / E-Wallet</span>
            </div>
            <span className="text-sm font-black text-purple-400">${gcashSales.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Itemized Orders Table */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
            Filtered Report Sales Log ({filteredOrders.length} Orders)
          </h4>
          <span className="text-[10px] text-slate-400">PDF download exports all displayed rows</span>
        </div>

        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-extrabold border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Table</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No orders match the selected report filter parameters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-900/50 transition">
                    <td className="px-4 py-3 font-black text-white">{order.id}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-amber-400">Table #{order.tableNumber}</td>
                    <td className="px-4 py-3 text-slate-200">{order.customerName}</td>
                    <td className="px-4 py-3 text-sky-400 font-semibold">{order.cashierName || userName}</td>
                    <td className="px-4 py-3 uppercase font-bold text-slate-300">{order.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        order.paymentStatus === 'paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-400">${order.total.toFixed(2)}</td>
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
