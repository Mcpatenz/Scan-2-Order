import React, { useMemo, useState } from 'react';
import {
  QrCode,
  ScanLine,
  ShieldCheck,
  Search,
  Plus,
  LogOut,
  ChevronRight,
  Flame,
  ShoppingBag,
  LogIn,
  Mic,
  Utensils,
  User,
  MapPin,
  Phone,
  Clock,
} from 'lucide-react';
import { useOrderContext } from '../../context/OrderContext';
import { formatTime12Hour } from '../Admin/AdminSettingsManager';
import { Product, Order } from '../../types';
import { QRScannerModal } from './QRScannerModal';
import { EmployeeSignInModal } from '../Common/EmployeeSignInModal';
import { ProductModal } from './ProductModal';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { VoiceOrderModal } from './VoiceOrderModal';
import { ReceiptModal } from '../Common/ReceiptModal';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MealComboBuilderModal } from './MealComboBuilderModal';
import { TRANSLATIONS } from '../../i18n/customerTranslations';

export const CustomerLanding: React.FC = () => {
  const {
    categories,
    products,
    cart,
    cartSubtotal,
    isTableSelected,
    canOrder,
    currentEmployee,
    logoutEmployee,
    showToast,
    customerLanguage,
    businessSettings,
  } = useOrderContext();

  const t = TRANSLATIONS[customerLanguage];

  const [scannerOpen, setScannerOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('cat-all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [voiceOrderOpen, setVoiceOrderOpen] = useState(false);
  const [comboBuilderOpen, setComboBuilderOpen] = useState(false);
  const [confirmedReceiptOrder, setConfirmedReceiptOrder] = useState<Order | null>(null);

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      if (activeCategoryId === 'cat-all') return matchesSearch;
      if (activeCategoryId === 'cat-popular') return matchesSearch && p.isPopular;
      return matchesSearch && p.categoryId === activeCategoryId;
    });
  }, [products, searchQuery, activeCategoryId]);

  // A scanned table QR waives the login requirement. Without one, the customer must
  // sign in before items can be added to the cart.
  const requireSignIn = () => {
    showToast('🔒 Please sign in first to start your order.');
    setSignInOpen(true);
  };

  const handleProductTap = (product: Product) => {
    if (!canOrder) {
      requireSignIn();
      return;
    }
    setSelectedProduct(product);
  };

  // Ordering always needs a table, so a signed-in customer without one is asked to scan.
  const handleProceedToCheckout = () => {
    setCartDrawerOpen(false);
    if (!isTableSelected) {
      showToast('📷 Scan your table QR code to place the order.');
      setScannerOpen(true);
      return;
    }
    setCheckoutOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-24 text-slate-900 dark:bg-slate-900 dark:text-white">
      {/* Top Landing Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20">
              <Utensils className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white block">
                {businessSettings.businessName}
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
                Open {formatTime12Hour(businessSettings.timeOpen)} – {formatTime12Hour(businessSettings.timeClosed)} · {businessSettings.contactNumber}
              </span>
            </div>
          </div>

          {/* Language Switcher on Landing Page */}
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher compact />
          </div>
        </div>
        {businessSettings.address && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
            <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
            <span className="truncate">{businessSettings.address}</span>
          </div>
        )}
      </div>

      {/* Action Cards */}
      <div className="space-y-2.5 px-4 pt-4">
        {/* Scan card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/25">
            <QrCode className="h-7 w-7 text-emerald-500" />
          </div>

          <h2 className="mt-3.5 text-sm font-black tracking-tight text-slate-900 dark:text-white">
            {t.scanTableQrTitle}
          </h2>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            {t.scanTableQrDesc}
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition active:scale-[0.98]"
            >
              <ScanLine className="h-4 w-4" />
              <span>{t.scanTableQrBtn}</span>
            </button>

            {currentEmployee ? (
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{currentEmployee.firstName}</span>
                </div>
                <button
                  type="button"
                  onClick={logoutEmployee}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 active:scale-95 transition"
                  title={t.signOutBtn}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.signOutBtn}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSignInOpen(true)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 px-4 py-3.5 text-sm font-black text-slate-800 dark:text-white transition active:scale-[0.98]"
              >
                <LogIn className="h-4 w-4 text-emerald-500" />
                <span>{t.signInBtn}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div className="mt-5 space-y-3 px-4">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-sm font-black tracking-tight">{t.browseMenuTitle}</h2>
          <span className="text-[10px] font-bold text-slate-400">
            {canOrder ? t.tapPlusToAdd : t.signInToAdd}
          </span>
        </div>

        {/* Search + Voice Order */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (!canOrder) {
                requireSignIn();
                return;
              }
              setVoiceOrderOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500 active:scale-95 transition shrink-0"
            title={t.voiceOrderBtn}
          >
            <Mic className="h-4 w-4" />
            <span>{t.voiceOrderBtn}</span>
          </button>
        </div>

        {/* Custom Meal Combo Banner */}
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950 to-teal-950 p-3 text-white shadow-sm">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-amber-400 px-1.5 py-0.2 text-[8px] font-black uppercase text-slate-950">
                Save 15%
              </span>
              <span className="text-xs font-black text-white truncate">
                Build Custom Meal Combo
              </span>
            </div>
            <p className="text-[10px] text-emerald-200 truncate mt-0.5">
              Select 1 Main + 1 Side + 1 Drink with dynamic pricing
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!canOrder) {
                requireSignIn();
                return;
              }
              setComboBuilderOpen(true);
            }}
            className="shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-[11px] font-black text-slate-950 transition active:scale-95"
          >
            Build Combo
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeCategoryId === cat.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product list */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-10 text-center text-xs font-semibold text-slate-400">
              No products found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredProducts.map(product => {
              const isOutOfStock =
                !product.inStock ||
                (product.stockQuantity !== undefined && product.stockQuantity <= 0);

              return (
                <div
                  key={product.id}
                  className={`group relative flex gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xs transition dark:border-slate-800 dark:bg-slate-950 ${
                    isOutOfStock ? 'opacity-70' : 'hover:border-emerald-500/50'
                  }`}
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`h-full w-full object-cover ${isOutOfStock ? 'grayscale' : ''}`}
                    />
                    {product.isPopular && !isOutOfStock && (
                      <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-md bg-amber-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-950">
                        <Flame className="h-2.5 w-2.5 fill-slate-950" /> Hot
                      </span>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <h3 className="truncate text-xs font-extrabold leading-snug">{product.name}</h3>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                      {product.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-1.5">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ₱{product.price.toFixed(2)}
                      </span>

                      <button
                        disabled={isOutOfStock}
                        onClick={() => handleProductTap(product)}
                        title={
                          canOrder ? `Add ${product.name}` : `Sign in to order ${product.name}`
                        }
                        aria-label={
                          canOrder ? `Add ${product.name}` : `Sign in to order ${product.name}`
                        }
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-90 ${
                          isOutOfStock
                            ? 'cursor-not-allowed text-slate-400 dark:text-slate-500'
                            : 'text-blue-500 hover:text-blue-400'
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reassurance */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <p className="text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            {t.reassuranceText}
          </p>
        </div>
      </div>

      {/* Floating Cart Bar */}
      {cartItemCount > 0 && (
        <div className="sticky bottom-3 mx-4 z-30">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-emerald-600 px-5 py-3.5 text-white shadow-xl shadow-emerald-600/40 transition hover:bg-emerald-500 active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="h-4 w-4" />
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-black text-emerald-700">
                  {cartItemCount}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold">{t.viewOrderCart}</p>
                <p className="text-[10px] text-emerald-100">
                  {isTableSelected ? t.tableReady : t.scanOrSignInToOrder}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-black text-sm">
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
        onProceedToCheckout={handleProceedToCheckout}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderPlaced={(_, placedOrder) => {
          setCheckoutOpen(false);
          setConfirmedReceiptOrder(placedOrder);
        }}
      />

      <ReceiptModal
        order={confirmedReceiptOrder}
        isOpen={!!confirmedReceiptOrder}
        onClose={() => setConfirmedReceiptOrder(null)}
        isPostPayment={true}
      />

      <QRScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />

      <EmployeeSignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />

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
