import React, { useState, useEffect, useRef } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Product, OrderStatus, Order } from '../../types';
import {
  Search,
  QrCode,
  ShoppingBag,
  Flame,
  Plus,
  Minus,
  Trash2,
  Tag,
  ArrowRight,
  Clock,
  GlassWater,
  History,
  Utensils,
  ChevronRight,
  ChevronLeft,
  Award,
  User,
  Mic,
  LogOut,
  Printer,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { ProductModal } from './ProductModal';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { QRScannerModal } from './QRScannerModal';
import { OrderTracker } from './OrderTracker';
import { OrderHistoryModal } from './OrderHistoryModal';
import { OrderHistoryView } from './OrderHistoryView';
import { CallWaiterModal } from '../Common/CallWaiterModal';
import { LoyaltyModal } from './LoyaltyModal';
import { OrderStatusToast, StatusToastNotification } from './OrderStatusToast';
import { CustomerProfileView } from './CustomerProfileView';
import { EmployeeSignInModal } from '../Common/EmployeeSignInModal';
import { VoiceOrderModal } from './VoiceOrderModal';
import { ReceiptModal } from '../Common/ReceiptModal';
import { CustomerFeedbackModal } from './CustomerFeedbackModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DailySpecialsCarousel } from './DailySpecialsCarousel';
import { MealComboBuilderModal } from './MealComboBuilderModal';
import { TRANSLATIONS } from '../../i18n/customerTranslations';
import { formatTime12Hour } from '../Admin/AdminSettingsManager';

export const CustomerHome: React.FC = () => {
  const {
    activeTable,
    categories,
    products,
    cart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    discountAmount,
    appliedDiscountCode,
    applyDiscountCode,
    currentCustomerOrder,
    customerOrderHistory,
    loyaltyPoints,
    exitTableSession,
    showToast,
    pendingFeedbackOrder,
    setPendingFeedbackOrder,
    customerLanguage,
    businessSettings,
  } = useOrderContext();

  const t = TRANSLATIONS[customerLanguage] || TRANSLATIONS.en;

  const [activeCategoryId, setActiveCategoryId] = useState<string>('cat-all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [bagPromoCode, setBagPromoCode] = useState<string>('');

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [loyaltyModalOpen, setLoyaltyModalOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [voiceOrderOpen, setVoiceOrderOpen] = useState(false);
  const [comboBuilderOpen, setComboBuilderOpen] = useState(false);
  const [confirmedReceiptOrder, setConfirmedReceiptOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'menu' | 'bag' | 'status' | 'history' | 'profile'>('menu');

  // Horizontal Slider Refs
  const servicesSliderRef = useRef<HTMLDivElement | null>(null);
  const popularSliderRef = useRef<HTMLDivElement | null>(null);
  const categorySliderRef = useRef<HTMLDivElement | null>(null);

  const slideHorizontal = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right', distance = 220) => {
    if (!ref.current) return;
    ref.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  // Floating Status Toast state for Customer Home
  const [homeToast, setHomeToast] = useState<StatusToastNotification | null>(null);
  const prevCustomerStatusRef = useRef<{ orderId: string; status: OrderStatus } | null>(null);

  useEffect(() => {
    if (!currentCustomerOrder) {
      prevCustomerStatusRef.current = null;
      return;
    }

    const cid = currentCustomerOrder.id;
    const cstatus = currentCustomerOrder.status;

    if (
      prevCustomerStatusRef.current &&
      prevCustomerStatusRef.current.orderId === cid &&
      prevCustomerStatusRef.current.status !== cstatus
    ) {
      const fromStatus = prevCustomerStatusRef.current.status;
      const toStatus = cstatus;

      setHomeToast({
        id: `home-toast-${Date.now()}`,
        orderId: cid,
        tableNumber: currentCustomerOrder.tableNumber,
        fromStatus,
        toStatus,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    prevCustomerStatusRef.current = { orderId: cid, status: cstatus };
  }, [currentCustomerOrder?.id, currentCustomerOrder?.status]);

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const pointsToEarn = cart.length > 0 ? Math.max(10, Math.round(cartTotal * 10)) : 0;

  const popularProducts = products.filter(
    p => p.isPopular && p.inStock && (p.stockQuantity === undefined || p.stockQuantity > 0)
  );

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeCategoryId === 'cat-all') return matchesSearch;
    if (activeCategoryId === 'cat-popular') return matchesSearch && p.isPopular;
    return matchesSearch && p.categoryId === activeCategoryId;
  });

  const handleApplyBagCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (bagPromoCode.trim()) {
      applyDiscountCode(bagPromoCode);
      setBagPromoCode('');
    }
  };

  const handleOpenLatestReceipt = () => {
    const targetOrder = currentCustomerOrder || customerOrderHistory[0] || null;
    if (targetOrder) {
      setConfirmedReceiptOrder(targetOrder);
    } else {
      showToast(`No receipt yet for Table #${activeTable.tableNumber}. Place an order first!`);
      setActiveTab('history');
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-24 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      {/* Floating Status Change Toast Notification */}
      {homeToast && (
        <div className="px-4 pt-3">
          <OrderStatusToast
            toast={homeToast}
            onDismiss={() => setHomeToast(null)}
            onViewTracker={() => {
              setActiveTab('status');
              setHomeToast(null);
            }}
          />
        </div>
      )}

      {/* Clean Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-2.5 border-b border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          {/* Table Identity */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20">
              <Utensils className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white truncate">
                  {businessSettings.businessName} · {t.tableLabel} #{activeTable.tableNumber}
                </span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {formatTime12Hour(businessSettings.timeOpen)}–{formatTime12Hour(businessSettings.timeClosed)} · {businessSettings.contactNumber}
              </p>
            </div>
          </div>

          {/* Primary Session Controls: Language Switcher, Bag & Exit (Log Out) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <LanguageSwitcher />

            <button
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition"
              title="Open Order Bag"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span className="hidden xs:inline">{t.bagLabel}</span>
              <span
                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black tabular-nums ${
                  cartItemCount > 0
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {cartItemCount}
              </span>
            </button>

            <button
              onClick={exitTableSession}
              className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-black text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 active:scale-95 transition"
              title={t.exitLogoutTooltip}
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span>{t.exitLogoutLabel}</span>
            </button>
          </div>
        </div>

        {/* Clean Segmented Navigation Bar */}
        <div className="mt-2.5 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/90 overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 whitespace-nowrap flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'menu'
                ? 'bg-white text-emerald-600 shadow-2xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Utensils className="h-3.5 w-3.5 shrink-0" />
            <span>{t.navMenu}</span>
          </button>

          <button
            onClick={() => setActiveTab('bag')}
            className={`flex-1 whitespace-nowrap flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'bag'
                ? 'bg-white text-emerald-600 shadow-2xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
            <span>{t.navBag}</span>
            {cartItemCount > 0 && (
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                ({cartItemCount})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 whitespace-nowrap flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'status'
                ? 'bg-white text-emerald-600 shadow-2xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{t.navTracker}</span>
            {currentCustomerOrder && (
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 whitespace-nowrap flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-white text-emerald-600 shadow-2xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5 shrink-0" />
            <span>{t.navMyOrders}</span>
            <span className="text-[10px] font-black opacity-75 tabular-nums">
              ({customerOrderHistory.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 whitespace-nowrap flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-white text-emerald-600 shadow-2xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <User className="h-3.5 w-3.5 shrink-0" />
            <span>{t.navProfile}</span>
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === 'status' ? (
        <div className="p-4">
          <OrderTracker />
        </div>
      ) : activeTab === 'history' ? (
        <div className="p-4">
          <OrderHistoryView
            onOpenBag={() => setActiveTab('bag')}
            onOpenTracker={() => setActiveTab('status')}
            onCustomizeProduct={product => setSelectedProduct(product)}
          />
        </div>
      ) : activeTab === 'profile' ? (
        <div className="p-4">
          <CustomerProfileView
            onOpenSignIn={() => setSignInModalOpen(true)}
            onOpenCart={() => setActiveTab('bag')}
            onOpenOrderHistory={() => setActiveTab('history')}
          />
        </div>
      ) : activeTab === 'bag' ? (
        /* DEDICATED CUSTOMER DASHBOARD BAG / CART VIEW */
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-2xs border border-slate-200 dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Your Order Bag ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})
                </h2>
                <p className="text-[11px] text-slate-500">
                  Table #{activeTable.tableNumber} · Ready for checkout
                </p>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                Your Order Bag is Empty
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Browse the menu or use the services slider to add dishes and drinks to your bag.
              </p>
              <button
                onClick={() => setActiveTab('menu')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
              >
                <Utensils className="h-3.5 w-3.5" />
                <span>Browse Menu</span>
              </button>
            </div>
          ) : (
            <>
              {/* Stored Items List */}
              <div className="space-y-2.5">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-950"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="h-16 w-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate-400 hover:text-rose-500 p-0.5 shrink-0"
                            title="Remove item from bag"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {item.selectedModifiers.length > 0 && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.selectedModifiers.map(m => `${m.groupName}: ${m.optionName}`).join(' · ')}
                          </p>
                        )}

                        {item.notes && (
                          <p className="text-[10px] italic text-amber-600 dark:text-amber-400 mt-0.5">
                            Note: &ldquo;{item.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-900">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          ₱{item.itemTotal.toFixed(2)}
                        </span>

                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-slate-800 dark:bg-slate-900">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-black text-slate-900 dark:text-white w-5 text-center tabular-nums">
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
                ))}
              </div>

              {/* Promo Code & Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs dark:border-slate-800 dark:bg-slate-950">
                <form onSubmit={handleApplyBagCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. WELCOME10)"
                      value={bagPromoCode}
                      onChange={e => setBagPromoCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs uppercase font-semibold text-slate-800 placeholder:normal-case placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    Apply
                  </button>
                </form>

                {appliedDiscountCode && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Promo code &lsquo;{appliedDiscountCode}&rsquo; applied!
                  </p>
                )}

                <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-amber-700 dark:text-amber-300">
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="font-bold text-[11px]">Loyalty Points You&apos;ll Earn:</span>
                  </div>
                  <span className="font-black text-xs text-amber-600 dark:text-amber-400 tabular-nums">
                    +{pointsToEarn} PTS
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartItemCount} items):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₱{cartSubtotal.toFixed(2)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount Applied:</span>
                      <span className="font-bold">-₱{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Estimated Tax (10%):</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₱{cartTax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white">
                    <span>Total Amount:</span>
                    <span className="text-base text-emerald-600 dark:text-emerald-400">
                      ₱{cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('menu')}
                    className="rounded-xl border border-slate-200 px-3.5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                  >
                    + Add More
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 text-xs font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-95 transition"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* MAIN CUSTOMER DASHBOARD & MENU VIEW */
        <div className="p-4 space-y-5">
          {/* Active Order Banner (if table has an active or paid order) */}
          {currentCustomerOrder && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    Order #{currentCustomerOrder.id} ·{' '}
                    <span className="uppercase text-emerald-600 dark:text-emerald-400">
                      {currentCustomerOrder.status}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate tabular-nums">
                    ₱{currentCustomerOrder.total.toFixed(2)} · {currentCustomerOrder.paymentStatus.toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {currentCustomerOrder.paymentStatus === 'paid' && (
                  <button
                    type="button"
                    onClick={() => setPendingFeedbackOrder(currentCustomerOrder)}
                    className="flex items-center gap-1 rounded-xl bg-amber-500/15 border border-amber-500/30 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition"
                    title="Rate your dining experience"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    <span>
                      {currentCustomerOrder.feedback
                        ? `${currentCustomerOrder.feedback.rating}★`
                        : 'Rate'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmedReceiptOrder(currentCustomerOrder)}
                  className="flex items-center gap-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 hover:border-emerald-500 transition"
                >
                  <Printer className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('status')}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-emerald-500 transition"
                >
                  <span>Track</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TABLE SERVICES SLIDER (Horizontal Interactive Carousel) */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
                  {t.tableLabel} #{activeTable.tableNumber} {t.tableServicesTitle}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.tableServicesSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => slideHorizontal(servicesSliderRef, 'left', 200)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 active:scale-95 transition"
                  aria-label="Slide services left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => slideHorizontal(servicesSliderRef, 'right', 200)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 active:scale-95 transition"
                  aria-label="Slide services right"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={servicesSliderRef}
              className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 snap-x snap-mandatory scrollbar-none"
            >
              {/* Service 1: Voice Order */}
              <button
                type="button"
                onClick={() => setVoiceOrderOpen(true)}
                className="snap-start shrink-0 w-36 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-2xs hover:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-950 transition active:scale-95"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                  <Mic className="h-4 w-4" />
                </div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {t.serviceVoiceTitle}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {t.serviceVoiceDesc}
                </p>
              </button>

              {/* Service 2: Call Waiter / Water */}
              <button
                type="button"
                onClick={() => setWaiterModalOpen(true)}
                className="snap-start shrink-0 w-36 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-2xs hover:border-sky-500/50 dark:border-slate-800 dark:bg-slate-950 transition active:scale-95"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-2">
                  <GlassWater className="h-4 w-4" />
                </div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {t.serviceWaiterTitle}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {t.serviceWaiterDesc}
                </p>
              </button>

              {/* Service 3: Digital Receipt */}
              <button
                type="button"
                onClick={handleOpenLatestReceipt}
                className="snap-start shrink-0 w-36 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-2xs hover:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-950 transition active:scale-95"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                  <Printer className="h-4 w-4" />
                </div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {t.serviceReceiptTitle}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {t.serviceReceiptDesc}
                </p>
              </button>

              {/* Service 4: My Orders (Table History) */}
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="snap-start shrink-0 w-36 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-2xs hover:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-950 transition active:scale-95"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-2">
                  <History className="h-4 w-4" />
                </div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {t.serviceMyOrdersTitle} ({customerOrderHistory.length})
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {t.serviceMyOrdersDesc}
                </p>
              </button>

              {/* Service 5: Loyalty Points */}
              <button
                type="button"
                onClick={() => setLoyaltyModalOpen(true)}
                className="snap-start shrink-0 w-36 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-2xs hover:border-amber-500/50 dark:border-slate-800 dark:bg-slate-950 transition active:scale-95"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
                  <Award className="h-4 w-4" />
                </div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate tabular-nums">
                  {loyaltyPoints} PTS
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {t.serviceRewardsDesc}
                </p>
              </button>

              {/* Service 6: Scan / Switch Table QR */}
              <button
                type="button"
                onClick={() => setQrScannerOpen(true)}
                className="snap-start shrink-0 w-36 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-2xs hover:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-950 transition active:scale-95"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-2">
                  <QrCode className="h-4 w-4" />
                </div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {t.serviceScanQrTitle}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {t.serviceScanQrDesc}
                </p>
              </button>
            </div>
          </section>

          {/* DAILY SPECIALS & LIMITED-TIME PROMOTIONAL CAROUSEL (Drives Higher AOV) */}
          {!searchQuery.trim() && (
            <DailySpecialsCarousel
              onCustomizeProduct={product => setSelectedProduct(product)}
            />
          )}

          {/* BUILD YOUR CUSTOM MEAL COMBO CARD */}
          {!searchQuery.trim() && (
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-4 text-white shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950">
                      Save 15% Bundle
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300">
                      1 Main + 1 Side + 1 Drink
                    </span>
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-white">
                    Build Your Custom Meal Combo
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Mix &amp; match any main course, side dish, and beverage with live dynamic price adjustments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setComboBuilderOpen(true)}
                  className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/20 transition active:scale-95"
                >
                  <Utensils className="h-3.5 w-3.5" />
                  <span>Build Combo</span>
                </button>
              </div>
            </div>
          )}

          {/* POPULAR DISHES SLIDER (When not searching) */}
          {!searchQuery.trim() && popularProducts.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <h2 className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
                    {t.popularPicksTitle}
                  </h2>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => slideHorizontal(popularSliderRef, 'left', 240)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 active:scale-95 transition"
                    aria-label="Slide popular dishes left"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => slideHorizontal(popularSliderRef, 'right', 240)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 active:scale-95 transition"
                    aria-label="Slide popular dishes right"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                ref={popularSliderRef}
                className="flex gap-3 overflow-x-auto pb-1 pt-0.5 snap-x snap-mandatory scrollbar-none"
              >
                {popularProducts.map(product => (
                  <div
                    key={`pop-${product.id}`}
                    onClick={() => setSelectedProduct(product)}
                    className="snap-start shrink-0 w-48 cursor-pointer rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-emerald-500/50 dark:border-slate-800 dark:bg-slate-950 transition"
                  >
                    <div className="relative h-28 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 mb-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {product.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        ₱{product.price.toFixed(2)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                        <Plus className="h-3 w-3" /> Add
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* MENU SEARCH & CATEGORY SLIDER */}
          <section className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {/* Category Slider */}
            <div className="flex items-center gap-1.5">
              <div
                ref={categorySliderRef}
                className="flex flex-1 gap-2 overflow-x-auto pb-1 scrollbar-none snap-x"
              >
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`snap-start whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                      activeCategoryId === cat.id
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Clean Full-Width Menu Cards List */}
            <div className="space-y-2.5">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-xs font-semibold">
                    No dishes found matching &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              ) : (
                filteredProducts.map(product => {
                  const isOutOfStock =
                    !product.inStock ||
                    (product.stockQuantity !== undefined && product.stockQuantity <= 0);
                  const isLowStock =
                    !isOutOfStock &&
                    product.stockQuantity !== undefined &&
                    product.stockQuantity <= (product.lowStockThreshold ?? 5);

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOutOfStock && setSelectedProduct(product)}
                      className={`group flex items-center gap-3.5 rounded-2xl border bg-white p-3 shadow-2xs transition dark:bg-slate-950 ${
                        !isOutOfStock
                          ? 'border-slate-200 hover:border-emerald-500/50 cursor-pointer dark:border-slate-800'
                          : 'border-slate-200 opacity-65 dark:border-slate-800'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`h-full w-full object-cover transition duration-300 ${
                            !isOutOfStock ? 'group-hover:scale-105' : 'grayscale'
                          }`}
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/65 flex items-center justify-center p-1 text-center">
                            <span className="text-[9px] font-black uppercase text-white">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {product.name}
                          </h3>
                        </div>

                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                          {product.description}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs tabular-nums">
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              ₱{product.price.toFixed(2)}
                            </span>
                            {product.calories && (
                              <span className="text-[10px] text-slate-400">
                                · {product.calories} kcal
                              </span>
                            )}
                            {isLowStock && (
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                · {product.stockQuantity} left
                              </span>
                            )}
                          </div>

                          {!isOutOfStock ? (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                              }}
                              className="flex items-center gap-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 transition active:scale-95"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}

      {/* Floating Bottom Cart / Bag Bar */}
      {cartItemCount > 0 && activeTab === 'menu' && (
        <div className="sticky bottom-3 mx-4 z-30">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="w-full flex items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3.5 text-white shadow-xl shadow-emerald-600/35 transition hover:bg-emerald-500 active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-xs font-black tabular-nums">
                {cartItemCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold">View Order Bag &amp; Checkout</p>
                <p className="text-[10px] text-emerald-100">
                  Table #{activeTable.tableNumber} · {cartItemCount}{' '}
                  {cartItemCount === 1 ? 'item' : 'items'} ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-black text-sm tabular-nums">
              <span>₱{cartSubtotal.toFixed(2)}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onProceedToCheckout={() => setCheckoutModalOpen(true)}
      />

      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderPlaced={(_, placedOrder) => {
          setActiveTab('status');
          if (placedOrder.paymentStatus === 'paid') {
            setPendingFeedbackOrder(placedOrder);
          } else {
            setConfirmedReceiptOrder(placedOrder);
          }
        }}
      />

      <CustomerFeedbackModal
        order={pendingFeedbackOrder}
        isOpen={!!pendingFeedbackOrder}
        onClose={() => setPendingFeedbackOrder(null)}
        onOpenReceipt={ord => setConfirmedReceiptOrder(ord)}
      />

      <ReceiptModal
        order={confirmedReceiptOrder}
        isOpen={!!confirmedReceiptOrder}
        onClose={() => setConfirmedReceiptOrder(null)}
        isPostPayment={true}
        onContinueToTracker={() => setActiveTab('status')}
        onExitTable={exitTableSession}
      />

      <QRScannerModal isOpen={qrScannerOpen} onClose={() => setQrScannerOpen(false)} />

      <OrderHistoryModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} />

      <CallWaiterModal isOpen={waiterModalOpen} onClose={() => setWaiterModalOpen(false)} />

      <LoyaltyModal
        isOpen={loyaltyModalOpen}
        onClose={() => setLoyaltyModalOpen(false)}
        onOpenCart={() => setCartDrawerOpen(true)}
      />

      <EmployeeSignInModal isOpen={signInModalOpen} onClose={() => setSignInModalOpen(false)} />

      <VoiceOrderModal
        isOpen={voiceOrderOpen}
        onClose={() => setVoiceOrderOpen(false)}
        onOpenCart={() => setCartDrawerOpen(true)}
      />

      <MealComboBuilderModal
        isOpen={comboBuilderOpen}
        onClose={() => setComboBuilderOpen(false)}
      />
    </div>
  );
};
