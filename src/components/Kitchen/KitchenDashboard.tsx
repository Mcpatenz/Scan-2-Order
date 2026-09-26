import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { OrderStatus } from '../../types';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Bell,
  Volume2,
  VolumeX,
  Filter,
  Utensils,
} from 'lucide-react';
import { playChime } from '../../utils/audio';

export const KitchenDashboard: React.FC = () => {
  const {
    orders,
    products,
    updateOrderStatus,
    soundEnabled,
    setSoundEnabled,
    waiterRequests,
    resolveWaiterRequest,
  } = useOrderContext();

  const [filter, setFilter] = useState<'active' | 'pending' | 'preparing' | 'ready'>('active');

  // Low stock & out of stock items calculation
  const lowStockProducts = products.filter(p => {
    const qty = p.stockQuantity ?? (p.inStock ? 10 : 0);
    const threshold = p.lowStockThreshold ?? 5;
    return !p.inStock || qty <= threshold;
  });

  // Filter kitchen active orders
  const activeOrders = orders.filter(o => {
    if (o.status === 'completed' || o.status === 'cancelled') return false;
    if (filter === 'active') return true;
    return o.status === filter;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  const activeWaiterRequests = waiterRequests.filter(r => !r.resolved);

  // Helper for elapsed time calculation
  const getElapsedMinutes = (createdAtIso: string) => {
    const diff = Date.now() - new Date(createdAtIso).getTime();
    return Math.floor(diff / (1000 * 60));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* KDS Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Kitchen Display System (KDS)
            </h2>
            <p className="text-xs text-slate-400">Live Culinary Preparation Workflow</p>
          </div>
        </div>

        {/* Status Counters & Chime Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              filter === 'active' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Active ({pendingCount + preparingCount + readyCount})
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              filter === 'pending' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Pending</span>
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px]">{pendingCount}</span>
          </button>

          <button
            onClick={() => setFilter('preparing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              filter === 'preparing' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Preparing</span>
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px]">{preparingCount}</span>
          </button>

          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              filter === 'ready' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Ready</span>
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px]">{readyCount}</span>
          </button>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime('new_order');
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            title="Kitchen Sound Alert"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Kitchen Low Stock Warning Notification Banner */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-950/90 border border-amber-500/60 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>Kitchen Alert: Low Stock & Out of Stock Menu Items ({lowStockProducts.length})</span>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-md font-extrabold uppercase">
              Inventory Alert
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
                  <span className="font-black">{isOut ? '🔴 OUT OF STOCK:' : '⚠️ LOW STOCK:'}</span>
                  <span className="font-extrabold">{p.name}</span>
                  <span className="text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-md font-mono">
                    {isOut ? '0 units left' : `${qty} left (Alert limit: ${threshold})`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Waiter Floor Requests Bar if any */}
      {activeWaiterRequests.length > 0 && (
        <div className="bg-purple-950/80 border border-purple-800/80 p-4 rounded-2xl space-y-2 animate-pulse">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
            <Bell className="h-4 w-4 text-purple-400" />
            <span>Active Floor & Water Requests:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeWaiterRequests.map(req => (
              <div key={req.id} className="flex items-center gap-2 bg-purple-900/90 text-white text-xs px-3 py-1.5 rounded-xl border border-purple-700">
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
        {activeOrders.length === 0 ? (
          <div className="col-span-full py-24 text-center text-slate-500 space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 opacity-60" />
            <h3 className="text-base font-bold text-slate-300">Kitchen Display is Clear</h3>
            <p className="text-xs text-slate-500">No active tickets matching the current filter.</p>
          </div>
        ) : (
          activeOrders.map(order => {
            const elapsedMins = getElapsedMinutes(order.createdAt);
            const isUrgent = elapsedMins > 15;

            return (
              <div
                key={order.id}
                className={`flex flex-col justify-between rounded-2xl border bg-slate-900 p-4 shadow-xl transition-all ${
                  order.status === 'pending'
                    ? 'border-red-500/80 ring-2 ring-red-500/30'
                    : order.status === 'preparing'
                    ? 'border-amber-500/80 ring-2 ring-amber-500/20'
                    : 'border-emerald-500/80 ring-2 ring-emerald-500/20'
                }`}
              >
                <div>
                  {/* Ticket Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-black tracking-wider text-slate-400">
                        #{order.id}
                      </span>
                      <h3 className="text-xl font-black text-white">
                        TABLE #{order.tableNumber}
                      </h3>
                      <p className="text-[10px] text-slate-400">{order.customerName}</p>
                    </div>

                    <div className="text-right">
                      {/* Timer Badge */}
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black ${
                        isUrgent ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' : 'bg-slate-800 text-slate-300'
                      }`}>
                        <Clock className="h-3.5 w-3.5" /> {elapsedMins}m ago
                      </span>
                      <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                        {order.diningOption === 'dine_in' ? 'Dine In' : 'Takeout'}
                      </p>
                    </div>
                  </div>

                  {/* Special Ticket Notes */}
                  {order.notes && (
                    <div className="my-2.5 rounded-xl bg-amber-950/60 p-2 text-xs font-bold text-amber-300 border border-amber-800/60 flex items-start gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>Note: "{order.notes}"</span>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="my-3 space-y-2.5 divide-y divide-slate-800">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 space-y-1">
                        <div className="flex items-start justify-between font-bold text-sm text-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs font-black text-amber-400">
                              {item.quantity}x
                            </span>
                            <span>{item.productName}</span>
                          </div>
                        </div>

                        {/* Modifiers List */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="pl-8 text-xs font-semibold text-emerald-400 space-y-0.5">
                            {item.modifiers.map((m, mi) => (
                              <div key={mi} className="flex items-center gap-1">
                                <span className="text-[10px]">•</span>
                                <span>{m.optionName}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className="pl-8 text-xs italic text-amber-300">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ticket Footer Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 active:scale-95"
                    >
                      <Play className="h-4 w-4 fill-slate-950" />
                      <span>Start Cooking (Mark Preparing)</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95"
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
                      <span>Mark Complete & Archive</span>
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
