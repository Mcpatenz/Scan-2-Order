import React, { useState, useMemo, useRef } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Order, OrderItem, OrderStatus, Product } from '../../types';
import {
  History,
  RotateCcw,
  Receipt,
  Search,
  ShoppingBag,
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Utensils,
  CalendarClock,
  ArrowRight,
  Flame,
  Printer,
  Star,
} from 'lucide-react';
import { ReceiptModal } from '../Common/ReceiptModal';

interface OrderHistoryViewProps {
  onOpenBag?: () => void;
  onOpenTracker?: () => void;
  onCustomizeProduct?: (product: Product) => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  onOpenBag,
  onOpenTracker,
  onCustomizeProduct,
}) => {
  const {
    orders,
    customerOrderHistory,
    activeTable,
    products,
    addToCart,
    cart,
    showToast,
    setPendingFeedbackOrder,
  } = useOrderContext();

  const [scopeFilter, setScopeFilter] = useState<'all' | 'table'>('table');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7d' | '30d'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'active' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [recentlyReorderedId, setRecentlyReorderedId] = useState<string | null>(null);
  const reorderSliderRef = useRef<HTMLDivElement | null>(null);

  const slideReorder = (dir: 'left' | 'right') => {
    if (!reorderSliderRef.current) return;
    reorderSliderRef.current.scrollBy({
      left: dir === 'left' ? -260 : 260,
      behavior: 'smooth',
    });
  };

  const baseOrders = useMemo(() => {
    if (scopeFilter === 'table') {
      return customerOrderHistory;
    }
    // Sort newest first
    return [...orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [scopeFilter, customerOrderHistory, orders]);

  // Extract unique past ordered items for "Quick Reorder Again" carousel
  const frequentItems = useMemo(() => {
    const map = new Map<
      string,
      {
        item: OrderItem;
        product: Product | undefined;
        timesOrdered: number;
        lastOrderedAt: string;
        lastOrderId: string;
      }
    >();

    baseOrders.forEach(order => {
      if (order.status === 'cancelled') return;
      order.items.forEach(item => {
        const key = `${item.productId}-${(item.modifiers || [])
          .map(m => m.optionId)
          .sort()
          .join(',')}`;
        const existing = map.get(key);
        const product = products.find(p => p.id === item.productId);
        if (existing) {
          existing.timesOrdered += item.quantity;
        } else {
          map.set(key, {
            item,
            product,
            timesOrdered: item.quantity,
            lastOrderedAt: order.createdAt,
            lastOrderId: order.id,
          });
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.timesOrdered - a.timesOrdered);
  }, [baseOrders, products]);

  const isProductAvailable = (productId: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return false;
    return p.inStock && (p.stockQuantity === undefined || p.stockQuantity > 0);
  };

  const getProductImage = (productId: string) => {
    return (
      products.find(p => p.id === productId)?.image ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
    );
  };

  const getQtyForItemKey = (key: string, defaultQty: number) => {
    return itemQuantities[key] ?? defaultQty;
  };

  const setQtyForItemKey = (key: string, nextQty: number) => {
    setItemQuantities(prev => ({
      ...prev,
      [key]: Math.max(1, Math.min(20, nextQty)),
    }));
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderIds(prev => ({
      ...prev,
      [orderId]: prev[orderId] === undefined ? false : !prev[orderId],
    }));
  };

  const isOrderExpanded = (orderId: string, index: number) => {
    if (expandedOrderIds[orderId] !== undefined) {
      return expandedOrderIds[orderId];
    }
    // Expand first 2 orders by default so users can immediately see items & reorder
    return index < 2;
  };

  const handleReorderSingleItem = (
    e: React.MouseEvent,
    item: OrderItem,
    customQty?: number,
    feedbackKey?: string
  ) => {
    e.stopPropagation();
    const matchedProd = products.find(p => p.id === item.productId);
    if (!matchedProd || !isProductAvailable(item.productId)) {
      showToast(`Sorry, "${item.productName}" is currently out of stock.`);
      return;
    }

    const qtyToAdd = customQty ?? item.quantity;
    addToCart({
      product: matchedProd,
      quantity: qtyToAdd,
      selectedModifiers: item.modifiers || [],
      notes: item.notes,
    });

    if (feedbackKey) {
      setRecentlyReorderedId(feedbackKey);
      setTimeout(() => {
        setRecentlyReorderedId(prev => (prev === feedbackKey ? null : prev));
      }, 1800);
    }
  };

  const handleReorderFullOrder = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    let addedCount = 0;
    let skippedCount = 0;

    order.items.forEach(item => {
      const matchedProd = products.find(p => p.id === item.productId);
      if (matchedProd && isProductAvailable(item.productId)) {
        addToCart({
          product: matchedProd,
          quantity: item.quantity,
          selectedModifiers: item.modifiers || [],
          notes: item.notes,
        });
        addedCount += item.quantity;
      } else {
        skippedCount += 1;
      }
    });

    if (addedCount > 0) {
      setRecentlyReorderedId(`order-${order.id}`);
      setTimeout(() => {
        setRecentlyReorderedId(prev => (prev === `order-${order.id}` ? null : prev));
      }, 2000);

      if (skippedCount > 0) {
        showToast(
          `Reordered ${addedCount} item(s) from #${order.id} (${skippedCount} unavailable skipped).`
        );
      } else {
        showToast(`Reordered all items from Order #${order.id} into your bag!`);
      }
    } else {
      showToast('All items from this order are currently out of stock.');
    }
  };

  const getStatusDisplay = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
        };
      case 'ready':
        return {
          label: 'Ready to Serve',
          color: 'text-emerald-600 dark:text-emerald-400',
          dot: 'bg-emerald-500 animate-ping',
          icon: <Bell className="h-3.5 w-3.5 text-emerald-500" />,
        };
      case 'preparing':
        return {
          label: 'Preparing in Kitchen',
          color: 'text-amber-600 dark:text-amber-400',
          dot: 'bg-amber-500 animate-pulse',
          icon: <ChefHat className="h-3.5 w-3.5 text-amber-500" />,
        };
      case 'accepted':
        return {
          label: 'Confirmed',
          color: 'text-sky-600 dark:text-sky-400',
          dot: 'bg-sky-500',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" />,
        };
      case 'pending':
        return {
          label: 'Pending Kitchen',
          color: 'text-amber-600 dark:text-amber-400',
          dot: 'bg-amber-500 animate-pulse',
          icon: <Clock className="h-3.5 w-3.5 text-amber-500" />,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: 'text-rose-600 dark:text-rose-400',
          dot: 'bg-rose-500',
          icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
        };
    }
  };

  const isWithinDays = (isoDate: string, days: number) => {
    const orderTime = new Date(isoDate).getTime();
    if (isNaN(orderTime)) return true;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return orderTime >= cutoff;
  };

  const countLast7Days = useMemo(
    () => baseOrders.filter(o => isWithinDays(o.createdAt, 7)).length,
    [baseOrders]
  );

  const countLast30Days = useMemo(
    () => baseOrders.filter(o => isWithinDays(o.createdAt, 30)).length,
    [baseOrders]
  );

  const filteredOrders = useMemo(() => {
    return baseOrders.filter(ord => {
      if (dateRangeFilter === '7d' && !isWithinDays(ord.createdAt, 7)) {
        return false;
      }
      if (dateRangeFilter === '30d' && !isWithinDays(ord.createdAt, 30)) {
        return false;
      }

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ord.id.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.items.some(
          i =>
            i.productName.toLowerCase().includes(q) ||
            (i.notes && i.notes.toLowerCase().includes(q)) ||
            (i.modifiers && i.modifiers.some(m => m.optionName.toLowerCase().includes(q)))
        );

      let matchesStatus = true;
      if (statusFilter === 'completed') {
        matchesStatus = ord.status === 'completed';
      } else if (statusFilter === 'active') {
        matchesStatus =
          ord.status === 'pending' ||
          ord.status === 'accepted' ||
          ord.status === 'preparing' ||
          ord.status === 'ready';
      } else if (statusFilter === 'cancelled') {
        matchesStatus = ord.status === 'cancelled';
      }

      return matchesSearch && matchesStatus;
    });
  }, [baseOrders, dateRangeFilter, searchQuery, statusFilter]);

  const completedCount = baseOrders.filter(o => o.status === 'completed').length;
  const activeCount = baseOrders.filter(
    o =>
      o.status === 'pending' ||
      o.status === 'accepted' ||
      o.status === 'preparing' ||
      o.status === 'ready'
  ).length;
  const totalTableSpent = filteredOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const cartItemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <History className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">
                My Orders · Table #{activeTable.tableNumber}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                {baseOrders.length} {baseOrders.length === 1 ? 'order' : 'orders'} · {completedCount} done · {activeCount} active · ₱{totalTableSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Scope Segmented Control: Full-width clean toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setScopeFilter('table')}
            className={`rounded-lg py-1.5 px-2 text-[11px] font-bold transition truncate ${
              scopeFilter === 'table'
                ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Table #{activeTable.tableNumber} ({customerOrderHistory.length})
          </button>
          <button
            onClick={() => setScopeFilter('all')}
            className={`rounded-lg py-1.5 px-2 text-[11px] font-bold transition truncate ${
              scopeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All Tables ({orders.length})
          </button>
        </div>

        {/* Cart Quick Jump Banner when items are in bag */}
        {cartItemCount > 0 && onOpenBag && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs min-w-0">
              <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in Order Bag
              </span>
            </div>
            <button
              onClick={onOpenBag}
              className="shrink-0 flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-emerald-500 transition"
            >
              <span>Checkout</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Quick Reorder Again Slider (Individual Past Dishes - Clean Horizontal Carousel) */}
      {frequentItems.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Order Again in 1 Tap</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Swipe your favorite past dishes with saved options
              </p>
            </div>

            {frequentItems.length > 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => slideReorder('left')}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 active:scale-95 transition"
                  aria-label="Slide previous dishes"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => slideReorder('right')}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 active:scale-95 transition"
                  aria-label="Slide next dishes"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div
            ref={reorderSliderRef}
            className="flex gap-3 overflow-x-auto pb-1 pt-0.5 snap-x snap-mandatory scrollbar-none"
          >
            {frequentItems.slice(0, 6).map((entry, idx) => {
              const available = isProductAvailable(entry.item.productId);
              const unitPrice =
                entry.item.quantity > 0
                  ? entry.item.itemTotal / entry.item.quantity
                  : entry.item.price;
              const feedbackKey = `freq-${idx}-${entry.item.productId}`;
              const isJustAdded = recentlyReorderedId === feedbackKey;

              return (
                <div
                  key={feedbackKey}
                  className="snap-start shrink-0 w-64 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3 flex flex-col justify-between gap-2.5 dark:border-slate-800 dark:bg-slate-950/70"
                >
                  {/* Top Info Row */}
                  <div className="flex items-start gap-2.5">
                    <img
                      src={getProductImage(entry.item.productId)}
                      alt={entry.item.productName}
                      className={`h-12 w-12 rounded-xl object-cover shrink-0 ${
                        !available ? 'grayscale opacity-60' : ''
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-1">
                        {entry.item.productName}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {entry.item.modifiers && entry.item.modifiers.length > 0
                          ? entry.item.modifiers.map(m => m.optionName).join(' · ')
                          : 'Standard preparation'}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] tabular-nums">
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          ₱{unitPrice.toFixed(2)}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          Ordered {entry.timesOrdered}x
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Row (Never overlaps) */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
                    {entry.product && available && onCustomizeProduct && (
                      <button
                        type="button"
                        onClick={() => onCustomizeProduct(entry.product!)}
                        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 transition shrink-0"
                      >
                        Customize
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!available}
                      onClick={e =>
                        handleReorderSingleItem(e, entry.item, 1, feedbackKey)
                      }
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-1.5 px-3 text-[11px] font-black transition ${
                        !available
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                          : isJustAdded
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-2xs'
                      }`}
                    >
                      {!available ? (
                        <span>Sold Out</span>
                      ) : isJustAdded ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Added to Bag!</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-3 w-3 shrink-0" />
                          <span>+1 Reorder</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search, Time Range ('Last 7 Days', 'Last 30 Days', 'All Orders') & Status Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search past orders by Order #ID, dish name, or special note..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {/* Date Range Filter Segmented Control */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3 w-3 text-emerald-500" />
              Filter by Time Period
            </span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">
              Showing {filteredOrders.length} of {baseOrders.length} orders
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(
              [
                { id: '7d', label: 'Last 7 Days', count: countLast7Days },
                { id: '30d', label: 'Last 30 Days', count: countLast30Days },
                { id: 'all', label: 'All Orders', count: baseOrders.length },
              ] as const
            ).map(period => (
              <button
                key={period.id}
                type="button"
                onClick={() => setDateRangeFilter(period.id)}
                className={`flex items-center justify-center gap-1 rounded-lg py-2 px-2 text-xs font-extrabold transition ${
                  dateRangeFilter === period.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <span className="truncate">{period.label}</span>
                <span
                  className={`text-[10px] font-black tabular-nums ${
                    dateRangeFilter === period.id
                      ? 'text-emerald-100'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  ({period.count})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(
            [
              { id: 'all', label: `All Status (${baseOrders.length})` },
              { id: 'completed', label: `Past / Completed (${completedCount})` },
              { id: 'active', label: `Active (${activeCount})` },
              { id: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Past Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2 dark:border-slate-800 dark:bg-slate-900">
          <ShoppingBag className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">
            No matching orders found
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Try clearing your search filter or switch to &ldquo;All Orders&rdquo; to see your full dining history.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order, idx) => {
            const expanded = isOrderExpanded(order.id, idx);
            const statusInfo = getStatusDisplay(order.status);
            const totalItemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
            const isOrderJustReordered = recentlyReorderedId === `order-${order.id}`;

            return (
              <div
                key={order.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-emerald-500/40 dark:border-slate-800 dark:bg-slate-900 space-y-3"
              >
                {/* Order Header */}
                <div
                  onClick={() => toggleOrderExpand(order.id)}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        Order #{order.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-bold ${statusInfo.color}`}
                      >
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </span>
                      <span className="rounded-lg border border-slate-200 dark:border-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        Table #{order.tableNumber} · {order.diningOption === 'dine_in' ? 'Dine-In' : 'Takeout'}
                      </span>
                      {order.feedback && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
                          ★ {order.feedback.rating}/5 Rated
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                      </span>
                      {order.isScheduled && order.scheduledFor && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                            <CalendarClock className="h-3 w-3" />
                            Scheduled: {order.scheduledFor}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        ₱{order.total.toFixed(2)}
                      </p>
                      <span
                        className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title={expanded ? 'Collapse items' : 'Expand items'}
                    >
                      {expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Order Note if present */}
                {order.notes && (
                  <p className="text-[11px] italic text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-1.5">
                    Order Note: &ldquo;{order.notes}&rdquo;
                  </p>
                )}

                {/* Collapsed Summary Pills */}
                {!expanded && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {order.items.map((i, itemIdx) => (
                      <span
                        key={itemIdx}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                      >
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                          {i.quantity}x
                        </span>
                        <span className="truncate max-w-[180px]">{i.productName}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded Item List with Clean 2-Row Individual Reorder Controls (Never Overlaps) */}
                {expanded && (
                  <div className="space-y-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Order Items · Adjust Qty &amp; Reorder Individually
                      </span>
                    </div>
                    {order.items.map((item, itemIdx) => {
                      const available = isProductAvailable(item.productId);
                      const itemKey = `${order.id}-${item.id || itemIdx}`;
                      const selectedQty = getQtyForItemKey(itemKey, item.quantity);
                      const unitPrice =
                        item.quantity > 0 ? item.itemTotal / item.quantity : item.price;
                      const isItemJustAdded = recentlyReorderedId === itemKey;

                      return (
                        <div
                          key={itemKey}
                          className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3 dark:border-slate-800 dark:bg-slate-950/70 space-y-2.5 transition hover:border-emerald-500/30"
                        >
                          {/* Top Row: Thumbnail + Dish Details + Item Total */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <img
                                src={getProductImage(item.productId)}
                                alt={item.productName}
                                className={`h-12 w-12 rounded-xl object-cover shrink-0 border border-slate-200/60 dark:border-slate-800 ${
                                  !available ? 'grayscale opacity-50' : ''
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="inline-flex items-center justify-center rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                                    {item.quantity}x
                                  </span>
                                  <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug break-words">
                                    {item.productName}
                                  </span>
                                  {!available && (
                                    <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-rose-500">
                                      Sold Out
                                    </span>
                                  )}
                                </div>

                                {item.modifiers && item.modifiers.length > 0 && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                    {item.modifiers
                                      .map(m => `${m.groupName}: ${m.optionName}`)
                                      .join(' · ')}
                                  </p>
                                )}

                                {item.notes && (
                                  <p className="text-[11px] italic text-amber-600 dark:text-amber-400 mt-0.5">
                                    Note: &ldquo;{item.notes}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums block">
                                ₱{item.itemTotal.toFixed(2)}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 tabular-nums block">
                                ₱{unitPrice.toFixed(2)} each
                              </span>
                            </div>
                          </div>

                          {/* Bottom Row: Dedicated Stepper & 1-Tap Reorder Button (Zero Overlap) */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/80">
                            {available ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  Qty:
                                </span>
                                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1.5 py-1 dark:border-slate-700 dark:bg-slate-900 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setQtyForItemKey(itemKey, selectedQty - 1);
                                    }}
                                    className="flex h-5 w-5 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                                    title="Decrease reorder quantity"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-black text-slate-900 dark:text-white tabular-nums">
                                    {selectedQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      setQtyForItemKey(itemKey, selectedQty + 1);
                                    }}
                                    className="flex h-5 w-5 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                                    title="Increase reorder quantity"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-500">
                                Currently unavailable for reorder
                              </span>
                            )}

                            <button
                              type="button"
                              disabled={!available}
                              onClick={e =>
                                handleReorderSingleItem(e, item, selectedQty, itemKey)
                              }
                              className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition ${
                                !available
                                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                                  : isItemJustAdded
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 shadow-xs'
                              }`}
                            >
                              {!available ? (
                                <span>Unavailable</span>
                              ) : isItemJustAdded ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  <span>Added to Bag!</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="h-3 w-3 shrink-0" />
                                  <span>
                                    Reorder {selectedQty}x · ₱{(unitPrice * selectedQty).toFixed(2)}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Order Footer Actions - Clean Responsive Grid/Flex */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedReceiptOrder(order);
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition active:scale-95 ${
                        order.paymentStatus === 'unpaid' && order.status !== 'cancelled'
                          ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30 hover:bg-amber-500 hover:text-white dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-slate-950'
                          : 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-900 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-emerald-600 dark:hover:text-white'
                      }`}
                    >
                      <Printer className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Receipt</span>
                      {order.paymentStatus === 'unpaid' && order.status !== 'cancelled' && (
                        <span className="ml-0.5 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-950">
                          Pay QR
                        </span>
                      )}
                    </button>

                    {(order.status === 'pending' ||
                      order.status === 'accepted' ||
                      order.status === 'preparing' ||
                      order.status === 'ready') &&
                      onOpenTracker && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onOpenTracker();
                          }}
                          className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs font-bold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 transition"
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>Live Tracker</span>
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() => toggleOrderExpand(order.id)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition"
                    >
                      {expanded ? 'Hide Items' : `Items (${order.items.length})`}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={e => handleReorderFullOrder(e, order)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-white shadow-xs transition active:scale-95 ${
                      isOrderJustReordered
                        ? 'bg-emerald-700'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {isOrderJustReordered ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Added All to Bag!</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                        <span>Reorder All ({totalItemCount})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Digital Receipt Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
};
