import React, { useMemo, useState } from 'react';
import {
  QrCode,
  ScanLine,
  Utensils,
  ShieldCheck,
  Sparkles,
  Search,
  Plus,
  LogOut,
  ChevronRight,
  Flame,
  ShoppingBag,
} from 'lucide-react';
import { useOrderContext } from '../../context/OrderContext';
import { Product } from '../../types';
import { QRScannerModal } from './QRScannerModal';
import { EmployeeSignInModal } from '../Common/EmployeeSignInModal';
import { ProductModal } from './ProductModal';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';

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
  } = useOrderContext();

  const [scannerOpen, setScannerOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('cat-all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-900 px-5 pt-10 pb-14 text-white">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-teal-300/10 blur-2xl"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-md ring-1 ring-white/25 shadow-lg">
            <Utensils className="h-8 w-8" />
          </div>

          <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="h-3 w-3" /> Gourmet Bistro
          </span>

          <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight">
            Scan. Order. Enjoy.
          </h1>
          <p className="mt-2 max-w-[19rem] text-xs font-medium leading-relaxed text-emerald-50/90">
            Browse our menu and order from your seat. No app download, no waiting to be seated.
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="-mt-8 space-y-2.5 px-4">
        {/* Signed in state */}
        {currentEmployee ? (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <img
              src={currentEmployee.photo}
              alt={currentEmployee.firstName}
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-emerald-500/40"
              onError={e => {
                (e.target as HTMLElement).setAttribute(
                  'src',
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
                );
              }}
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-black text-emerald-500">
                {currentEmployee.firstName} {currentEmployee.lastName}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Signed in as {currentEmployee.role}
              </p>
            </div>
            <button
              onClick={logoutEmployee}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white/60 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        ) : null}

        {/* Scan card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/25">
            <QrCode className="h-7 w-7 text-emerald-500" />
          </div>

          <h2 className="mt-3.5 text-sm font-black tracking-tight text-slate-900 dark:text-white">
            Scan your table QR code
          </h2>
          <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            Scanning your table links the order to your seat &mdash; no sign-in needed.
          </p>

          <button
            onClick={() => setScannerOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/25 transition active:scale-[0.98]"
          >
            <ScanLine className="h-4 w-4" />
            <span>Scan Table QR</span>
          </button>
        </div>
      </div>

      {/* Catalog */}
      <div className="mt-5 space-y-3 px-4">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-sm font-black tracking-tight">Browse Menu</h2>
          <span className="text-[10px] font-bold text-slate-400">
            {canOrder ? 'Tap + to add' : 'Sign in to add'}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search chicken, burgers, pasta, drinks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
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
                !product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0);

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
                        ${product.price.toFixed(2)}
                      </span>

                      <button
                        disabled={isOutOfStock}
                        onClick={() => handleProductTap(product)}
                        title={canOrder ? `Add ${product.name}` : `Sign in to order ${product.name}`}
                        aria-label={canOrder ? `Add ${product.name}` : `Sign in to order ${product.name}`}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition active:scale-90 ${
                          isOutOfStock
                            ? 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            : 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-500'
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
            Your cart stays on this device. Scanning your table QR is the fastest way to order &mdash;
            it links the order to your seat with no account needed.
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
                <p className="text-xs font-extrabold">View Order Cart</p>
                <p className="text-[10px] text-emerald-100">
                  {isTableSelected ? 'Table ready' : 'Sign in or scan to order'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-black text-sm">
              <span>${cartSubtotal.toFixed(2)}</span>
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
        onOrderPlaced={() => setCheckoutOpen(false)}
      />

      <QRScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />

      <EmployeeSignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
    </div>
  );
};
