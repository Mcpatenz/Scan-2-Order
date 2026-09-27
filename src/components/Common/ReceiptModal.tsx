import React from 'react';
import { Order } from '../../types';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  cashierName?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, isOpen, onClose, cashierName }) => {
  if (!isOpen || !order) return null;

  const displayCashier = order.cashierName || cashierName || 'Sarah Jenkins (Cashier)';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Official Receipt</span>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thermal Receipt Layout */}
        <div className="my-4 rounded-xl bg-slate-50 p-5 font-mono text-xs text-slate-800 dark:bg-slate-950 dark:text-slate-200 border border-dashed border-slate-300 dark:border-slate-800 print:border-none print:shadow-none print:bg-white">
          <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-800">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white uppercase">QR BISTRO & CAFE</h2>
            <p className="text-[11px] text-slate-500">Central Branch • Table #{order.tableNumber}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Order ID: {order.id}</p>
            <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
          </div>

          <div className="py-2 border-b border-dashed border-slate-300 dark:border-slate-800">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Customer: {order.customerName}</p>
            <p className="text-slate-500 font-semibold text-sky-600 dark:text-sky-400">Cashier: {displayCashier}</p>
            <p className="text-slate-500">Dining: {order.diningOption === 'dine_in' ? 'Dine In' : 'Takeout'}</p>
            <p className="text-slate-500">Payment: <span className="uppercase font-semibold">{order.paymentMethod}</span> ({order.paymentStatus.toUpperCase()})</p>
          </div>

          {/* Items */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-800 space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between font-semibold">
                  <span>{item.quantity}x {item.productName}</span>
                  <span>₱{item.itemTotal.toFixed(2)}</span>
                </div>
                {item.modifiers && item.modifiers.length > 0 && (
                  <div className="pl-3 text-[10px] text-slate-500">
                    {item.modifiers.map(m => `• ${m.groupName}: ${m.optionName}`).join(', ')}
                  </div>
                )}
                {item.notes && (
                  <div className="pl-3 text-[10px] italic text-amber-600 dark:text-amber-400">
                    Note: "{item.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-3 space-y-1 text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₱{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount:</span>
                <span>-₱{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax (10%):</span>
              <span>₱{order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
              <span>TOTAL PAID:</span>
              <span>₱{order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 text-center pt-3 border-t border-dashed border-slate-300 dark:border-slate-800 text-[10px] text-slate-400">
            <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-emerald-500" />
            Thank you for dining with us!<br />
            Scan QR again anytime for reorders.
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 active:scale-95 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
