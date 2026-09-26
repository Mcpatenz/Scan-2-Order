import React from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { GlassWater, UtensilsCrossed, Receipt, Sparkles, X } from 'lucide-react';

interface CallWaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CallWaiterModal: React.FC<CallWaiterModalProps> = ({ isOpen, onClose }) => {
  const { activeTable, requestWaiterService } = useOrderContext();

  if (!isOpen) return null;

  const handleRequest = (type: 'water' | 'waiter' | 'bill' | 'clean') => {
    requestWaiterService(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Call Table Service</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Table #{activeTable.tableNumber} • {activeTable.section}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="my-4 text-xs font-medium text-slate-600 dark:text-slate-300">
          Select what you need and our floor staff will come right over:
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleRequest('water')}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-sky-100 bg-sky-50/60 p-4 text-sky-800 transition hover:bg-sky-100 active:scale-95 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-300"
          >
            <GlassWater className="h-7 w-7 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-bold">Water Refill</span>
          </button>

          <button
            onClick={() => handleRequest('waiter')}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-amber-800 transition hover:bg-amber-100 active:scale-95 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <UtensilsCrossed className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-bold">Call Waiter</span>
          </button>

          <button
            onClick={() => handleRequest('bill')}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-emerald-800 transition hover:bg-emerald-100 active:scale-95 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <Receipt className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold">Request Bill</span>
          </button>

          <button
            onClick={() => handleRequest('clean')}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-purple-100 bg-purple-50/60 p-4 text-purple-800 transition hover:bg-purple-100 active:scale-95 dark:border-purple-900/40 dark:bg-purple-950/40 dark:text-purple-300"
          >
            <Sparkles className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold">Clean Table</span>
          </button>
        </div>
      </div>
    </div>
  );
};
