import React, { useState, useEffect, useRef } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { OrderStatus, PaymentMethod } from '../../types';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Bell,
  Receipt,
  GlassWater,
  Sparkles,
  History,
  LogOut,
  Lock,
  Printer,
  BellRing,
} from 'lucide-react';
import { ReceiptModal } from '../Common/ReceiptModal';
import { CallWaiterModal } from '../Common/CallWaiterModal';
import { OrderStatusToast, StatusToastNotification, getStatusMeta } from './OrderStatusToast';
import { SimulatedPushPayload } from './MobilePushNotification';

const formatPaymentMethodName = (method: PaymentMethod): string => {
  switch (method) {
    case 'gcash':
      return 'GCash';
    case 'paymaya':
      return 'PayMaya';
    case 'cash_on_hand':
    case 'cash':
      return 'Cash on Hand';
    default:
      return method.replace(/_/g, ' ').toUpperCase();
  }
};

export const OrderTracker: React.FC = () => {
  const { currentCustomerOrder, exitTableSession, activeTable, updateOrderStatus } = useOrderContext();

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [minsRemaining, setMinsRemaining] = useState<number>(12);

  const handleSimulateReadyPush = () => {
    if (currentCustomerOrder && currentCustomerOrder.status !== 'ready') {
      updateOrderStatus(currentCustomerOrder.id, 'ready');
      return;
    }

    const payload: SimulatedPushPayload = {
      id: `push-${Date.now()}`,
      orderId: currentCustomerOrder?.id || '1042',
      tableNumber: currentCustomerOrder?.tableNumber || activeTable.tableNumber,
      customerName: currentCustomerOrder?.customerName || 'Valued Guest',
      diningOption: currentCustomerOrder?.diningOption || 'dine_in',
      itemsSummary: currentCustomerOrder
        ? currentCustomerOrder.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')
        : '1x Truffle Wagyu Burger, 1x Artisanal Iced Matcha',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    window.dispatchEvent(new CustomEvent('dineflow-simulate-push', { detail: payload }));
  };

  // Status Notification Toast states
  const [activeToast, setActiveToast] = useState<StatusToastNotification | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<StatusToastNotification[]>([]);
  const [showHistoryLog, setShowHistoryLog] = useState(false);

  const prevStatusRef = useRef<{ orderId: string; status: OrderStatus } | null>(null);

  useEffect(() => {
    if (!currentCustomerOrder) {
      prevStatusRef.current = null;
      return;
    }

    const currentId = currentCustomerOrder.id;
    const currentStatus = currentCustomerOrder.status;

    // Detect if status changed from Kitchen Dashboard
    if (
      prevStatusRef.current &&
      prevStatusRef.current.orderId === currentId &&
      prevStatusRef.current.status !== currentStatus
    ) {
      const fromStatus = prevStatusRef.current.status;
      const toStatus = currentStatus;

      const newToast: StatusToastNotification = {
        id: `toast-${Date.now()}`,
        orderId: currentId,
        tableNumber: currentCustomerOrder.tableNumber,
        fromStatus,
        toStatus,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setActiveToast(newToast);
      setNotificationHistory(prev => [newToast, ...prev]);
    }

    prevStatusRef.current = { orderId: currentId, status: currentStatus };
  }, [currentCustomerOrder?.id, currentCustomerOrder?.status]);

  useEffect(() => {
    if (!currentCustomerOrder) return;

    const interval = setInterval(() => {
      setMinsRemaining(prev => Math.max(0, prev - 1));
    }, 60000);

    return () => clearInterval(interval);
  }, [currentCustomerOrder]);

  if (!currentCustomerOrder) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 my-4 shadow-sm">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Clock className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Active Order</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Select items from the menu and submit your order to see live tracking for Table #{activeTable.tableNumber}.
        </p>
        <button
          type="button"
          onClick={handleSimulateReadyPush}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95"
        >
          <BellRing className="h-3.5 w-3.5" />
          <span>Simulate &apos;Ready for Pickup&apos; Push Alert</span>
        </button>
      </div>
    );
  }

  const steps: { status: OrderStatus; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      status: 'pending',
      label: 'Order Sent',
      desc: 'Received by kitchen',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      status: 'accepted',
      label: 'Confirmed',
      desc: 'Accepted in kitchen',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      status: 'preparing',
      label: 'Preparing',
      desc: 'Chef is cooking',
      icon: <ChefHat className="h-4 w-4" />,
    },
    {
      status: 'ready',
      label: 'Ready for Pickup',
      desc: 'Ready at pickup counter / table',
      icon: <Bell className="h-4 w-4 animate-bounce text-emerald-400" />,
    },
    {
      status: 'completed',
      label: 'Served',
      desc: 'Enjoy your meal!',
      icon: <Sparkles className="h-4 w-4 text-emerald-500" />,
    },
  ];

  const statusOrder: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed'];
  const currentIndex = statusOrder.indexOf(currentCustomerOrder.status);

  const getStepState = (stepIndex: number) => {
    if (currentCustomerOrder.status === 'cancelled') return 'cancelled';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-4 space-y-5 animate-fadeIn">
      {/* Active Order Status Notification Toast */}
      {activeToast && (
        <OrderStatusToast
          toast={activeToast}
          onDismiss={() => setActiveToast(null)}
        />
      )}

      {/* Top Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
              Live Order #{currentCustomerOrder.id}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Table #{currentCustomerOrder.tableNumber}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Placed at {new Date(currentCustomerOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Paid via {formatPaymentMethodName(currentCustomerOrder.paymentMethod)}
          </p>
        </div>

        <button
          onClick={() => setReceiptOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-sm shadow-emerald-600/25 hover:bg-emerald-500 active:scale-95 transition"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Digital Receipt</span>
        </button>
      </div>

      {/* Kitchen Live Sync Notice & Table Lock Status */}
      <div className="rounded-2xl bg-slate-950 p-3.5 border border-slate-800 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
            <ChefHat className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-black text-white">
              Synced with Kitchen Dashboard
            </p>
            <p className="text-[10px] text-slate-400">
              Order status is updated live by the kitchen staff.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2 py-1 text-[10px] font-black text-rose-300 shrink-0">
          <Lock className="h-3 w-3" /> Table #{currentCustomerOrder.tableNumber} Reserved
        </span>
      </div>

      {/* Countdown / Scheduled Time Card */}
      {currentCustomerOrder.status !== 'ready' && currentCustomerOrder.status !== 'completed' && currentCustomerOrder.status !== 'cancelled' && (
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 p-4 border border-emerald-500/20">
          <div>
            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
              {currentCustomerOrder.isScheduled && currentCustomerOrder.scheduledFor
                ? 'Scheduled Preparation Time'
                : 'Estimated Prep Time'}
            </p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {currentCustomerOrder.isScheduled && currentCustomerOrder.scheduledFor
                ? currentCustomerOrder.scheduledFor
                : `~${minsRemaining} Minutes`}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse">
            <ChefHat className="h-6 w-6" />
          </div>
        </div>
      )}

      {currentCustomerOrder.status === 'ready' && (
        <div className="rounded-2xl bg-emerald-500 p-4 text-white shadow-xl shadow-emerald-500/30 text-center space-y-1 animate-bounce">
          <p className="text-lg font-black">🎉 READY FOR PICKUP!</p>
          <p className="text-xs text-emerald-100">
            Order #{currentCustomerOrder.id} for Table #{currentCustomerOrder.tableNumber} is hot and ready for pickup!
          </p>
        </div>
      )}

      {/* Simulated Push Notification Trigger Bar */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <BellRing className="h-4 w-4 text-emerald-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate">
              Mobile Push Alerts Active
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Alerts you when status updates to &apos;Ready for Pickup&apos;
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSimulateReadyPush}
          className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[10px] font-black text-white shadow-sm transition active:scale-95"
        >
          {currentCustomerOrder.status === 'ready' ? 'Test Push Alert' : 'Mark Ready & Alert'}
        </button>
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
        {steps.map((step, idx) => {
          const state = getStepState(idx);
          return (
            <div key={step.status} className="relative flex items-start gap-3">
              {/* Step Circle */}
              <div
                className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold transition ${
                  state === 'completed'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : state === 'active'
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 animate-pulse'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {state === 'completed' ? '✓' : idx + 1}
              </div>

              <div>
                <h4
                  className={`text-xs font-extrabold ${
                    state === 'active'
                      ? 'text-amber-600 dark:text-amber-400'
                      : state === 'completed'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </h4>
                <p className="text-[11px] text-slate-500">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ordered Items Summary */}
      <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-200">
            Order Items ({currentCustomerOrder.items.length}):
          </h4>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {formatPaymentMethodName(currentCustomerOrder.paymentMethod)} • Paid
          </span>
        </div>
        <div className="space-y-1.5 divide-y divide-slate-200/50 dark:divide-slate-800/50">
          {currentCustomerOrder.items.map((it, i) => (
            <div key={i} className="pt-1.5 flex justify-between text-slate-700 dark:text-slate-300">
              <span>{it.quantity}x {it.productName}</span>
              <span className="font-semibold">₱{it.itemTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-extrabold text-slate-900 dark:text-white">
          <span>Total Paid:</span>
          <span className="text-emerald-600 dark:text-emerald-400">₱{currentCustomerOrder.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Status Notification Alerts Log */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs space-y-2">
        <button
          onClick={() => setShowHistoryLog(!showHistoryLog)}
          className="w-full flex items-center justify-between text-left font-bold text-slate-800 dark:text-slate-200"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-500" />
            <span>Status Alerts Log ({notificationHistory.length})</span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
            {showHistoryLog ? 'Hide Log ▲' : 'Show Log ▼'}
          </span>
        </button>

        {showHistoryLog && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto">
            {notificationHistory.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                No status change alerts yet. Updates from the Kitchen Dashboard will appear here automatically.
              </p>
            ) : (
              notificationHistory.map(notif => {
                const fromMeta = getStatusMeta(notif.fromStatus);
                const toMeta = getStatusMeta(notif.toStatus);

                return (
                  <div key={notif.id} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-slate-400 capitalize">{fromMeta.label}</span>
                        <span className="text-slate-500">→</span>
                        <span className="text-emerald-600 dark:text-emerald-400 capitalize">{toMeta.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{toMeta.message}</p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {notif.timestamp}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Quick Service Request & Exit Button (Replaces Cancel Button after payment) */}
      <div className="flex gap-2">
        <button
          onClick={() => setWaiterModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-100 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300"
        >
          <GlassWater className="h-4 w-4" />
          <span>Call Water / Waiter</span>
        </button>

        <button
          onClick={exitTableSession}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-rose-600/25 hover:bg-rose-500 active:scale-95 transition"
          title="Log out and return to the Landing Page"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Print-Friendly Digital Receipt Modal */}
      <ReceiptModal
        order={currentCustomerOrder}
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        isPostPayment={currentCustomerOrder.paymentStatus === 'paid'}
        onExitTable={exitTableSession}
      />

      {/* Call Waiter Modal */}
      <CallWaiterModal
        isOpen={waiterModalOpen}
        onClose={() => setWaiterModalOpen(false)}
      />
    </div>
  );
};
