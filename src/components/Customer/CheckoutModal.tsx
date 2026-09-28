import React, { useState, useMemo } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { PaymentMethod, DiningOption, Order } from '../../types';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
  X,
  CheckCircle2,
  Utensils,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Award,
  Lock,
  Clock,
  Calendar,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MockPaymentGatewayModal } from './MockPaymentGatewayModal';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string, order: Order) => void;
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
    exitTableSession,
    businessSettings,
  } = useOrderContext();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [diningOption, setDiningOption] = useState<DiningOption>('dine_in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gatewayOpen, setGatewayOpen] = useState(false);

  // Order Scheduling State: Immediate vs Future Time
  const [prepTiming, setPrepTiming] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduleDay, setScheduleDay] = useState<'today' | 'tomorrow'>('today');
  const [scheduledTime, setScheduledTime] = useState<string>(() => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    return future.toTimeString().slice(0, 5);
  });

  const quickTimeSlots = useMemo(() => {
    const offsets = [30, 60, 90, 120];
    return offsets.map(mins => {
      const d = new Date(Date.now() + mins * 60 * 1000);
      const val = d.toTimeString().slice(0, 5);
      const label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { mins, val, label };
    });
  }, []);

  if (!isOpen) return null;

  const isDigitalGatewayMethod =
    paymentMethod === 'gcash' ||
    paymentMethod === 'paymaya';

  const getFormattedScheduleLabel = (): string | undefined => {
    if (prepTiming !== 'scheduled' || !scheduledTime) return undefined;
    const dayLabel = scheduleDay === 'today' ? 'Today' : 'Tomorrow';
    const [hh, mm] = scheduledTime.split(':').map(Number);
    const d = new Date();
    if (scheduleDay === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    if (!isNaN(hh) && !isNaN(mm)) {
      d.setHours(hh, mm, 0, 0);
    }
    const readableTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dayLabel} at ${readableTime}`;
  };

  const finalizeOrder = (
    finalMethod: PaymentMethod,
    paymentRefNote?: string,
    exitAfterOrder?: boolean
  ) => {
    setIsSubmitting(true);

    setTimeout(() => {
      const scheduleLabel = getFormattedScheduleLabel();
      const combinedNotes = [
        scheduleLabel ? `🕒 Scheduled for ${scheduleLabel}` : '',
        orderNotes.trim(),
        paymentRefNote,
      ]
        .filter(Boolean)
        .join(' • ');

      const newOrder = placeOrder(
        customerName.trim(),
        customerPhone.trim(),
        diningOption,
        finalMethod,
        combinedNotes || undefined,
        scheduleLabel
      );

      if (!newOrder) {
        setIsSubmitting(false);
        return;
      }

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
      if (exitAfterOrder) {
        exitTableSession();
      } else {
        onOrderPlaced(newOrder.id, newOrder);
      }
    }, 400);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDigitalGatewayMethod) {
      setGatewayOpen(true);
      return;
    }
    finalizeOrder(paymentMethod);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Checkout</h3>
            <p className="text-[11px] text-slate-500">
              Table #{activeTable.tableNumber} • {activeTable.section}
            </p>
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

          {/* Preparation Time: Immediate vs Schedule for Future Time */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Preparation Time:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrepTiming('immediate')}
                className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-bold transition border ${
                  prepTiming === 'immediate'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Immediate (ASAP)</span>
              </button>

              <button
                type="button"
                onClick={() => setPrepTiming('scheduled')}
                className={`flex items-center justify-center gap-1.5 rounded-xl p-2.5 text-xs font-bold transition border ${
                  prepTiming === 'scheduled'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Schedule Future Time</span>
              </button>
            </div>

            {prepTiming === 'scheduled' && (
              <div className="mt-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                    Choose Future Preparation Time
                  </span>
                  <div className="flex gap-1 rounded-lg bg-slate-200/70 p-0.5 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setScheduleDay('today')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                        scheduleDay === 'today'
                          ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleDay('tomorrow')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                        scheduleDay === 'tomorrow'
                          ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                {/* Quick Time Slots */}
                <div className="grid grid-cols-4 gap-1.5">
                  {quickTimeSlots.map(slot => (
                    <button
                      key={slot.mins}
                      type="button"
                      onClick={() => setScheduledTime(slot.val)}
                      className={`rounded-xl border py-1.5 px-2 text-center transition ${
                        scheduledTime === slot.val
                          ? 'border-amber-500 bg-amber-500 text-slate-950 font-black'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-amber-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 font-bold'
                      }`}
                    >
                      <div className="text-[10px]">+{slot.mins}m</div>
                      <div className="text-[9px] opacity-80">{slot.label}</div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Custom Time:
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
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

          {/* Payment Method Options: GCash, PayMaya, or Cash on Hand */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Payment Method:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition ${
                  paymentMethod === 'gcash'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <Smartphone className="h-4 w-4 text-blue-500 shrink-0" />
                <span>GCash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('paymaya')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition ${
                  paymentMethod === 'paymaya'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <QrCode className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>PayMaya</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash_on_hand')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-bold transition ${
                  paymentMethod === 'cash_on_hand'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                }`}
              >
                <Banknote className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Cash on Hand</span>
              </button>
            </div>
          </div>

          {/* Payment Method Details */}
          {paymentMethod === 'gcash' && (
            <div className="rounded-xl bg-blue-50/60 p-3 text-xs text-blue-900 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4 text-blue-500" /> GCash Express Payment
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    GCash Number: <strong className="font-mono">{businessSettings.gcashNumber || '0917 888 9912'}</strong>
                  </p>
                </div>
                <div className="h-14 w-14 rounded-lg bg-white p-1 border border-blue-300 flex items-center justify-center shrink-0 overflow-hidden">
                  {businessSettings.gcashQrCode ? (
                    <img
                      src={businessSettings.gcashQrCode}
                      alt="GCash QR"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <QRCodeSVG
                      value={`GCASH|${businessSettings.businessName}|${businessSettings.gcashNumber}`}
                      size={44}
                      level="M"
                    />
                  )}
                </div>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">
                Pay securely via GCash QR code or registered mobile number at the next step.
              </p>
            </div>
          )}

          {paymentMethod === 'paymaya' && (
            <div className="rounded-xl bg-emerald-50/60 p-3 text-xs text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-emerald-500" /> PayMaya Digital Checkout
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    PayMaya Number: <strong className="font-mono">{businessSettings.paymayaNumber || '0918 777 6654'}</strong>
                  </p>
                </div>
                <div className="h-14 w-14 rounded-lg bg-white p-1 border border-emerald-300 flex items-center justify-center shrink-0 overflow-hidden">
                  {businessSettings.paymayaQrCode ? (
                    <img
                      src={businessSettings.paymayaQrCode}
                      alt="PayMaya QR"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <QRCodeSVG
                      value={`PAYMAYA|${businessSettings.businessName}|${businessSettings.paymayaNumber}`}
                      size={44}
                      level="M"
                    />
                  )}
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Pay securely with your PayMaya e-wallet account or QR code scanner at the next step.
              </p>
            </div>
          )}

          {paymentMethod === 'cash_on_hand' && (
            <div className="rounded-xl bg-amber-50/60 p-3 text-xs text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300">
              <p className="font-bold flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-amber-500" /> Cash on Hand Payment
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                Pay directly with cash on hand at your table or cashier counter. Table #{activeTable.tableNumber} will be reserved for your order.
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
                <span>Rewards You&apos;ll Earn:</span>
              </div>
              <span className="font-black text-amber-600 dark:text-amber-400">
                +{Math.max(10, Math.round(cartTotal * 10))} PTS
              </span>
            </div>

            {prepTiming === 'scheduled' && (
              <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-emerald-700 dark:text-emerald-300">
                <span className="font-bold">Scheduled Time:</span>
                <span className="font-black">{getFormattedScheduleLabel()}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600 dark:text-slate-400 pt-1">
              <span>Items ({cart.length}):</span>
              <span>₱{cartSubtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Discount / Loyalty Reward:</span>
                <span>-₱{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Tax (10%):</span>
              <span>₱{cartTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-800 font-extrabold text-sm text-slate-900 dark:text-white">
              <span>Total Amount:</span>
              <span className="text-emerald-600 dark:text-emerald-400">₱{cartTotal.toFixed(2)}</span>
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
            ) : isDigitalGatewayMethod ? (
              <Lock className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>
              {isSubmitting
                ? 'Sending Order to Kitchen...'
                : prepTiming === 'scheduled'
                ? `Schedule Order (${getFormattedScheduleLabel()}) • ₱${cartTotal.toFixed(2)}`
                : isDigitalGatewayMethod
                ? `Proceed to Secure Checkout • ₱${cartTotal.toFixed(2)}`
                : `Place Order • ₱${cartTotal.toFixed(2)}`}
            </span>
          </button>
        </form>

        <MockPaymentGatewayModal
          isOpen={gatewayOpen}
          onClose={() => setGatewayOpen(false)}
          amount={cartTotal}
          tableNumber={activeTable.tableNumber}
          initialMethod={paymentMethod}
          onPaymentSuccess={({ refNumber, method, exitToLanding }) => {
            setGatewayOpen(false);
            finalizeOrder(method, `Paid Ref: ${refNumber}`, exitToLanding);
          }}
        />
      </div>
    </div>
  );
};
