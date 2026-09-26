import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { PaymentMethod, DiningOption } from '../../types';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Banknote,
  Smartphone,
  X,
  CheckCircle2,
  Utensils,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const {
    activeTable,
    cart,
    cartSubtotal,
    cartTax,
    cartTotal,
    discountAmount,
    placeOrder,
  } = useOrderContext();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [diningOption, setDiningOption] = useState<DiningOption>('dine_in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const newOrder = placeOrder(
        customerName.trim(),
        customerPhone.trim(),
        diningOption,
        paymentMethod,
        orderNotes.trim()
      );

      // Blocked (no scanned table / empty cart): the reason is shown via toast.
      if (!newOrder) {
        setIsSubmitting(false);
        return;
      }

      // Trigger Confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }

      setIsSubmitting(false);
      onClose();
      onOrderPlaced(newOrder.id);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Checkout</h3>
            <p className="text-[11px] text-slate-500">Table #{activeTable.tableNumber} • {activeTable.section}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="mt-4 space-y-4">
          
          {/* Dining Option Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Dining Option:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiningOption('dine_in')}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold transition border ${
                  diningOption === 'dine_in'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <Utensils className="h-4 w-4" />
                <span>Dine In (Table {activeTable.tableNumber})</span>
              </button>

              <button
                type="button"
                onClick={() => setDiningOption('takeout')}
                className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold transition border ${
                  diningOption === 'takeout'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Takeout Bag</span>
              </button>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Your Name / Guest Name:
              </label>
              <input
                type="text"
                placeholder={`e.g. Guest Table ${activeTable.tableNumber}`}
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                Phone Number (Optional for order notifications):
              </label>
              <input
                type="tel"
                placeholder="e.g. +1 555-0192"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Payment Method Options */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Payment Method:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                  paymentMethod === 'gcash'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <Smartphone className="h-4 w-4 text-blue-500" />
                <span>GCash / E-Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                  paymentMethod === 'card'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <CreditCard className="h-4 w-4 text-purple-500" />
                <span>Credit / Debit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <Banknote className="h-4 w-4 text-emerald-500" />
                <span>Cash to Waiter</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('pay_at_counter')}
                className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                  paymentMethod === 'pay_at_counter'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-amber-500" />
                <span>Pay at Counter</span>
              </button>
            </div>
          </div>

          {/* Payment Method Details Simulation */}
          {paymentMethod === 'gcash' && (
            <div className="rounded-xl bg-blue-50/60 p-3 text-xs text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300">
              <p className="font-bold flex items-center gap-1.5">
                <Smartphone className="h-4 w-4" /> GCash Express Pay
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1">
                Instant verification upon order placement.
              </p>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="rounded-xl bg-purple-50/60 p-3 text-xs text-purple-900 border border-purple-200 dark:bg-purple-950/40 dark:border-purple-900/50 dark:text-purple-300">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-purple-600" /> Card Payment Simulation
              </p>
              <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-1">
                256-bit encrypted card process.
              </p>
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
              Additional Order Notes:
            </label>
            <input
              type="text"
              placeholder="e.g. Serve drinks first..."
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          {/* Summary Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950 text-xs space-y-1.5">
            <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-bold">
                <Award className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Rewards You'll Earn:</span>
              </div>
              <span className="font-black text-amber-600 dark:text-amber-400">
                +{Math.max(10, Math.round(cartTotal * 10))} PTS
              </span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400 pt-1">
              <span>Items ({cart.length}):</span>
              <span>${cartSubtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Discount / Loyalty Reward:</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax (10%):</span>
              <span>${cartTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800 font-extrabold text-sm text-slate-900 dark:text-white">
              <span>Total Amount:</span>
              <span className="text-emerald-600 dark:text-emerald-400">${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Sparkles className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>{isSubmitting ? 'Sending Order to Kitchen...' : `Place Order • $${cartTotal.toFixed(2)}`}</span>
          </button>

        </form>

      </div>
    </div>
  );
};
