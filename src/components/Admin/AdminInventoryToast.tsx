import React, { useEffect } from 'react';
import { InventoryAlert } from '../../types';
import { useOrderContext } from '../../context/OrderContext';
import { AlertTriangle, PackageX, CheckCircle, X, ArrowRight, BellRing } from 'lucide-react';

interface AdminInventoryToastProps {
  onNavigateToInventory?: () => void;
}

export const AdminInventoryToast: React.FC<AdminInventoryToastProps> = ({
  onNavigateToInventory,
}) => {
  const { activeAdminAlert, dismissActiveAdminAlert, soundEnabled, setViewMode } = useOrderContext();

  useEffect(() => {
    if (activeAdminAlert && soundEnabled) {
      // Custom audio or chime handling can trigger if needed
    }
  }, [activeAdminAlert, soundEnabled]);

  if (!activeAdminAlert) return null;

  const isOutOfStock = activeAdminAlert.status === 'out_of_stock';
  const isLowStock = activeAdminAlert.status === 'low_stock';
  const isInStock = activeAdminAlert.status === 'in_stock';

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
        {/* Glow accent */}
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
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  isOutOfStock
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : isLowStock
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                <BellRing className="h-3 w-3" />
                {isOutOfStock ? 'Out of Stock Alert' : isLowStock ? 'Low Stock Warning' : 'Stock Restocked'}
              </span>
              <span className="text-[10px] text-slate-400">
                {new Date(activeAdminAlert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <h4 className="mt-1 text-sm font-black text-white truncate">
              {activeAdminAlert.productName}
            </h4>

            <p className="text-xs text-slate-200 mt-0.5 leading-snug">
              {activeAdminAlert.message}
            </p>

            {/* Quick Actions */}
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  dismissActiveAdminAlert();
                  setViewMode('admin');
                  if (onNavigateToInventory) {
                    onNavigateToInventory();
                  }
                }}
                className="flex items-center gap-1 text-xs font-extrabold text-white underline underline-offset-2 hover:opacity-80"
              >
                Manage Inventory <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={dismissActiveAdminAlert}
                className="ml-auto rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
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
