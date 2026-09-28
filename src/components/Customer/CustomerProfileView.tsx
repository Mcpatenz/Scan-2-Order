import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { LoyaltyReward, Order, OrderItem, OrderStatus } from '../../types';
import {
  Award,
  User,
  Sparkles,
  Ticket,
  Clock,
  CheckCircle2,
  Gift,
  Zap,
  Star,
  LogIn,
  LogOut,
  ShoppingBag,
  Phone,
  MapPin,
  Receipt,
  History,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ChefHat,
  Bell,
  XCircle,
  Utensils,
} from 'lucide-react';
import { ReceiptModal } from '../Common/ReceiptModal';

interface CustomerProfileViewProps {
  onOpenSignIn?: () => void;
  onOpenCart?: () => void;
  onOpenOrderHistory?: () => void;
}

const AVAILABLE_REWARDS: LoyaltyReward[] = [
  {
    id: 'rew-1',
    title: '₱2.00 Order Discount',
    description: 'Instantly deduct ₱2.00 from your active cart subtotal.',
    pointsCost: 200,
    discountValue: 2.0,
  },
  {
    id: 'rew-2',
    title: 'Free Drink / Dessert (₱3.50 Value)',
    description: 'Get ₱3.50 off your favorite beverage or dessert item.',
    pointsCost: 350,
    discountValue: 3.5,
  },
  {
    id: 'rew-3',
    title: '₱5.00 Chef Special Discount',
    description: 'Save ₱5.00 off any main entree or platter order.',
    pointsCost: 500,
    discountValue: 5.0,
  },
  {
    id: 'rew-4',
    title: '₱10.00 VIP Feast Reward',
    description: 'Big ₱10.00 discount for family dining or group orders.',
    pointsCost: 900,
    discountValue: 10.0,
  },
];

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  onOpenSignIn,
  onOpenCart,
  onOpenOrderHistory,
}) => {
  const {
    activeTable,
    isTableSelected,
    currentEmployee,
    logoutEmployee,
    loyaltyPoints,
    loyaltyHistory,
    redeemedLoyaltyDiscount,
    redeemedLoyaltyPoints,
    applyLoyaltyDiscount,
    cancelLoyaltyDiscount,
    claimBonusLoyaltyPoints,
    customerOrderHistory,
    orders,
    products,
    addToCart,
    showToast,
    cart,
  } = useOrderContext();

  const [sectionTab, setSectionTab] = useState<'orders' | 'rewards' | 'ledger'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7d' | '30d'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Use table order history when a table is selected or has orders, otherwise show customer orders
  const profileOrders = customerOrderHistory.length > 0 ? customerOrderHistory : orders;

  const getTierInfo = (pts: number) => {
    if (pts >= 1000) {
      return {
        name: 'VIP Platinum',
        badgeBg: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white',
        nextTierName: 'Max Tier Unlocked',
        nextTierPoints: 1000,
        progress: 100,
        multiplier: '2.0x Points',
      };
    } else if (pts >= 500) {
      return {
        name: 'Gold Member',
        badgeBg: 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950',
        nextTierName: 'VIP Platinum',
        nextTierPoints: 1000,
        progress: Math.min(100, Math.round(((pts - 500) / 500) * 100)),
        multiplier: '1.5x Points',
      };
    } else if (pts >= 200) {
      return {
        name: 'Silver Member',
        badgeBg: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900',
        nextTierName: 'Gold Member',
        nextTierPoints: 500,
        progress: Math.min(100, Math.round(((pts - 200) / 300) * 100)),
        multiplier: '1.2x Points',
      };
    } else {
      return {
        name: 'Bronze Member',
        badgeBg: 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100',
        nextTierName: 'Silver Member',
        nextTierPoints: 200,
        progress: Math.min(100, Math.round((pts / 200) * 100)),
        multiplier: '1.0x Points',
      };
    }
  };

  const tier = getTierInfo(loyaltyPoints);

  const totalEarnedPoints = loyaltyHistory
    .filter(tx => tx.type === 'earned')
    .reduce((sum, tx) => sum + tx.points, 0);

  const totalRedeemedPoints = loyaltyHistory
    .filter(tx => tx.type === 'redeemed')
    .reduce((sum, tx) => sum + Math.abs(tx.points), 0);

  const handleRedeem = (reward: LoyaltyReward) => {
    const ok = applyLoyaltyDiscount(reward.pointsCost, reward.discountValue);
    if (ok && onOpenCart && cart.length > 0) {
      onOpenCart();
    }
  };

  const isProductAvailable = (productId: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return false;
    return p.inStock && (p.stockQuantity === undefined || p.stockQuantity > 0);
  };

  const handleReorderItem = (e: React.MouseEvent, item: OrderItem) => {
    e.stopPropagation();
    const matchedProd = products.find(p => p.id === item.productId);
    if (matchedProd && isProductAvailable(item.productId)) {
      addToCart({
        product: matchedProd,
        quantity: item.quantity,
        selectedModifiers: item.modifiers || [],
        notes: item.notes,
      });
      showToast(`Added ${item.quantity}x ${item.productName} to cart!`);
    } else {
      showToast(`Sorry, "${item.productName}" is currently out of stock.`);
    }
  };

  const handleReorderOrder = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    let reorderCount = 0;
    let outOfStockCount = 0;

    order.items.forEach(item => {
      const matchedProd = products.find(p => p.id === item.productId);
      if (matchedProd && isProductAvailable(item.productId)) {
        addToCart({
          product: matchedProd,
          quantity: item.quantity,
          selectedModifiers: item.modifiers || [],
          notes: item.notes,
        });
        reorderCount++;
      } else {
        outOfStockCount++;
      }
    });

    if (reorderCount > 0) {
      if (outOfStockCount > 0) {
        showToast(
          `Added ${reorderCount} available item(s) to cart. (${outOfStockCount} out of stock)`
        );
      } else {
        showToast(`Added all items from Order #${order.id} to cart!`);
      }
      if (onOpenCart) onOpenCart();
    } else {
      showToast('All items in this order are currently out of stock.');
    }
  };

  const getStatusMeta = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending Kitchen',
          badgeClass:
            'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300',
          icon: <Clock className="h-3 w-3" />,
          step: 1,
        };
      case 'accepted':
        return {
          label: 'Order Accepted',
          badgeClass: 'bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-300',
          icon: <CheckCircle2 className="h-3 w-3" />,
          step: 2,
        };
      case 'preparing':
        return {
          label: 'Preparing in Kitchen',
          badgeClass:
            'bg-indigo-500/15 text-indigo-700 border-indigo-500/30 dark:text-indigo-300',
          icon: <ChefHat className="h-3 w-3" />,
          step: 3,
        };
      case 'ready':
        return {
          label: 'Ready to Serve',
          badgeClass:
            'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
          icon: <Bell className="h-3 w-3" />,
          step: 4,
        };
      case 'completed':
        return {
          label: 'Completed',
          badgeClass:
            'bg-emerald-500/20 text-emerald-800 border-emerald-500/40 dark:text-emerald-300',
          icon: <CheckCircle2 className="h-3 w-3" />,
          step: 5,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300',
          icon: <XCircle className="h-3 w-3" />,
          step: 0,
        };
    }
  };

  const isWithinDays = (isoDate: string, days: number) => {
    const orderTime = new Date(isoDate).getTime();
    if (isNaN(orderTime)) return true;
    return orderTime >= Date.now() - days * 24 * 60 * 60 * 1000;
  };

  const count7d = profileOrders.filter(o => isWithinDays(o.createdAt, 7)).length;
  const count30d = profileOrders.filter(o => isWithinDays(o.createdAt, 30)).length;

  const filteredOrders = profileOrders.filter(ord => {
    if (dateRangeFilter === '7d' && !isWithinDays(ord.createdAt, 7)) return false;
    if (dateRangeFilter === '30d' && !isWithinDays(ord.createdAt, 30)) return false;

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      ord.id.toLowerCase().includes(q) ||
      ord.items.some(i => i.productName.toLowerCase().includes(q));

    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus =
        ord.status === 'pending' ||
        ord.status === 'accepted' ||
        ord.status === 'preparing' ||
        ord.status === 'ready';
    } else if (statusFilter === 'completed') {
      matchesStatus = ord.status === 'completed';
    } else if (statusFilter === 'cancelled') {
      matchesStatus = ord.status === 'cancelled';
    }

    return matchesSearch && matchesStatus;
  });

  const activeOrderCount = profileOrders.filter(
    o =>
      o.status === 'pending' ||
      o.status === 'accepted' ||
      o.status === 'preparing' ||
      o.status === 'ready'
  ).length;
  const completedOrderCount = profileOrders.filter(o => o.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Customer Identity & Profile Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {currentEmployee ? (
              <img
                src={currentEmployee.photo}
                alt={currentEmployee.firstName}
                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-emerald-500/40"
                onError={e => {
                  (e.target as HTMLElement).setAttribute(
                    'src',
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80'
                  );
                }}
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
                <User className="h-7 w-7" />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  {currentEmployee
                    ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
                    : isTableSelected
                    ? `Table #${activeTable.tableNumber} Diner`
                    : 'Guest Member'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${tier.badgeBg}`}
                >
                  <Star className="h-2.5 w-2.5 fill-current" /> {tier.name}
                </span>
              </div>

              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {currentEmployee
                  ? `${currentEmployee.email} • ID: ${currentEmployee.employeeCode}`
                  : 'Gourmet Rewards Member • Earn 10 PTS per ₱1 spent'}
              </p>

              {currentEmployee && (
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                  {currentEmployee.contactNumber && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-500" />
                      {currentEmployee.contactNumber}
                    </span>
                  )}
                  {currentEmployee.address && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-emerald-500" />
                      {currentEmployee.address}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={logoutEmployee}
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-rose-500/10 hover:text-rose-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition"
          >
            <LogOut className="h-3 w-3" /> Sign Out
          </button>
        </div>
      </div>

      {/* Loyalty Points Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 p-5 text-white shadow-xl border border-amber-500/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
              <Award className="h-3 w-3" /> Loyalty Points Balance
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-amber-400">
                {loyaltyPoints.toLocaleString()}
              </span>
              <span className="text-xs font-extrabold uppercase text-amber-200">PTS</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-300">
              Redeemable Value:{' '}
              <span className="font-bold text-emerald-400">
                ≈ ₱{(loyaltyPoints / 100).toFixed(2)}
              </span>
            </p>
          </div>

          <div className="text-right space-y-1">
            <div className="rounded-xl bg-white/10 px-2.5 py-1.5 text-right backdrop-blur-xs">
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300">
                Earn Rate
              </p>
              <p className="text-xs font-black text-white">10 PTS / ₱1</p>
              <p className="text-[9px] text-emerald-300">{tier.multiplier}</p>
            </div>
          </div>
        </div>

        {/* Progress Bar to Next Tier */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-slate-300">
            <span>Next Tier: {tier.nextTierName}</span>
            <span>
              {loyaltyPoints} / {tier.nextTierPoints} PTS ({tier.progress}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
              style={{ width: `${tier.progress}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-4 grid grid-cols-3 gap-2 pt-2 text-center">
          <div className="rounded-xl bg-white/5 p-2 border border-white/10">
            <p className="text-[9px] font-bold uppercase text-slate-400">Lifetime Earned</p>
            <p className="text-xs font-black text-emerald-400">+{totalEarnedPoints} PTS</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2 border border-white/10">
            <p className="text-[9px] font-bold uppercase text-slate-400">Redeemed</p>
            <p className="text-xs font-black text-amber-400">{totalRedeemedPoints} PTS</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2 border border-white/10">
            <p className="text-[9px] font-bold uppercase text-slate-400">Past Orders</p>
            <p className="text-xs font-black text-sky-400">{profileOrders.length}</p>
          </div>
        </div>
      </div>

      {/* Active Redeemed Reward Alert */}
      {redeemedLoyaltyDiscount > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-extrabold">Active Reward Applied to Cart</p>
              <p className="text-[11px] opacity-90">
                -₱{redeemedLoyaltyDiscount.toFixed(2)} discount ({redeemedLoyaltyPoints} PTS)
              </p>
            </div>
          </div>
          <button
            onClick={cancelLoyaltyDiscount}
            className="rounded-xl bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-500 transition"
          >
            Remove
          </button>
        </div>
      )}

      {/* Sub-navigation Tabs inside Profile */}
      <div className="flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80 text-xs font-bold">
        <button
          onClick={() => setSectionTab('orders')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
            sectionTab === 'orders'
              ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <History className="h-3.5 w-3.5 text-emerald-500" />
          <span>Order History</span>
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
            {profileOrders.length}
          </span>
        </button>
        <button
          onClick={() => setSectionTab('rewards')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
            sectionTab === 'rewards'
              ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Gift className="h-3.5 w-3.5 text-amber-500" /> Redeem
        </button>
        <button
          onClick={() => setSectionTab('ledger')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 transition ${
            sectionTab === 'ledger'
              ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-sky-500" /> Points Log
        </button>
      </div>

      {/* SECTION 1: ORDER HISTORY & STATUS */}
      {sectionTab === 'orders' && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
            {/* Section Title & Summary Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <History className="h-4 w-4 text-emerald-500" />
                  Order History & Live Status
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Track active kitchen orders, review past meals, or reorder favorites
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                {activeOrderCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                    {activeOrderCount} Active
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-0.5 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {completedOrderCount} Completed
                </span>
              </div>
            </div>

            {/* Search & Status Filter Pills */}
            {profileOrders.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search past orders by Order # or dish name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {/* Date Range Filter: Last 7 Days, Last 30 Days, All Orders */}
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  {(
                    [
                      { id: '7d', label: `Last 7 Days (${count7d})` },
                      { id: '30d', label: `Last 30 Days (${count30d})` },
                      { id: 'all', label: `All Orders (${profileOrders.length})` },
                    ] as const
                  ).map(range => (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setDateRangeFilter(range.id)}
                      className={`rounded-lg py-1.5 px-2 text-[11px] font-extrabold transition truncate ${
                        dateRangeFilter === range.id
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {(
                    [
                      { id: 'all', label: `All Status (${profileOrders.length})` },
                      { id: 'active', label: `Active (${activeOrderCount})` },
                      { id: 'completed', label: `Completed (${completedOrderCount})` },
                      { id: 'cancelled', label: 'Cancelled' },
                    ] as const
                  ).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                        statusFilter === tab.id
                          ? 'bg-slate-900 text-white shadow-2xs dark:bg-slate-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Order Cards List */}
            {filteredOrders.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-6 text-center dark:bg-slate-950/60">
                <ShoppingBag className="mx-auto h-7 w-7 text-slate-400 mb-1.5" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No matching orders found
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Place an order from the menu to see your order status and history here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map(ord => {
                  const isExpanded = expandedOrderId === ord.id;
                  const statusMeta = getStatusMeta(ord.status);
                  const ptsForOrder = Math.max(10, Math.round(ord.total * 10));

                  return (
                    <div
                      key={ord.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-emerald-500/40 dark:border-slate-800 dark:bg-slate-950/60 space-y-2.5"
                    >
                      {/* Top Row: Order ID, Status Badge, and Total */}
                      <div
                        onClick={() =>
                          setExpandedOrderId(prev => (prev === ord.id ? null : ord.id))
                        }
                        className="flex items-start justify-between gap-2 cursor-pointer select-none"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              Order #{ord.id}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${statusMeta.badgeClass}`}
                            >
                              {statusMeta.icon}
                              {statusMeta.label}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                ord.paymentStatus === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <Utensils className="h-3 w-3 text-emerald-500" />
                              Table #{ord.tableNumber} •{' '}
                              {ord.diningOption === 'dine_in' ? 'Dine In' : 'Takeout'}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                              {new Date(ord.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              ₱{ord.total.toFixed(2)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                            <Sparkles className="h-2.5 w-2.5" /> +{ptsForOrder} PTS
                          </span>
                        </div>
                      </div>

                      {/* Visual Status Progress Stepper (for non-cancelled orders) */}
                      {ord.status !== 'cancelled' && (
                        <div className="pt-1">
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { step: 1, label: 'Placed' },
                              { step: 2, label: 'Accepted' },
                              { step: 3, label: 'Preparing' },
                              { step: 4, label: ord.status === 'completed' ? 'Completed' : 'Ready' },
                            ].map(s => {
                              const active = statusMeta.step >= s.step;
                              return (
                                <div key={s.step} className="space-y-1">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      active
                                        ? 'bg-emerald-500'
                                        : 'bg-slate-200 dark:bg-slate-800'
                                    }`}
                                  />
                                  <p
                                    className={`text-[9px] font-bold text-center ${
                                      active
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {s.label}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Compact Item Summary when collapsed */}
                      {!isExpanded && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 pt-0.5">
                          {ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                        </p>
                      )}

                      {/* Expanded Itemized Breakdown */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Ordered Items ({ord.items.length})
                          </p>
                          <div className="space-y-1.5">
                            {ord.items.map((item, idx) => {
                              const available = isProductAvailable(item.productId);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900"
                                >
                                  <div className="min-w-0 flex-1 pr-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-extrabold text-slate-900 dark:text-white">
                                        {item.quantity}x {item.productName}
                                      </span>
                                      {!available && (
                                        <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-500">
                                          Out of Stock
                                        </span>
                                      )}
                                    </div>
                                    {item.modifiers && item.modifiers.length > 0 && (
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {item.modifiers.map(m => m.optionName).join(', ')}
                                      </p>
                                    )}
                                    {item.notes && (
                                      <p className="text-[10px] italic text-amber-600 dark:text-amber-400">
                                        Note: &ldquo;{item.notes}&rdquo;
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                      ₱{item.itemTotal.toFixed(2)}
                                    </span>
                                    <button
                                      disabled={!available}
                                      onClick={e => handleReorderItem(e, item)}
                                      className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed dark:text-emerald-400 transition"
                                    >
                                      <RotateCcw className="h-3 w-3" /> Add
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Order Card Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedReceiptOrder(ord);
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
                        >
                          <Receipt className="h-3.5 w-3.5" /> View Receipt
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setExpandedOrderId(prev => (prev === ord.id ? null : ord.id))
                            }
                            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition"
                          >
                            {isExpanded ? 'Hide Details' : 'Order Details'}
                          </button>

                          <button
                            onClick={e => handleReorderOrder(e, ord)}
                            className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white shadow-2xs hover:bg-emerald-500 active:scale-95 transition"
                          >
                            <RotateCcw className="h-3 w-3" /> Reorder
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bonus Points Challenges */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2.5">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" /> Quick Bonus Point Missions
            </h3>

            <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Daily Table Check-In
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Claim +30 bonus loyalty points for dining today
                </p>
              </div>
              <button
                onClick={() => claimBonusLoyaltyPoints(30, 'Daily Check-in Bonus')}
                className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-amber-400 active:scale-95 transition"
              >
                +30 PTS
              </button>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Rate Chef Experience
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Instant +50 points for quick feedback
                </p>
              </div>
              <button
                onClick={() => claimBonusLoyaltyPoints(50, 'Chef Feedback Bonus')}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-500 active:scale-95 transition"
              >
                +50 PTS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: REDEEM REWARDS */}
      {sectionTab === 'rewards' && (
        <div className="space-y-2.5">
          {AVAILABLE_REWARDS.map(reward => {
            const canAfford = loyaltyPoints >= reward.pointsCost;
            const isApplied = redeemedLoyaltyPoints === reward.pointsCost;

            return (
              <div
                key={reward.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                  isApplied
                    ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/30'
                    : canAfford
                    ? 'border-slate-200 bg-white hover:border-amber-500/50 dark:border-slate-800 dark:bg-slate-900'
                    : 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Ticket className="h-4 w-4 text-amber-500 shrink-0" />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {reward.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {reward.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                    {reward.pointsCost} PTS
                  </span>

                  {isApplied ? (
                    <span className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                    </span>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => handleRedeem(reward)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-black transition active:scale-95 ${
                        canAfford
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs'
                          : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Redeem' : 'Locked'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 3: POINTS ACTIVITY LEDGER */}
      {sectionTab === 'ledger' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2.5">
          <h3 className="text-xs font-black text-slate-900 dark:text-white">
            Loyalty Points Activity Ledger
          </h3>
          {loyaltyHistory.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No loyalty transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {loyaltyHistory.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {tx.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(tx.date).toLocaleDateString()} •{' '}
                      {new Date(tx.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                      tx.points > 0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {tx.points > 0 ? `+${tx.points}` : tx.points} PTS
                  </span>
                </div>
              ))}
            </div>
          )}
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
