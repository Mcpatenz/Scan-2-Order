import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { ShoppingBag, X, Trash2, Plus, Minus, Tag, ArrowRight, Utensils, Award, Sparkles } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
}) => {
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    cartTax,
    cartTotal,
    discountAmount,
    appliedDiscountCode,
    applyDiscountCode,
    activeTable,
    loyaltyPoints,
    redeemedLoyaltyDiscount,
  } = useOrderContext();

  const [couponCode, setCouponCode] = useState('');

  if (!isOpen) return null;

  const pointsToEarn = Math.max(10, Math.round(cartTotal * 10));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      applyDiscountCode(couponCode);
      setCouponCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white p-5 shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full animate-slideLeft">
        
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Order</h2>
              <p className="text-[11px] text-slate-500">Table #{activeTable.tableNumber} • {activeTable.section}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-none">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400 space-y-3">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                <Utensils className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Your cart is empty</p>
              <p className="text-xs text-slate-400 max-w-xs">Select delicious items from our menu to start your order.</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-500 p-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Modifiers subtitle */}
                    {item.selectedModifiers.length > 0 && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {item.selectedModifiers.map(m => m.optionName).join(', ')}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-[10px] italic text-amber-600 dark:text-amber-400 mt-0.5">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      ${item.itemTotal.toFixed(2)}
                    </span>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-0.5 dark:border-slate-800 dark:bg-slate-900">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-900 dark:text-white w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Promo Code Input */}
        {cart.length > 0 && (
          <form onSubmit={handleApplyCoupon} className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Promo code (try WELCOME10)"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs uppercase font-semibold text-slate-800 placeholder:normal-case placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                Apply
              </button>
            </div>
            {appliedDiscountCode && (
              <p className="mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ Coupon '{appliedDiscountCode}' applied!
              </p>
            )}
          </form>
        )}

        {/* Totals & Checkout Button */}
        {cart.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            {/* Loyalty Earn Callout */}
            <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="font-bold text-[11px]">Points You'll Earn:</span>
              </div>
              <span className="font-black text-xs text-amber-600 dark:text-amber-400">
                +{pointsToEarn} PTS
              </span>
            </div>

            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900 dark:text-white">${cartSubtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount:</span>
                <span className="font-bold">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Estimated Tax (10%):</span>
              <span className="font-semibold text-slate-900 dark:text-white">${cartTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-extrabold text-slate-900 dark:text-white">
              <span>Total:</span>
              <span className="text-base text-emerald-600 dark:text-emerald-400">${cartTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 active:scale-95"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
