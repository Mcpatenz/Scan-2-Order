import React, { useEffect, useRef, useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Order, OrderStatus } from '../../types';
import {
  BellRing,
  CheckCircle2,
  X,
  Utensils,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { playChime } from '../../utils/audio';

export interface SimulatedPushPayload {
  id: string;
  orderId: string;
  tableNumber: string;
  customerName: string;
  diningOption: 'dine_in' | 'takeout';
  itemsSummary: string;
  timestamp: string;
}

export const MobilePushNotification: React.FC = () => {
  const {
    orders,
    activeTable,
    isTableSelected,
    soundEnabled,
  } = useOrderContext();

  const [activePush, setActivePush] = useState<SimulatedPushPayload | null>(null);
  const [pushHistory, setPushHistory] = useState<SimulatedPushPayload[]>([]);
  const [trayOpen, setTrayOpen] = useState(false);

  const prevStatusMapRef = useRef<Map<string, OrderStatus>>(new Map());
  const isInitialMountRef = useRef(true);

  const buildPushPayload = (order: Order): SimulatedPushPayload => {
    const summary = order.items
      .map(i => `${i.quantity}x ${i.productName}`)
      .join(', ');
    return {
      id: `push-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      orderId: order.id,
      tableNumber: order.tableNumber,
      customerName: order.customerName || 'Guest',
      diningOption: order.diningOption,
      itemsSummary: summary,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const triggerPushBanner = (payload: SimulatedPushPayload) => {
    setActivePush(payload);
    setPushHistory(prev => [payload, ...prev.filter(p => p.orderId !== payload.orderId)].slice(0, 8));

    if (soundEnabled) {
      playChime('order_ready');
    }

    // Also attempt Web Notification API if granted
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Order #${payload.orderId} is Ready for Pickup!`, {
          body: `Table #${payload.tableNumber}: ${payload.itemsSummary} is hot and ready for pickup at the counter.`,
        });
      }
    } catch {
      // Ignore browser notification restrictions inside iframe
    }
  };

  // Listen for custom simulated push events (e.g. from OrderTracker "Test Push Alert" button)
  useEffect(() => {
    const handleCustomPush = (e: Event) => {
      const customEvent = e as CustomEvent<SimulatedPushPayload>;
      if (customEvent.detail) {
        triggerPushBanner(customEvent.detail);
      }
    };
    window.addEventListener('dineflow-simulate-push', handleCustomPush);
    return () => {
      window.removeEventListener('dineflow-simulate-push', handleCustomPush);
    };
  }, [soundEnabled]);

  // Automatically detect when any order on the customer's table (or any active order) updates to 'ready'
  useEffect(() => {
    if (isInitialMountRef.current) {
      const initMap = new Map<string, OrderStatus>();
      orders.forEach(o => initMap.set(o.id, o.status));
      prevStatusMapRef.current = initMap;
      isInitialMountRef.current = false;
      return;
    }

    const prevMap = prevStatusMapRef.current;

    orders.forEach(order => {
      const prevStatus = prevMap.get(order.id);
      const isRelevantToCustomer =
        !isTableSelected ||
        order.tableId === activeTable.id ||
        order.tableNumber === activeTable.tableNumber;

      if (prevStatus && prevStatus !== 'ready' && order.status === 'ready' && isRelevantToCustomer) {
        const payload = buildPushPayload(order);
        triggerPushBanner(payload);
      }
      prevMap.set(order.id, order.status);
    });
  }, [orders, activeTable.id, activeTable.tableNumber, isTableSelected, soundEnabled]);

  // Auto-dismiss active push banner after 8 seconds
  useEffect(() => {
    if (!activePush) return;
    const timer = setTimeout(() => {
      setActivePush(null);
    }, 8500);
    return () => clearTimeout(timer);
  }, [activePush]);

  if (!activePush && !trayOpen) {
    return null;
  }

  return (
    <div className="sticky top-2 z-50 px-3 pt-1 pointer-events-none">
      {activePush && (
        <div
          role="alert"
          aria-live="assertive"
          className="pointer-events-auto relative overflow-hidden rounded-3xl border-2 border-emerald-400/80 bg-slate-950/95 p-3.5 text-white shadow-[0_14px_40px_rgba(16,185,129,0.35)] backdrop-blur-xl animate-slideDown"
        >
          {/* Ambient Emerald Glow */}
          <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/25 blur-2xl" />

          {/* Top App Notification Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 shadow-sm">
                <Utensils className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 truncate">
                DINEFLOW QR • PUSH NOTIFICATION
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] font-bold text-emerald-300">
                <Volume2 className="h-2.5 w-2.5" /> now
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActivePush(null)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              aria-label="Dismiss push notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Main Push Content */}
          <div className="mt-2.5 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 animate-bounce">
              <BellRing className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950">
                  Ready for Pickup
                </span>
                <h4 className="text-xs font-black text-white truncate">
                  Order #{activePush.orderId} • Table #{activePush.tableNumber}
                </h4>
              </div>

              <p className="mt-1 text-[11px] font-semibold text-emerald-200 leading-snug">
                🎉 Good news, {activePush.customerName}! Your order is freshly prepared and{' '}
                <span className="underline decoration-emerald-400 font-black">
                  Ready for Pickup
                </span>
                !
              </p>

              <p className="mt-1 text-[10px] text-slate-300 line-clamp-1">
                Items: {activePush.itemsSummary}
              </p>
            </div>
          </div>

          {/* Push Action Buttons */}
          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/90">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <Sparkles className="h-3 w-3" />
              Proceed to Pickup Counter or await server
            </span>

            <button
              type="button"
              onClick={() => setActivePush(null)}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-1 text-[10px] font-black text-slate-950 transition active:scale-95 shrink-0"
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Got It</span>
            </button>
          </div>
        </div>
      )}

      {trayOpen && pushHistory.length > 0 && (
        <div className="pointer-events-auto mt-2 rounded-2xl border border-slate-800 bg-slate-950/95 p-3 text-white shadow-xl backdrop-blur-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Recent Push Alerts ({pushHistory.length})
            </span>
            <button
              type="button"
              onClick={() => setTrayOpen(false)}
              className="text-[10px] font-bold text-emerald-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
