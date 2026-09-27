import React, { useState, useEffect, useRef } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Product, OrderStatus } from '../../types';
import {
  Search,
  QrCode,
  ShoppingBag,
  Flame,
  Plus,
  Clock,
  GlassWater,
  History,
  Sparkles,
  Utensils,
  ChevronRight,
  Bell,
  AlertCircle,
  Award,
} from 'lucide-react';
import { ProductModal } from './ProductModal';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { QRScannerModal } from './QRScannerModal';
import { OrderTracker } from './OrderTracker';
import { OrderHistoryModal } from './OrderHistoryModal';
import { CallWaiterModal } from '../Common/CallWaiterModal';
import { LoyaltyModal } from './LoyaltyModal';
import { OrderStatusToast, StatusToastNotification } from './OrderStatusToast';

export const CustomerHome: React.FC = () => {
  const {
    activeTable,
    categories,
    products,
    cart,
    cartSubtotal,
    currentCustomerOrder,
    loyaltyPoints,
  } = useOrderContext();

  const [activeCategoryId, setActiveCategoryId] = useState<string>('cat-all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [loyaltyModalOpen, setLoyaltyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'status'>('menu');

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

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeCategoryId === 'cat-all') return matchesSearch;
    if (activeCategoryId === 'cat-popular') return matchesSearch && p.isPopular;
    return matchesSearch && p.categoryId === activeCategoryId;
  });

  return (
    <div className="flex flex-col min-h-full pb-20 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      
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

      {/* Top Mobile Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
                  Table #{activeTable.tableNumber}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Central Branch • {activeTable.section}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Loyalty Points Badge */}
            <button
              onClick={() => setLoyaltyModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-black text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 active:scale-95 transition shadow-2xs"
              title="Gourmet Rewards & Points"
            >
              <Award className="h-4 w-4 text-amber-500" />
              <span>{loyaltyPoints} <span className="text-[10px] font-bold opacity-80">PTS</span></span>
            </button>

            {/* Scan QR Button */}
            <button
              onClick={() => setQrScannerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/80 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
              title="Scan Table QR"
            >
              <QrCode className="h-4 w-4 text-emerald-500" />
              <span className="hidden sm:inline">Scan QR</span>
            </button>

            {/* History Button */}
            <button
              onClick={() => setHistoryModalOpen(true)}
              className="rounded-xl border border-slate-200 bg-slate-100/80 p-2 text-slate-600 hover:bg-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
              title="Order History"
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs: Menu vs Order Status */}
        <div className="mt-3 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'menu'
                ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            🍔 Menu Catalog
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'status'
                ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-900 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Live Tracker</span>
            {currentCustomerOrder && (
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {activeTab === 'status' ? (
        <div className="p-4">
          <OrderTracker />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-5 text-white shadow-lg">
            <div className="relative z-10 space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="h-3 w-3" /> Quick QR Ordering
              </span>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                Welcome to Table #{activeTable.tableNumber}!
              </h2>
              <p className="text-xs text-emerald-100 max-w-xs">
                Select items, add special kitchen instructions, and send orders directly to our chefs.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search chicken, burgers, pasta, drinks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeCategoryId === cat.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <p className="text-xs font-semibold">No products found matching "{searchQuery}"</p>
              </div>
            ) : (
              filteredProducts.map(product => {
                const isOutOfStock = !product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0);
                const isLowStock = !isOutOfStock && product.stockQuantity !== undefined && product.stockQuantity <= (product.lowStockThreshold ?? 5);

                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && setSelectedProduct(product)}
                    className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-3 shadow-2xs transition hover:shadow-md dark:bg-slate-900 ${
                      !isOutOfStock
                        ? 'border-slate-200 hover:border-emerald-500/50 cursor-pointer dark:border-slate-800'
                        : 'border-slate-200 opacity-75 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-2.5">
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`h-full w-full object-cover transition duration-300 ${!isOutOfStock ? 'group-hover:scale-105' : 'grayscale opacity-75'}`}
                        />
                        {product.isPopular && !isOutOfStock && (
                          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950 shadow-xs">
                            <Flame className="h-3 w-3 fill-slate-950" /> Hot
                          </span>
                        )}
                        {isLowStock && (
                          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950 shadow-md">
                            Only {product.stockQuantity} Left
                          </span>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
                            <span className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                          {product.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    {/* Price & Add Trigger */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          ₱{product.price.toFixed(2)}
                        </span>
                        {product.calories && (
                          <span className="ml-2 text-[10px] text-slate-400">
                            {product.calories} kcal
                          </span>
                        )}
                      </div>

                      <button
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) setSelectedProduct(product);
                        }}
                        className={`flex h-8 items-center gap-1 rounded-xl px-3 text-xs font-bold transition shadow-xs ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
                        }`}
                      >
                        {isOutOfStock ? (
                          'Out of Stock'
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cartItemCount > 0 && activeTab === 'menu' && (
        <div className="sticky bottom-3 mx-4 z-30">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="w-full flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-3.5 text-white shadow-xl shadow-emerald-600/40 transition hover:bg-emerald-500 active:scale-98 animate-bounce"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-xs font-black">
                {cartItemCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold">View Order Cart</p>
                <p className="text-[10px] text-emerald-100">Table #{activeTable.tableNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-black text-sm">
              <span>₱{cartSubtotal.toFixed(2)}</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* Floating Call Waiter Button */}
      <button
        onClick={() => setWaiterModalOpen(true)}
        className="fixed bottom-20 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition active:scale-90 border border-slate-700"
        title="Call Waiter Service"
      >
        <GlassWater className="h-5 w-5" />
      </button>

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
        onOrderPlaced={() => setActiveTab('status')}
      />

      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
      />

      <OrderHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />

      <CallWaiterModal
        isOpen={waiterModalOpen}
        onClose={() => setWaiterModalOpen(false)}
      />

      <LoyaltyModal
        isOpen={loyaltyModalOpen}
        onClose={() => setLoyaltyModalOpen(false)}
        onOpenCart={() => setCartDrawerOpen(true)}
      />

    </div>
  );
};
