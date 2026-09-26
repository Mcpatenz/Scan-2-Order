import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import {
  CreditCard,
  Search,
  Printer,
  CheckCircle2,
  XCircle,
  Banknote,
  Smartphone,
  DollarSign,
  Receipt,
  Filter,
  User,
  ShieldCheck,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { ReceiptModal } from '../Common/ReceiptModal';
import { SalesReportSection } from '../Common/SalesReportSection';
import { ClockInOutManager } from './ClockInOutManager';

export const CashierDashboard: React.FC = () => {
  const {
    orders,
    products,
    updateOrderStatus,
    updateOrderPaymentStatus,
    cancelOrder,
    activeCashier,
    availableCashiers,
    switchCashierById,
  } = useOrderContext();

  const [activeTab, setActiveTab] = useState<'pos' | 'clock' | 'reports'>('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'pending' | 'ready'>('all');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Low stock & out of stock menu items calculation
  const lowStockProducts = products.filter(p => {
    const qty = p.stockQuantity ?? (p.inStock ? 10 : 0);
    const threshold = p.lowStockThreshold ?? 5;
    return !p.inStock || qty <= threshold;
  });

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tableNumber.includes(searchQuery) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'unpaid') return matchesSearch && o.paymentStatus === 'unpaid';
    if (statusFilter === 'pending') return matchesSearch && o.status === 'pending';
    if (statusFilter === 'ready') return matchesSearch && o.status === 'ready';
    return matchesSearch;
  });

  const totalSalesToday = orders
    .filter(o => o.paymentStatus === 'paid' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const unpaidCount = orders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'cancelled').length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Top Header & Cashier Profile Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-xl">
        
        {/* Title & Section */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white font-black shadow-lg shadow-sky-500/20">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Cashier POS Terminal</h2>
            <p className="text-xs text-slate-400">Order Acceptance, Payments, Receipts & Financial Reports</p>
          </div>
        </div>

        {/* Logged-in Cashier Card & Switcher */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-black text-white">{activeCashier.name}</p>
                <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase">
                  {activeCashier.employeeCode}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{activeCashier.role} • {activeCashier.shift}</p>
            </div>
          </div>

          {/* Cashier Switcher */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800">
            <label className="text-[10px] font-bold text-slate-400 hidden sm:inline">Switch Staff:</label>
            <select
              value={activeCashier.id}
              onChange={e => switchCashierById(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-sky-300 focus:border-sky-500 focus:outline-none"
            >
              {availableCashiers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.employeeCode})</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Tabs: POS vs Clock In/Out vs Reports */}
        <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'pos' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="h-4 w-4" /> POS Orders
          </button>

          <button
            onClick={() => setActiveTab('clock')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'clock' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4 text-emerald-400" /> Shift Clock In/Out
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'reports' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" /> Sales Reports
          </button>
        </div>

      </div>

      {/* Cashier Low Stock Warning Notification Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-950/90 border border-amber-500/60 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>Cashier POS Alert: Low Stock & Out of Stock Menu Items ({lowStockProducts.length})</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-md font-extrabold uppercase">
              Inventory Warning
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {lowStockProducts.map(p => {
              const qty = p.stockQuantity ?? (p.inStock ? 10 : 0);
              const threshold = p.lowStockThreshold ?? 5;
              const isOut = !p.inStock || qty <= 0;

              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border font-bold ${
                    isOut
                      ? 'bg-rose-950/90 text-rose-200 border-rose-600/80 shadow-xs'
                      : 'bg-amber-950/90 text-amber-100 border-amber-600/80 shadow-xs'
                  }`}
                >
                  <span className="font-black">{isOut ? '🔴 SOLD OUT:' : '⚠️ LOW STOCK:'}</span>
                  <span className="font-extrabold">{p.name}</span>
                  <span className="text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-md font-mono">
                    {isOut ? '0 units remaining' : `${qty} left (Alert limit: ${threshold})`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 1: POS ORDERS TERMINAL */}
      {activeTab === 'pos' && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Logged-In Cashier</p>
              <p className="text-base font-black text-sky-400 mt-1">{activeCashier.name}</p>
              <p className="text-[10px] text-slate-500">{activeCashier.shift}</p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Today's Paid Sales</p>
              <p className="text-xl font-black text-emerald-400 mt-1">${totalSalesToday.toFixed(2)}</p>
              <p className="text-[10px] text-slate-500">Collected transactions</p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Unpaid Pending Bills</p>
              <p className="text-xl font-black text-amber-400 mt-1">{unpaidCount} Pending</p>
              <p className="text-[10px] text-slate-500">Awaiting cashier collection</p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Shift Login Time</p>
              <p className="text-base font-black text-purple-400 mt-1">{activeCashier.loginTime}</p>
              <p className="text-[10px] text-slate-500">Terminal active</p>
            </div>
          </div>

          {/* Filter & Search Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Order #, Table #, or Customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'all' ? 'bg-sky-500 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                All Orders
              </button>

              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'unpaid' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Unpaid ({unpaidCount})
              </button>

              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'pending' ? 'bg-red-500 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Pending Accept
              </button>

              <button
                onClick={() => setStatusFilter('ready')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'ready' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Ready to Serve
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-extrabold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Order ID</th>
                    <th className="px-4 py-3.5">Table</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Processed By</th>
                    <th className="px-4 py-3.5">Items Summary</th>
                    <th className="px-4 py-3.5">Total</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-4 py-3.5">Order Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No orders found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-900/50 transition">
                        
                        <td className="px-4 py-4 font-black text-white">
                          {order.id}
                          <p className="text-[10px] text-slate-500 font-normal">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>

                        <td className="px-4 py-4 font-extrabold text-amber-400">
                          Table #{order.tableNumber}
                        </td>

                        <td className="px-4 py-4 font-bold text-slate-200">
                          {order.customerName}
                          <p className="text-[10px] text-slate-500 font-normal">{order.diningOption === 'dine_in' ? 'Dine In' : 'Takeout'}</p>
                        </td>

                        <td className="px-4 py-4 font-bold text-sky-400">
                          {order.cashierName || activeCashier.name}
                        </td>

                        <td className="px-4 py-4 max-w-xs text-slate-300">
                          <p className="line-clamp-1 font-semibold">
                            {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                          </p>
                          {order.notes && (
                            <p className="text-[10px] italic text-amber-400 line-clamp-1">
                              Note: "{order.notes}"
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 font-black text-emerald-400">
                          ${order.total.toFixed(2)}
                        </td>

                        {/* Payment Status Pill */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              updateOrderPaymentStatus(
                                order.id,
                                order.paymentStatus === 'paid' ? 'unpaid' : 'paid'
                              )
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition ${
                              order.paymentStatus === 'paid'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800 hover:bg-amber-900'
                            }`}
                          >
                            {order.paymentStatus === 'paid' ? '✓ Paid' : '⌛ Unpaid'}
                          </button>
                        </td>

                        {/* Order Status Pill */}
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            order.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400'
                              : order.status === 'cancelled'
                              ? 'bg-red-950 text-red-400'
                              : order.status === 'ready'
                              ? 'bg-sky-950 text-sky-400 animate-pulse'
                              : 'bg-amber-950 text-amber-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'accepted')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg"
                              >
                                Accept
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedReceiptOrder(order)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1"
                              title="Print Thermal Receipt"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Receipt</span>
                            </button>

                            {order.status !== 'cancelled' && order.status !== 'completed' && (
                              <button
                                onClick={() => cancelOrder(order.id)}
                                className="text-red-400 hover:text-red-300 p-1"
                                title="Cancel Order"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SHIFT CLOCK IN / OUT TERMINAL */}
      {activeTab === 'clock' && <ClockInOutManager />}

      {/* VIEW 3: SALES REPORTS */}
      {activeTab === 'reports' && (
        <SalesReportSection
          orders={orders}
          userName={activeCashier.name}
          role="Cashier"
        />
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        cashierName={activeCashier.name}
      />

    </div>
  );
};
