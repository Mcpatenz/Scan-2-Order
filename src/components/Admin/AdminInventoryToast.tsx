import React from 'react';
import { useOrderContext } from '../../context/OrderContext';
import {
  AlertTriangle,
  PackageX,
  CheckCircle,
  X,
  ArrowRight,
  BellRing,
  Mail,
  Plus,
} from 'lucide-react';

interface AdminInventoryToastProps {
  onNavigateToInventory?: () => void;
}

export const AdminInventoryToast: React.FC<AdminInventoryToastProps> = ({
  onNavigateToInventory,
}) => {
  const {
    activeAdminAlert,
    dismissActiveAdminAlert,
    restockProduct,
    acknowledgeInventoryAlert,
    setViewMode,
  } = useOrderContext();

  if (!activeAdminAlert) return null;

  const isOutOfStock = activeAdminAlert.status === 'out_of_stock';
  const isLowStock = activeAdminAlert.status === 'low_stock';
  const isInStock = activeAdminAlert.status === 'in_stock';
  const emailed = activeAdminAlert.channelsNotified?.includes('email');
  const primaryRecipient = activeAdminAlert.recipientEmails?.[0] || 'mcpatenz45@gmail.com';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full animate-bounceIn">
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all ${
          isOutOfStock
            ? 'bg-rose-950/95 border-rose-500/60 text-white shadow-rose-950/50'
            : isLowStock
            ? 'bg-amber-950/95 border-amber-500/60 text-white shadow-amber-950/50'
            : 'bg-emerald-950/95 border-emerald-500/60 text-white shadow-emerald-950/50'
        }`}
      >
        <div
          className={`absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl opacity-40 ${
            isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />

        <div className="relative z-10 flex items-start gap-3">
          {/* Status Icon */}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black ${
              isOutOfStock
                ? 'bg-rose-500 text-white animate-pulse'
                : isLowStock
                ? 'bg-amber-500 text-slate-950'
                : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {isOutOfStock && <PackageX className="h-6 w-6" />}
            {isLowStock && <AlertTriangle className="h-6 w-6" />}
            {isInStock && <CheckCircle className="h-6 w-6" />}
          </div>

          {/* Alert Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span
                className={`inline-flex items-center gap-1 uppercase tracking-wider font-black ${
                  isOutOfStock
                    ? 'text-rose-300'
                    : isLowStock
                    ? 'text-amber-300'
                    : 'text-emerald-300'
                }`}
              >
                <BellRing className="h-3 w-3" />
                {isOutOfStock
                  ? 'Critical Out of Stock Alert'
                  : isLowStock
                  ? 'Automated Low Stock Alert'
                  : 'Stock Replenished'}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300 font-mono">
                {new Date(activeAdminAlert.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <h4 className="mt-1 text-sm font-black text-white truncate">
              {activeAdminAlert.productName}
            </h4>

            <p className="text-xs text-slate-200 mt-0.5 leading-snug">
              {activeAdminAlert.message}
            </p>

            {/* Stock vs Threshold + Email Dispatch Status */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
              <span className="font-mono font-bold text-white">
                Stock: {activeAdminAlert.currentStock} / Threshold: {activeAdminAlert.threshold ?? 5}
              </span>
              {emailed && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-sky-300 font-semibold">
                    <Mail className="h-3 w-3" /> Email sent to {primaryRecipient}
                  </span>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(isOutOfStock || isLowStock) && (
                <button
                  type="button"
                  onClick={() => {
                    restockProduct(activeAdminAlert.productId, 15);
                    acknowledgeInventoryAlert(activeAdminAlert.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-black text-white shadow-md transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Quick Restock (+15)
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  dismissActiveAdminAlert();
                  setViewMode('admin');
                  if (onNavigateToInventory) {
                    onNavigateToInventory();
                  }
                }}
                className="flex items-center gap-1 text-xs font-extrabold text-white underline underline-offset-2 hover:opacity-80"
              >
                Open Alert Center <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={dismissActiveAdminAlert}
                className="ml-auto rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={dismissActiveAdminAlert}
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
