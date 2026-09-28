import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '../../types';
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
  FileText,
  X,
  QrCode,
  LogIn,
  LogOut,
  Coffee,
  Armchair,
  Sparkles,
  Star,
} from 'lucide-react';
import { ReceiptModal, ProcessedPaymentDetails } from '../Common/ReceiptModal';
import { SalesReportSection } from '../Common/SalesReportSection';
import { ClockInOutManager } from './ClockInOutManager';
import { WalkInPosSection } from './WalkInPosSection';

export const CashierDashboard: React.FC = () => {
  const {
    orders,
    products,
    tables,
    setTableOccupancyStatus,
    waiterRequests,
    resolveWaiterRequest,
    updateOrderStatus,
    updateOrderPaymentStatus,
    cancelOrder,
    activeCashier,
    availableCashiers,
    switchCashierById,
    employeeSchedules,
    performClockAction,
  } = useOrderContext();

  const [activeTab, setActiveTab] = useState<'pos' | 'clock' | 'reports'>('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'pending' | 'ready'>('all');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'empty' | 'occupied' | 'cleaning'>('all');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [receiptDefaultView, setReceiptDefaultView] = useState<'summary' | 'detailed'>('summary');
  const [lastPaymentDetails, setLastPaymentDetails] = useState<ProcessedPaymentDetails | null>(null);

  // Payment processing modal state
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash_on_hand');
  const [amountTenderedInput, setAmountTenderedInput] = useState<string>('');

  // Real-time color-coded table status derivation:
  // Green = Empty ('available'), Yellow = Occupied ('occupied'), Red = Needs Cleaning ('cleaning')
  const monitoredTables = tables.map(table => {
    const activeOrdersForTable = orders.filter(
      o =>
        (o.tableId === table.id || o.tableNumber === table.tableNumber) &&
        o.status !== 'completed' &&
        o.status !== 'cancelled'
    );
    const activeOrder =
      activeOrdersForTable.find(o => o.id === table.currentOrderId) ||
      activeOrdersForTable[0] ||
      null;
    const hasCleanRequest = waiterRequests.some(
      r => !r.resolved && r.tableNumber === table.tableNumber && r.type === 'clean'
    );

    const colorState: 'empty' | 'occupied' | 'cleaning' =
      table.status === 'cleaning' || hasCleanRequest
        ? 'cleaning'
        : table.status === 'occupied' || activeOrdersForTable.length > 0
        ? 'occupied'
        : 'empty';

    return {
      table,
      activeOrder,
      activeOrderCount: activeOrdersForTable.length,
      hasCleanRequest,
      colorState,
    };
  });

  const emptyTablesCount = monitoredTables.filter(t => t.colorState === 'empty').length;
  const occupiedTablesCount = monitoredTables.filter(t => t.colorState === 'occupied').length;
  const cleaningTablesCount = monitoredTables.filter(t => t.colorState === 'cleaning').length;

  const filteredMonitoredTables = monitoredTables.filter(t => {
    if (tableStatusFilter === 'all') return true;
    return t.colorState === tableStatusFilter;
  });

  const handleSetTableColorStatus = (
    tableId: string,
    tableNumber: string,
    targetState: 'empty' | 'occupied' | 'cleaning'
  ) => {
    if (targetState === 'empty') {
      // Resolve any pending clean requests for this table
      waiterRequests
        .filter(r => !r.resolved && r.tableNumber === tableNumber && r.type === 'clean')
        .forEach(r => resolveWaiterRequest(r.id));
      setTableOccupancyStatus(tableId, 'available');
    } else if (targetState === 'occupied') {
      setTableOccupancyStatus(tableId, 'occupied');
    } else {
      setTableOccupancyStatus(tableId, 'cleaning');
    }
  };

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

  const paidOrdersList = orders.filter(o => o.paymentStatus === 'paid' && o.status !== 'cancelled');
  const totalSalesToday = paidOrdersList.reduce((sum, o) => sum + o.total, 0);

  const nonCancelledOrders = orders.filter(o => o.status !== 'cancelled');
  const totalOrderTransactions = nonCancelledOrders.length;
  const paidTransactionsCount = paidOrdersList.length;

  const unpaidCount = orders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'cancelled').length;

  const activeCashierSchedule =
    employeeSchedules.find(
      s => s.employeeId === activeCashier.id || s.employeeName === activeCashier.name
    ) || employeeSchedules[0];

  const activeOnClockCount = employeeSchedules.filter(
    s => s.status === 'clocked_in' || s.status === 'on_break'
  ).length;

  const openPaymentModal = (order: Order) => {
    setPaymentModalOrder(order);
    const normalizedMethod: PaymentMethod =
      order.paymentMethod === 'gcash' || order.paymentMethod === 'paymaya'
        ? order.paymentMethod
        : 'cash_on_hand';
    setSelectedMethod(normalizedMethod);
    setAmountTenderedInput(order.total.toFixed(2));
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalOrder) return;

    const parsedTendered = parseFloat(amountTenderedInput);
    const finalTendered =
      !isNaN(parsedTendered) && parsedTendered >= paymentModalOrder.total
        ? parsedTendered
        : paymentModalOrder.total;
    const changeDue = Math.max(0, finalTendered - paymentModalOrder.total);

    updateOrderPaymentStatus(paymentModalOrder.id, 'paid');

    const processedDetails: ProcessedPaymentDetails = {
      orderId: paymentModalOrder.id,
      methodUsed:
        selectedMethod === 'gcash'
          ? 'GCash'
          : selectedMethod === 'paymaya'
          ? 'PayMaya'
          : 'Cash on Hand',
      amountTendered: finalTendered,
      changeDue,
      processedAt: new Date().toISOString(),
      receiptRef: `POS-${paymentModalOrder.id.replace('ORD-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    const updatedOrderSnapshot: Order = {
      ...paymentModalOrder,
      paymentStatus: 'paid',
      paymentMethod: selectedMethod,
      cashierName: activeCashier.name,
      updatedAt: processedDetails.processedAt,
    };

    setLastPaymentDetails(processedDetails);
    setReceiptDefaultView('summary');
    setPaymentModalOrder(null);
    setSelectedReceiptOrder(updatedOrderSnapshot);
  };

  const handleOpenSummarizedReceipt = (order: Order) => {
    setReceiptDefaultView('summary');
    if (lastPaymentDetails?.orderId !== order.id) {
      setLastPaymentDetails(null);
    }
    setSelectedReceiptOrder(order);
  };

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
            <p className="text-xs text-slate-400">
              Order Acceptance, Payments, Summarized Receipts &amp; Financial Reports
            </p>
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
              <p className="text-[10px] text-slate-400">
                {activeCashier.role} • {activeCashier.shift}
              </p>
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
                <option key={c.id} value={c.id}>
                  {c.name} ({c.employeeCode})
                </option>
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
              activeTab === 'clock' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4 text-emerald-400" /> Employee Time Clock ({activeOnClockCount})
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
              <span>Cashier POS Alert: Low Stock &amp; Out of Stock Menu Items ({lowStockProducts.length})</span>
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
          {/* Stats Bar: Total Paid Amount & Total Order Transactions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-2xl bg-slate-950 border border-emerald-500/30 p-4">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Total Paid Amount
              </p>
              <p className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">
                ₱{totalSalesToday.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                From {paidTransactionsCount} paid {paidTransactionsCount === 1 ? 'order' : 'orders'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-sky-500/30 p-4">
              <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                Total Order Transactions
              </p>
              <p className="text-2xl font-black text-white mt-1 tabular-nums">
                {totalOrderTransactions} {totalOrderTransactions === 1 ? 'Order' : 'Orders'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                {paidTransactionsCount} Paid · {unpaidCount} Unpaid
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Unpaid Pending Bills</p>
              <p className="text-xl font-black text-amber-400 mt-1 tabular-nums">{unpaidCount} Pending</p>
              <p className="text-[10px] text-slate-500">Awaiting cashier collection</p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Logged-In Cashier</p>
              <p className="text-base font-black text-sky-400 mt-1">{activeCashier.name}</p>
              <p className="text-[10px] text-slate-500">{activeCashier.shift}</p>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Employee Time Clock</p>
                <span
                  className={`text-[10px] font-black uppercase ${
                    activeCashierSchedule?.status === 'clocked_in'
                      ? 'text-emerald-400'
                      : activeCashierSchedule?.status === 'on_break'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {activeCashierSchedule?.status === 'clocked_in'
                    ? '● Clocked In'
                    : activeCashierSchedule?.status === 'on_break'
                    ? '◐ On Break'
                    : '○ Clocked Out'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-white">
                    {activeCashierSchedule ? `${activeCashierSchedule.totalHoursWorkedToday.toFixed(1)} hrs today` : activeCashier.loginTime}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('clock')}
                    className="text-[10px] font-bold text-sky-400 hover:underline"
                  >
                    Open Time Clock Terminal →
                  </button>
                </div>

                {activeCashierSchedule && (
                  <div className="flex items-center gap-1.5">
                    {activeCashierSchedule.status === 'clocked_out' ? (
                      <button
                        type="button"
                        onClick={() => performClockAction(activeCashierSchedule.employeeId, 'clock_in')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition"
                      >
                        <LogIn className="h-3.5 w-3.5" /> Clock In
                      </button>
                    ) : (
                      <>
                        {activeCashierSchedule.status === 'on_break' ? (
                          <button
                            type="button"
                            onClick={() => performClockAction(activeCashierSchedule.employeeId, 'break_end')}
                            className="px-2 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black transition"
                          >
                            Resume
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => performClockAction(activeCashierSchedule.employeeId, 'break_start')}
                            className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 transition"
                            title="Start Break"
                          >
                            <Coffee className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => performClockAction(activeCashierSchedule.employeeId, 'clock_out')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black transition"
                        >
                          <LogOut className="h-3.5 w-3.5" /> Clock Out
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* WALK-IN & TAKEOUT COUNTER POS REGISTER */}
          <WalkInPosSection
            onOrderCreated={createdOrder => {
              handleOpenSummarizedReceipt(createdOrder);
            }}
          />

          {/* REAL-TIME COLOR-CODED TABLE STATUS MONITOR */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Armchair className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Real-Time Table Status Monitor
                  </h3>
                  <p className="text-xs text-slate-400">
                    Color-coded floor status · Click any status button on a table to update in real time
                  </p>
                </div>
              </div>

              {/* Color-Coded Status Filter & Legend Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTableStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    tableStatusFilter === 'all'
                      ? 'bg-slate-800 text-white border-slate-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  All Tables ({tables.length})
                </button>

                <button
                  type="button"
                  onClick={() => setTableStatusFilter('empty')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    tableStatusFilter === 'empty'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
                  <span>Empty ({emptyTablesCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTableStatusFilter('occupied')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    tableStatusFilter === 'occupied'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-400/40'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400/50" />
                  <span>Occupied ({occupiedTablesCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTableStatusFilter('cleaning')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    tableStatusFilter === 'cleaning'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-rose-500/40'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shadow-xs shadow-rose-500/50" />
                  <span>Needs Cleaning ({cleaningTablesCount})</span>
                </button>
              </div>
            </div>

            {/* Color-Coded Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredMonitoredTables.map(({ table, activeOrder, colorState }) => {
                const isGreen = colorState === 'empty';
                const isYellow = colorState === 'occupied';
                const isRed = colorState === 'cleaning';

                return (
                  <div
                    key={table.id}
                    className={`rounded-2xl border p-3.5 transition flex flex-col justify-between gap-3 ${
                      isGreen
                        ? 'border-emerald-500/40 bg-emerald-950/15 hover:border-emerald-500/70'
                        : isYellow
                        ? 'border-amber-400/50 bg-amber-950/20 hover:border-amber-400/80'
                        : 'border-rose-500/60 bg-rose-950/25 hover:border-rose-500/90'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Top Header: Table # + Color-Coded Status Indicator */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-xs border ${
                              isGreen
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : isYellow
                                ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            }`}
                          >
                            #{table.tableNumber}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-white truncate">
                              {table.name}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              {table.section} · {table.capacity} Seats
                            </p>
                          </div>
                        </div>

                        {/* Color-Coded Status Indicator Dot & Label */}
                        <div
                          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide shrink-0 ${
                            isGreen
                              ? 'text-emerald-400'
                              : isYellow
                              ? 'text-amber-300'
                              : 'text-rose-400'
                          }`}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              isGreen
                                ? 'bg-emerald-500'
                                : isYellow
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-rose-500 animate-ping'
                            }`}
                          />
                          <span>
                            {isGreen
                              ? 'Empty'
                              : isYellow
                              ? 'Occupied'
                              : 'Needs Cleaning'}
                          </span>
                        </div>
                      </div>

                      {/* Real-time contextual detail */}
                      <div className="rounded-xl bg-slate-900/90 border border-slate-800/80 px-2.5 py-2 text-[11px]">
                        {isRed ? (
                          <div className="flex items-center justify-between text-rose-300 font-bold">
                            <span>Bussing / Sanitize Required</span>
                            <Sparkles className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          </div>
                        ) : isYellow && activeOrder ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-200 truncate">
                              {activeOrder.id} · {activeOrder.customerName}
                            </span>
                            <span
                              className={`font-black shrink-0 tabular-nums ${
                                activeOrder.paymentStatus === 'paid'
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              ₱{activeOrder.total.toFixed(2)}
                            </span>
                          </div>
                        ) : isYellow ? (
                          <span className="text-amber-300 font-semibold">
                            Guests seated · Browsing menu
                          </span>
                        ) : (
                          <span className="text-emerald-400/90 font-semibold">
                            Ready for next guests
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick 1-Tap Color Status Switcher */}
                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() =>
                          handleSetTableColorStatus(table.id, table.tableNumber, 'empty')
                        }
                        className={`flex items-center justify-center gap-1 rounded-lg py-1 px-1.5 text-[10px] font-bold transition ${
                          isGreen
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-900 text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
                        }`}
                        title="Mark Table Green (Empty / Available)"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Empty</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSetTableColorStatus(table.id, table.tableNumber, 'occupied')
                        }
                        className={`flex items-center justify-center gap-1 rounded-lg py-1 px-1.5 text-[10px] font-bold transition ${
                          isYellow
                            ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                            : 'bg-slate-900 text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                        }`}
                        title="Mark Table Yellow (Occupied)"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        <span>Occupied</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSetTableColorStatus(table.id, table.tableNumber, 'cleaning')
                        }
                        className={`flex items-center justify-center gap-1 rounded-lg py-1 px-1.5 text-[10px] font-bold transition ${
                          isRed
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-slate-900 text-slate-400 hover:text-rose-300 hover:bg-slate-800'
                        }`}
                        title="Mark Table Red (Needs Cleaning)"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        <span>Cleaning</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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

                        <td className="px-4 py-4">
                          {(() => {
                            const matchedMonitor = monitoredTables.find(
                              m =>
                                m.table.id === order.tableId ||
                                m.table.tableNumber === order.tableNumber
                            );
                            const tState = matchedMonitor?.colorState || 'occupied';
                            return (
                              <div className="space-y-1">
                                <span className="font-extrabold text-white block">
                                  Table #{order.tableNumber}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${
                                    tState === 'empty'
                                      ? 'text-emerald-400'
                                      : tState === 'cleaning'
                                      ? 'text-rose-400'
                                      : 'text-amber-400'
                                  }`}
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      tState === 'empty'
                                        ? 'bg-emerald-500'
                                        : tState === 'cleaning'
                                        ? 'bg-rose-500 animate-pulse'
                                        : 'bg-amber-400'
                                    }`}
                                  />
                                  <span>
                                    {tState === 'empty'
                                      ? 'Empty'
                                      : tState === 'cleaning'
                                      ? 'Needs Cleaning'
                                      : 'Occupied'}
                                  </span>
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="px-4 py-4 font-bold text-slate-200">
                          {order.customerName}
                          <p className="text-[10px] text-slate-500 font-normal">
                            {order.diningOption === 'dine_in' ? 'Dine In' : 'Takeout'}
                          </p>
                          {order.feedback && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span>{order.feedback.rating}/5</span>
                              {order.feedback.comment && (
                                <span className="text-slate-400 font-normal truncate max-w-[120px]">
                                  · &ldquo;{order.feedback.comment}&rdquo;
                                </span>
                              )}
                            </div>
                          )}
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
                              Note: &ldquo;{order.notes}&rdquo;
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4 font-black text-emerald-400">₱{order.total.toFixed(2)}</td>

                        {/* Payment Status Pill */}
                        <td className="px-4 py-4">
                          {order.paymentStatus === 'unpaid' ? (
                            <button
                              onClick={() => openPaymentModal(order)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition bg-amber-950 text-amber-400 border border-amber-800 hover:bg-amber-900"
                              title="Click to process payment and generate summarized receipt"
                            >
                              ⌛ Unpaid • Pay
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenSummarizedReceipt(order)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900"
                              title="Payment Verified — View Summarized Receipt"
                            >
                              ✓ Paid
                            </button>
                          )}
                        </td>

                        {/* Order Status Pill */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              order.status === 'completed'
                                ? 'bg-emerald-950 text-emerald-400'
                                : order.status === 'cancelled'
                                ? 'bg-red-950 text-red-400'
                                : order.status === 'ready'
                                ? 'bg-sky-950 text-sky-400 animate-pulse'
                                : 'bg-amber-950 text-amber-400'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {order.paymentStatus === 'unpaid' && order.status !== 'cancelled' && (
                              <button
                                onClick={() => openPaymentModal(order)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs"
                                title="Process Payment & Generate Summarized Receipt"
                              >
                                <Banknote className="h-3.5 w-3.5" />
                                <span>Process Payment</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenSummarizedReceipt(order)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1"
                              title="View Printable Summarized Receipt"
                            >
                              <Printer className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Summary Receipt</span>
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
        <SalesReportSection orders={orders} userName={activeCashier.name} role="Cashier" />
      )}

      {/* Payment Processing Modal (Generates Summarized Printable Receipt upon completion) */}
      {paymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Process Order Payment</h3>
                  <p className="text-[11px] text-slate-400">
                    {paymentModalOrder.id} • Table #{paymentModalOrder.tableNumber} ({paymentModalOrder.customerName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalOrder(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Order Bill Summary */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Items ({paymentModalOrder.items.reduce((s, i) => s + i.quantity, 0)} qty)</span>
                <span>₱{paymentModalOrder.subtotal.toFixed(2)}</span>
              </div>
              {paymentModalOrder.discount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span>Discount</span>
                  <span>-₱{paymentModalOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tax (10%)</span>
                <span>₱{paymentModalOrder.tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-base font-black text-white">
                <span>Amount Due</span>
                <span className="text-emerald-400">₱{paymentModalOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              {/* Payment Method Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMethod('gcash');
                      setAmountTenderedInput(paymentModalOrder.total.toFixed(2));
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition ${
                      selectedMethod === 'gcash'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>GCash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMethod('paymaya');
                      setAmountTenderedInput(paymentModalOrder.total.toFixed(2));
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition ${
                      selectedMethod === 'paymaya'
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    <span>PayMaya</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('cash_on_hand')}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-bold transition ${
                      selectedMethod === 'cash_on_hand'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                    <span>Cash on Hand</span>
                  </button>
                </div>
              </div>

              {/* Amount Tendered & Change Calculator */}
              {selectedMethod === 'cash_on_hand' && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Cash Tendered (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={paymentModalOrder.total}
                    value={amountTenderedInput}
                    onChange={e => setAmountTenderedInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-black text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      paymentModalOrder.total,
                      Math.ceil(paymentModalOrder.total / 10) * 10,
                      50,
                      100,
                      200,
                      500,
                    ]
                      .filter((v, i, arr) => v >= paymentModalOrder.total && arr.indexOf(v) === i)
                      .slice(0, 4)
                      .map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmountTenderedInput(preset.toFixed(2))}
                          className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400"
                        >
                          ₱{preset.toFixed(2)}
                        </button>
                      ))}
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-emerald-950/50 border border-emerald-800/60 px-3 py-2 text-xs">
                    <span className="font-bold text-emerald-300">Change Due:</span>
                    <span className="font-black text-sm text-emerald-400">
                      ₱
                      {Math.max(
                        0,
                        (parseFloat(amountTenderedInput) || paymentModalOrder.total) -
                          paymentModalOrder.total
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOrder(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-black text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 active:scale-95 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Complete Payment &amp; Print Summary</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Summarized / Detailed Receipt Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        cashierName={activeCashier.name}
        defaultView={receiptDefaultView}
        paymentDetails={
          selectedReceiptOrder && lastPaymentDetails?.orderId === selectedReceiptOrder.id
            ? lastPaymentDetails
            : null
        }
      />
    </div>
  );
};
