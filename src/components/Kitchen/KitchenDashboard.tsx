import React, { useState, useEffect, useMemo } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Order, OrderItem } from '../../types';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Bell,
  Volume2,
  VolumeX,
  Flame,
  Timer,
  ArrowUpDown,
  RotateCcw,
  FastForward,
  CheckSquare,
  Square,
  CalendarClock,
} from 'lucide-react';
import { playChime } from '../../utils/audio';

type UrgencyTier = 'normal' | 'warning' | 'critical';

export const KitchenDashboard: React.FC = () => {
  const {
    orders,
    products,
    updateOrderStatus,
    adjustOrderWaitTime,
    soundEnabled,
    setSoundEnabled,
    waiterRequests,
    resolveWaiterRequest,
  } = useOrderContext();

  const [statusFilter, setStatusFilter] = useState<'active' | 'pending' | 'preparing' | 'ready'>('active');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | UrgencyTier>('all');
  const [sortByWait, setSortByWait] = useState<'longest' | 'newest'>('longest');
  const [completedItemKeys, setCompletedItemKeys] = useState<Record<string, boolean>>({});
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Live 1-second interval timer for real-time order and item pending duration
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleItemPlated = (orderId: string, itemKey: string) => {
    const composite = `${orderId}:${itemKey}`;
    setCompletedItemKeys(prev => ({
      ...prev,
      [composite]: !prev[composite],
    }));
  };

  const isItemPlated = (orderId: string, itemKey: string) => {
    return Boolean(completedItemKeys[`${orderId}:${itemKey}`]);
  };

  // Elapsed seconds & formatted MM:SS (or HH:MM:SS)
  const getElapsedSeconds = (createdAtIso: string) => {
    const diffMs = Math.max(0, nowMs - new Date(createdAtIso).getTime());
    return Math.floor(diffMs / 1000);
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Order-level urgency classification (<10m Normal, 10-15m Warning, >=15m Critical)
  const getOrderUrgency = (elapsedSeconds: number, status: Order['status']): UrgencyTier => {
    if (status === 'ready') {
      const elapsedMins = elapsedSeconds / 60;
      if (elapsedMins >= 20) return 'warning';
      return 'normal';
    }
    const elapsedMins = elapsedSeconds / 60;
    if (elapsedMins >= 15) return 'critical';
    if (elapsedMins >= 10) return 'warning';
    return 'normal';
  };

  // Item-level prep time lookup & wait urgency
  const getProductPrepMinutes = (productId: string): number => {
    const found = products.find(p => p.id === productId);
    return found?.prepTimeMinutes ?? 10;
  };

  const getItemUrgency = (
    elapsedSeconds: number,
    targetPrepMinutes: number,
    plated: boolean,
    orderStatus: Order['status']
  ): {
    tier: UrgencyTier;
    elapsedMins: number;
    overMinutes: number;
    label: string;
  } => {
    const elapsedMins = Math.floor(elapsedSeconds / 60);
    if (plated || orderStatus === 'ready') {
      return {
        tier: 'normal',
        elapsedMins,
        overMinutes: 0,
        label: 'Ready / Plated',
      };
    }

    const overMinutes = elapsedMins - targetPrepMinutes;
    if (elapsedMins > targetPrepMinutes || elapsedMins >= 15) {
      return {
        tier: 'critical',
        elapsedMins,
        overMinutes: Math.max(1, overMinutes),
        label:
          overMinutes > 0
            ? `LONG WAIT (+${overMinutes}m over ${targetPrepMinutes}m target)`
            : `LONG WAIT (${elapsedMins}m pending)`,
      };
    }

    if (elapsedMins >= Math.ceil(targetPrepMinutes * 0.75) || elapsedMins >= 10) {
      return {
        tier: 'warning',
        elapsedMins,
        overMinutes: 0,
        label: `Approaching SLA (${elapsedMins}m / ${targetPrepMinutes}m)`,
      };
    }

    return {
      tier: 'normal',
      elapsedMins,
      overMinutes: 0,
      label: `On Track (${elapsedMins}m / ${targetPrepMinutes}m target)`,
    };
  };

  // Low stock & out of stock items calculation
  const lowStockProducts = products.filter(p => {
    const qty = p.stockQuantity ?? (p.inStock ? 10 : 0);
    const threshold = p.lowStockThreshold ?? 5;
    return !p.inStock || qty <= threshold;
  });

  // Base active kitchen orders
  const allActiveOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  }, [orders]);

  // Aggregate long-waiting items across all active orders for the top alert monitor
  const longWaitingItemsSummary = useMemo(() => {
    const list: {
      orderId: string;
      tableNumber: string;
      orderStatus: Order['status'];
      item: OrderItem;
      itemKey: string;
      elapsedSeconds: number;
      targetPrepMinutes: number;
      overMinutes: number;
      tier: 'warning' | 'critical';
    }[] = [];

    allActiveOrders.forEach(order => {
      if (order.status === 'ready') return;
      const elapsedSeconds = getElapsedSeconds(order.createdAt);
      order.items.forEach((item, idx) => {
        const itemKey = item.id || String(idx);
        const plated = isItemPlated(order.id, itemKey);
        if (plated) return;
        const targetPrepMinutes = getProductPrepMinutes(item.productId);
        const itemStatus = getItemUrgency(elapsedSeconds, targetPrepMinutes, plated, order.status);
        if (itemStatus.tier === 'critical' || itemStatus.tier === 'warning') {
          list.push({
            orderId: order.id,
            tableNumber: order.tableNumber,
            orderStatus: order.status,
            item,
            itemKey,
            elapsedSeconds,
            targetPrepMinutes,
            overMinutes: itemStatus.overMinutes,
            tier: itemStatus.tier,
          });
        }
      });
    });

    return list.sort((a, b) => b.elapsedSeconds - a.elapsedSeconds);
  }, [allActiveOrders, nowMs, completedItemKeys, products]);

  // Urgency counts across all active orders
  const urgencyCounts = useMemo(() => {
    let normal = 0;
    let warning = 0;
    let critical = 0;
    let totalSeconds = 0;

    allActiveOrders.forEach(order => {
      const secs = getElapsedSeconds(order.createdAt);
      totalSeconds += secs;
      const u = getOrderUrgency(secs, order.status);
      if (u === 'critical') critical++;
      else if (u === 'warning') warning++;
      else normal++;
    });

    const avgSeconds = allActiveOrders.length > 0 ? Math.round(totalSeconds / allActiveOrders.length) : 0;
    return { normal, warning, critical, avgSeconds };
  }, [allActiveOrders, nowMs]);

  // Filtered and sorted orders for the ticket grid
  const displayedOrders = useMemo(() => {
    const filtered = allActiveOrders.filter(o => {
      if (statusFilter !== 'active' && o.status !== statusFilter) return false;
      if (urgencyFilter !== 'all') {
        const secs = getElapsedSeconds(o.createdAt);
        const u = getOrderUrgency(secs, o.status);
        if (u !== urgencyFilter) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      // Longest waiting first = oldest createdAt first
      return sortByWait === 'longest' ? aTime - bTime : bTime - aTime;
    });
  }, [allActiveOrders, statusFilter, urgencyFilter, sortByWait, nowMs]);

  const pendingCount = allActiveOrders.filter(o => o.status === 'pending').length;
  const preparingCount = allActiveOrders.filter(o => o.status === 'preparing').length;
  const readyCount = allActiveOrders.filter(o => o.status === 'ready').length;

  const activeWaiterRequests = waiterRequests.filter(r => !r.resolved);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-4 md:p-6 space-y-5">
      {/* KDS Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Kitchen Display System (KDS)</span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                LIVE TIMER · {new Date(nowMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time order pending timers &amp; color-coded SLA alerts for long-waiting dishes
            </p>
          </div>
        </div>

        {/* Status Filters & Sound Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              statusFilter === 'active'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Active ({allActiveOrders.length})
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('preparing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              statusFilter === 'preparing'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Preparing ({preparingCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              statusFilter === 'ready'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Ready ({readyCount})</span>
          </button>

          <button
            onClick={() => setSortByWait(prev => (prev === 'longest' ? 'newest' : 'longest'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition"
            title="Toggle ticket sort order"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
            <span>{sortByWait === 'longest' ? 'Longest Wait First' : 'Newest First'}</span>
          </button>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime('new_order');
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            title="Kitchen Sound Alert"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Live Order Timer SLA Monitor & Color-Coded Urgency Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Average Wait Time KPI */}
        <button
          onClick={() => setUrgencyFilter('all')}
          className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
            urgencyFilter === 'all'
              ? 'bg-slate-900 border-slate-600 ring-2 ring-slate-500/30'
              : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Avg Kitchen Wait Time
            </p>
            <p className="mt-1 text-2xl font-mono font-black text-white">
              {formatTimer(urgencyCounts.avgSeconds)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {allActiveOrders.length} active {allActiveOrders.length === 1 ? 'ticket' : 'tickets'} · Click for all
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-200">
            <Timer className="h-5 w-5" />
          </div>
        </button>

        {/* Green: On Track (<10m) */}
        <button
          onClick={() => setUrgencyFilter(prev => (prev === 'normal' ? 'all' : 'normal'))}
          className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
            urgencyFilter === 'normal'
              ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-emerald-950/30 border-emerald-800/60 hover:border-emerald-600'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              On Track (&lt; 10 mins)
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-300">
              {urgencyCounts.normal} {urgencyCounts.normal === 1 ? 'Order' : 'Orders'}
            </p>
            <p className="mt-0.5 text-[11px] text-emerald-400/80">Within target prep SLA</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </button>

        {/* Amber: Warning / Aging (10-15m) */}
        <button
          onClick={() => setUrgencyFilter(prev => (prev === 'warning' ? 'all' : 'warning'))}
          className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
            urgencyFilter === 'warning'
              ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-amber-950/30 border-amber-800/60 hover:border-amber-600'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Aging Warning (10–15 mins)
            </p>
            <p className="mt-1 text-2xl font-black text-amber-300">
              {urgencyCounts.warning} {urgencyCounts.warning === 1 ? 'Order' : 'Orders'}
            </p>
            <p className="mt-0.5 text-[11px] text-amber-400/80">Approaching max wait threshold</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="h-5 w-5" />
          </div>
        </button>

        {/* Red: Critical Long-Waiting (>15m) */}
        <button
          onClick={() => setUrgencyFilter(prev => (prev === 'critical' ? 'all' : 'critical'))}
          className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition ${
            urgencyFilter === 'critical'
              ? 'bg-rose-950/90 border-rose-500 ring-2 ring-rose-500/40'
              : urgencyCounts.critical > 0
              ? 'bg-rose-950/50 border-rose-700/80 hover:border-rose-500'
              : 'bg-slate-900/70 border-slate-800'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Critical Long-Wait (&gt; 15 mins)
            </p>
            <p className="mt-1 text-2xl font-black text-rose-300">
              {urgencyCounts.critical} {urgencyCounts.critical === 1 ? 'Order' : 'Orders'}
            </p>
            <p className="mt-0.5 text-[11px] text-rose-400/80">
              {longWaitingItemsSummary.filter(i => i.tier === 'critical').length} overdue items waiting
            </p>
          </div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
              urgencyCounts.critical > 0
                ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Flame className="h-5 w-5" />
          </div>
        </button>
      </div>

      {/* Color-Coded Alert Banner for Long-Waiting Individual Items */}
      {longWaitingItemsSummary.length > 0 && (
        <div className="rounded-2xl border border-rose-500/60 bg-rose-950/60 p-4 shadow-xl space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-200 font-black text-xs uppercase tracking-wider">
              <Flame className="h-4 w-4 text-rose-400 animate-bounce" />
              <span>
                Long-Waiting Items Alert ({longWaitingItemsSummary.length}{' '}
                {longWaitingItemsSummary.length === 1 ? 'dish requires' : 'dishes require'} priority attention)
              </span>
            </div>
            <span className="text-[11px] text-rose-300">
              Click any item on a ticket below to mark it plated &amp; clear its alert
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {longWaitingItemsSummary.map((entry, idx) => {
              const isCrit = entry.tier === 'critical';
              return (
                <div
                  key={`${entry.orderId}-${entry.itemKey}-${idx}`}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${
                    isCrit
                      ? 'bg-rose-950/95 border-rose-500/80 text-rose-100'
                      : 'bg-amber-950/90 border-amber-500/70 text-amber-100'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-extrabold">
                      <span
                        className={`inline-block h-2 w-2 rounded-full shrink-0 ${
                          isCrit ? 'bg-rose-400 animate-ping' : 'bg-amber-400'
                        }`}
                      />
                      <span className="truncate">
                        {entry.item.quantity}x {entry.item.productName}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-85 mt-0.5">
                      Table #{entry.tableNumber} · #{entry.orderId} · Target {entry.targetPrepMinutes}m
                      {entry.overMinutes > 0 ? ` (+${entry.overMinutes}m overdue)` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-mono font-black text-xs px-2 py-1 rounded-lg border ${
                        isCrit
                          ? 'bg-rose-900/90 border-rose-400/60 text-rose-200'
                          : 'bg-amber-900/80 border-amber-400/60 text-amber-200'
                      }`}
                    >
                      {formatTimer(entry.elapsedSeconds)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleItemPlated(entry.orderId, entry.itemKey)}
                      className="rounded-lg bg-white/10 hover:bg-emerald-600 px-2 py-1 text-[10px] font-black text-white transition"
                      title="Mark this item plated"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kitchen Low Stock Warning Notification Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-950/80 border border-amber-500/50 p-3.5 rounded-2xl shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Inventory Stock Notice ({lowStockProducts.length} items)</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map(p => {
              const qty = p.stockQuantity ?? (p.inStock ? 10 : 0);
              const isOut = !p.inStock || qty <= 0;

              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 text-xs px-3 py-1 rounded-xl border font-bold ${
                    isOut
                      ? 'bg-rose-950/90 text-rose-200 border-rose-600/80'
                      : 'bg-amber-950/90 text-amber-100 border-amber-600/80'
                  }`}
                >
                  <span>{isOut ? 'OUT OF STOCK:' : 'LOW STOCK:'}</span>
                  <span className="font-extrabold">{p.name}</span>
                  <span className="text-[10px] font-mono opacity-80">
                    ({isOut ? '0 left' : `${qty} left`})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Waiter Floor Requests Bar if any */}
      {activeWaiterRequests.length > 0 && (
        <div className="bg-purple-950/80 border border-purple-800/80 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
            <Bell className="h-4 w-4 text-purple-400" />
            <span>Active Floor &amp; Water Requests:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeWaiterRequests.map(req => (
              <div
                key={req.id}
                className="flex items-center gap-2 bg-purple-900/90 text-white text-xs px-3 py-1.5 rounded-xl border border-purple-700"
              >
                <span className="font-extrabold">Table #{req.tableNumber}</span>
                <span className="uppercase text-[10px] text-purple-200">({req.type})</span>
                <button
                  onClick={() => resolveWaiterRequest(req.id)}
                  className="ml-1 bg-purple-800 hover:bg-purple-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg"
                >
                  Done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 opacity-60" />
            <h3 className="text-base font-bold text-slate-300">No Matching Kitchen Tickets</h3>
            <p className="text-xs text-slate-500">
              All active orders for this filter have been cleared or completed.
            </p>
            {urgencyFilter !== 'all' && (
              <button
                onClick={() => setUrgencyFilter('all')}
                className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
              >
                Show All Active Orders
              </button>
            )}
          </div>
        ) : (
          displayedOrders.map(order => {
            const elapsedSeconds = getElapsedSeconds(order.createdAt);
            const elapsedMins = Math.floor(elapsedSeconds / 60);
            const urgency = getOrderUrgency(elapsedSeconds, order.status);
            // SLA progress bar percentage (15 min = 900s benchmark)
            const slaProgressPct = Math.min(100, Math.round((elapsedSeconds / 900) * 100));

            const cardBorderClasses =
              order.status === 'ready'
                ? 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                : urgency === 'critical'
                ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-rose-950/50'
                : urgency === 'warning'
                ? 'border-amber-500/90 ring-2 ring-amber-500/25'
                : 'border-emerald-500/60';

            const timerBoxClasses =
              order.status === 'ready'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : urgency === 'critical'
                ? 'bg-rose-950 text-rose-200 border-rose-500 animate-pulse'
                : urgency === 'warning'
                ? 'bg-amber-950 text-amber-200 border-amber-500'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60';

            const urgencyLabel =
              order.status === 'ready'
                ? 'READY TO SERVE'
                : urgency === 'critical'
                ? 'OVERDUE · LONG WAIT'
                : urgency === 'warning'
                ? 'AGING · HURRY'
                : 'ON TRACK';

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-2xl border bg-slate-900 p-4 shadow-xl transition-all ${cardBorderClasses}`}
              >
                <div>
                  {/* Top Color-Coded Urgency Status Banner */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          order.status === 'ready'
                            ? 'bg-emerald-400'
                            : urgency === 'critical'
                            ? 'bg-rose-500 animate-ping'
                            : urgency === 'warning'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-emerald-400'
                        }`}
                      />
                      <span
                        className={
                          order.status === 'ready'
                            ? 'text-emerald-400'
                            : urgency === 'critical'
                            ? 'text-rose-400'
                            : urgency === 'warning'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {urgencyLabel}
                      </span>
                    </div>

                    {/* Quick Time Simulation Controls for testing timer alerts */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustOrderWaitTime(order.id, 5)}
                        className="flex items-center gap-0.5 rounded-md bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700 transition"
                        title="Simulate +5 minutes elapsed wait time"
                      >
                        <FastForward className="h-2.5 w-2.5 text-amber-400" />
                        <span>+5m</span>
                      </button>
                      {elapsedMins >= 5 && (
                        <button
                          type="button"
                          onClick={() => adjustOrderWaitTime(order.id, -elapsedMins)}
                          className="flex items-center gap-0.5 rounded-md bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700 transition"
                          title="Reset order timer to 00:10"
                        >
                          <RotateCcw className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Ticket Header & Live Ticking Stopwatch */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                        <span>#{order.id}</span>
                        <span>·</span>
                        <span className="uppercase">
                          {order.diningOption === 'dine_in' ? 'Dine In' : 'Takeout'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white mt-0.5">
                        TABLE #{order.tableNumber}
                      </h3>
                      <p className="text-[11px] text-slate-400">{order.customerName}</p>
                    </div>

                    {/* Live Ticking Stopwatch Box */}
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-sm font-black shadow-xs ${timerBoxClasses}`}
                      >
                        <Clock className="h-4 w-4 shrink-0" />
                        <span>{formatTimer(elapsedSeconds)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Pending {elapsedMins} {elapsedMins === 1 ? 'min' : 'mins'}
                      </p>
                    </div>
                  </div>

                  {/* Visual SLA Progress Bar */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>Kitchen SLA Target (15:00)</span>
                      <span
                        className={
                          urgency === 'critical'
                            ? 'text-rose-400 font-bold'
                            : urgency === 'warning'
                            ? 'text-amber-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }
                      >
                        {slaProgressPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          order.status === 'ready'
                            ? 'bg-emerald-500'
                            : urgency === 'critical'
                            ? 'bg-rose-500'
                            : urgency === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${slaProgressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Scheduled Order Notice if applicable */}
                  {order.isScheduled && order.scheduledFor && (
                    <div className="mt-2.5 rounded-xl bg-sky-950/70 p-2 text-xs font-bold text-sky-300 border border-sky-700/60 flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4 shrink-0 text-sky-400" />
                      <span>Scheduled Prep: {order.scheduledFor}</span>
                    </div>
                  )}

                  {/* Special Ticket Notes */}
                  {order.notes && (
                    <div className="mt-2.5 rounded-xl bg-amber-950/60 p-2 text-xs font-bold text-amber-300 border border-amber-800/60 flex items-start gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>Note: &ldquo;{order.notes}&rdquo;</span>
                    </div>
                  )}

                  {/* Order Items with Individual Color-Coded Long-Wait Alerts */}
                  <div className="my-3 space-y-2">
                    {order.items.map((item, idx) => {
                      const itemKey = item.id || String(idx);
                      const plated = isItemPlated(order.id, itemKey);
                      const targetPrepMinutes = getProductPrepMinutes(item.productId);
                      const itemAlert = getItemUrgency(
                        elapsedSeconds,
                        targetPrepMinutes,
                        plated,
                        order.status
                      );

                      const itemRowClass = plated
                        ? 'bg-slate-950/50 border-slate-800/80 opacity-60'
                        : itemAlert.tier === 'critical'
                        ? 'bg-rose-950/50 border-rose-500/80'
                        : itemAlert.tier === 'warning'
                        ? 'bg-amber-950/40 border-amber-500/70'
                        : 'bg-slate-950/70 border-slate-800';

                      return (
                        <div
                          key={itemKey}
                          onClick={() => toggleItemPlated(order.id, itemKey)}
                          className={`rounded-xl border p-2.5 transition cursor-pointer select-none space-y-1.5 ${itemRowClass}`}
                          title="Click to toggle item plated status"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 min-w-0">
                              <button
                                type="button"
                                className="mt-0.5 text-slate-400 hover:text-emerald-400 shrink-0"
                              >
                                {plated ? (
                                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>
                              <span className="flex h-5 w-6 items-center justify-center rounded-md bg-slate-800 text-xs font-black text-amber-400 shrink-0">
                                {item.quantity}x
                              </span>
                              <span
                                className={`font-bold text-sm leading-snug ${
                                  plated ? 'line-through text-slate-400' : 'text-white'
                                }`}
                              >
                                {item.productName}
                              </span>
                            </div>
                          </div>

                          {/* Color-Coded Item Wait Status Line */}
                          <div className="pl-6 flex flex-wrap items-center justify-between gap-1 text-[10px] font-bold">
                            <span
                              className={
                                plated
                                  ? 'text-emerald-400'
                                  : itemAlert.tier === 'critical'
                                  ? 'text-rose-300 font-black flex items-center gap-1'
                                  : itemAlert.tier === 'warning'
                                  ? 'text-amber-300 font-extrabold'
                                  : 'text-emerald-400/90'
                              }
                            >
                              {itemAlert.tier === 'critical' && !plated && (
                                <Flame className="h-3 w-3 text-rose-400 shrink-0" />
                              )}
                              {itemAlert.label}
                            </span>

                            <span className="font-mono text-slate-400">
                              SLA {targetPrepMinutes}m
                            </span>
                          </div>

                          {/* Modifiers List */}
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div className="pl-6 text-xs font-semibold text-emerald-400 space-y-0.5">
                              {item.modifiers.map((m, mi) => (
                                <div key={mi} className="flex items-center gap-1">
                                  <span className="text-[10px]">·</span>
                                  <span>{m.optionName}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.notes && (
                            <p className="pl-6 text-xs italic text-amber-300">
                              &ldquo;{item.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Footer Action Buttons (Kitchen Status Changer) */}
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Kitchen Order Status Changer
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400">
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1">
                    {(['pending', 'accepted', 'preparing', 'ready', 'completed'] as OrderStatus[]).map(
                      st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateOrderStatus(order.id, st)}
                          className={`rounded-lg py-1.5 px-1 text-[9px] font-black uppercase tracking-tight transition ${
                            order.status === st
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                              : 'bg-slate-800/90 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {st === 'preparing' ? 'Cooking' : st === 'completed' ? 'Done' : st}
                        </button>
                      )
                    )}
                  </div>

                  {(order.status === 'pending' || order.status === 'accepted') && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 active:scale-95"
                    >
                      <Play className="h-4 w-4 fill-slate-950" />
                      <span>Start Cooking (Mark Preparing)</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark Ready to Serve</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                    >
                      <span>Mark Complete &amp; Release Table</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
