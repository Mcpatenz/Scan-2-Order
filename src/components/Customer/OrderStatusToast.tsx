import React, { useEffect, useState } from 'react';
import { OrderStatus } from '../../types';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Bell,
  Sparkles,
  XCircle,
  X,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export interface StatusToastNotification {
  id: string;
  orderId: string;
  tableNumber: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  timestamp: string;
}

interface OrderStatusToastProps {
  toast: StatusToastNotification | null;
  onDismiss: () => void;
  onViewTracker?: () => void;
}

export const getStatusMeta = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return {
        label: 'Order Sent',
        icon: <Clock className="h-4 w-4 text-amber-500" />,
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        borderColor: 'border-amber-500',
        gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
        message: 'Order received by kitchen! Waiting for confirmation.',
      };
    case 'accepted':
      return {
        label: 'Accepted',
        icon: <CheckCircle2 className="h-4 w-4 text-sky-500" />,
        badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
        borderColor: 'border-sky-500',
        gradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
        message: 'Cashier confirmed your order. Queueing in kitchen!',
      };
    case 'preparing':
      return {
        label: 'Preparing',
        icon: <ChefHat className="h-4 w-4 text-orange-500 animate-pulse" />,
        badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800',
        borderColor: 'border-orange-500',
        gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
        message: 'Chef is now cooking your meal in the kitchen!',
      };
    case 'ready':
      return {
        label: 'Ready to Serve',
        icon: <Bell className="h-4 w-4 text-emerald-500 animate-bounce" />,
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        borderColor: 'border-emerald-500',
        gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
        message: '🎉 Your order is hot and ready! Staff is bringing it to Table #',
      };
    case 'completed':
      return {
        label: 'Served / Completed',
        icon: <Sparkles className="h-4 w-4 text-purple-500" />,
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800',
        borderColor: 'border-purple-500',
        gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
        message: 'Order served! Bon appétit!',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        badgeBg: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800',
        borderColor: 'border-red-500',
        gradient: 'from-red-500/20 via-rose-500/10 to-transparent',
        message: 'Order was cancelled. Please approach staff if you have questions.',
      };
  }
};

export const OrderStatusToast: React.FC<OrderStatusToastProps> = ({
  toast,
  onDismiss,
  onViewTracker,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;
    setProgress(100);
    const duration = 6000;
    const intervalTime = 50;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);

      if (pct <= 0) {
        clearInterval(timer);
        onDismiss();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const fromMeta = getStatusMeta(toast.fromStatus);
  const toMeta = getStatusMeta(toast.toStatus);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 text-white shadow-2xl border-2 border-slate-700/80 backdrop-blur-md transition-all duration-300 animate-slideDown my-2">
      
      {/* Accent Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-r ${toMeta.gradient} opacity-40 pointer-events-none`} />

      <div className="relative p-3.5 space-y-2">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
              Live Order Alert #{toast.orderId}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              (Table #{toast.tableNumber})
            </span>
          </div>

          <button
            onClick={onDismiss}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Dismiss Toast"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Transition Status Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${fromMeta.badgeBg}`}>
            {fromMeta.icon}
            <span>{fromMeta.label}</span>
          </span>

          <ArrowRight className="h-3.5 w-3.5 text-slate-400 animate-pulse" />

          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ring-2 ring-emerald-500/30 ${toMeta.badgeBg}`}>
            {toMeta.icon}
            <span>{toMeta.label}</span>
          </span>
        </div>

        {/* Message */}
        <p className="text-xs font-semibold text-slate-200">
          {toast.toStatus === 'ready'
            ? `${toMeta.message}${toast.tableNumber} now!`
            : toMeta.message}
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
          <span className="text-slate-400">{toast.timestamp}</span>

          {onViewTracker && (
            <button
              onClick={onViewTracker}
              className="flex items-center gap-1 text-emerald-400 font-bold hover:underline"
            >
              <span>View Tracker</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="h-1 w-full bg-slate-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
