import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Utensils,
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  Smartphone,
  QrCode,
  CheckCircle2,
  User,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useOrderContext } from '../../context/OrderContext';
import { CartItem, Order, PaymentMethod, Product } from '../../types';
import { ProcessedPaymentDetails } from '../Common/ReceiptModal';
import { MealComboBuilderModal } from '../Customer/MealComboBuilderModal';

interface WalkInPosSectionProps {
  onOrderCreated: (order: Order, paymentDetails: ProcessedPaymentDetails | null) => void;
}

export const WalkInPosSection: React.FC<WalkInPosSectionProps> = ({ onOrderCreated }) => {
  const {
    categories,
    products,
    tables,
    activeCashier,
    createWalkInPosOrder,
    showToast,
  } = useOrderContext();

  const [posCategoryId, setPosCategoryId] = useState<string>('cat-all');
  const [posSearch, setPosSearch] = useState<string>('');
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [diningOption, setDiningOption] = useState<'walk_in_dine_in' | 'takeout'>('walk_in_dine_in');
  const [selectedTableId, setSelectedTableId] = useState<string>(tables[0]?.id || 'table-1');
  const [customerName, setCustomerName] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_hand');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [comboModalOpen, setComboModalOpen] = useState<boolean>(false);

  const filteredProducts = useMemo(() => {
    const q = posSearch.trim().toLowerCase();
    return products.filter(p => {
      const matchesQuery =
        !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      if (posCategoryId === 'cat-all') return matchesQuery;
      if (posCategoryId === 'cat-popular') return matchesQuery && p.isPopular;
      return matchesQuery && p.categoryId === posCategoryId;
    });
  }, [products, posSearch, posCategoryId]);

  const addProductToPosCart = (product: Product) => {
    const isOut =
      !product.inStock || (product.stockQuantity !== undefined && product.stockQuantity <= 0);
    if (isOut) {
      showToast(`"${product.name}" is out of stock.`);
      return;
    }

    setPosCart(prev => {
      const existingIdx = prev.findIndex(
        item => item.product.id === product.id && item.selectedModifiers.length === 0
      );
      if (existingIdx > -1) {
        return prev.map((item, idx) =>
          idx === existingIdx
            ? {
                ...item,
                quantity: item.quantity + 1,
                itemTotal: Number(((item.quantity + 1) * item.product.price).toFixed(2)),
              }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `pos-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          product,
          quantity: 1,
          selectedModifiers: [],
          itemTotal: product.price,
        },
      ];
    });
  };

  const updatePosItemQty = (itemId: string, delta: number) => {
    setPosCart(prev =>
      prev
        .map(item => {
          if (item.id !== itemId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          const modSum = item.selectedModifiers.reduce((s, m) => s + m.price, 0);
          const unit = item.product.price + modSum;
          return {
            ...item,
            quantity: nextQty,
            itemTotal: Number((unit * nextQty).toFixed(2)),
          };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = useMemo(
    () => Number(posCart.reduce((s, i) => s + i.itemTotal, 0).toFixed(2)),
    [posCart]
  );
  const discountAmount = useMemo(
    () => Number(((subtotal * discountPct) / 100).toFixed(2)),
    [subtotal, discountPct]
  );
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = Number((discountedSubtotal * 0.1).toFixed(2));
  const totalDue = Number((discountedSubtotal + tax).toFixed(2));

  const parsedCash = parseFloat(cashTendered);
  const effectiveTendered =
    !isNaN(parsedCash) && parsedCash >= totalDue ? parsedCash : totalDue;
  const changeDue = Math.max(0, Number((effectiveTendered - totalDue).toFixed(2)));

  const handleCompletePosSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) {
      showToast('⚠️ Please add at least one item to the POS order.');
      return;
    }

    const isTakeout = diningOption === 'takeout';
    const defaultName = isTakeout ? 'Walk-In Takeout Customer' : 'Walk-In Dine-In Guest';

    const createdOrder = createWalkInPosOrder({
      customerName: customerName.trim() || defaultName,
      diningOption: isTakeout ? 'takeout' : 'dine_in',
      tableId: isTakeout ? undefined : selectedTableId,
      paymentMethod,
      paymentStatus: 'paid',
      items: posCart,
      discountAmount,
      notes: orderNotes.trim() || undefined,
    });

    if (createdOrder) {
      const paymentDetails: ProcessedPaymentDetails = {
        orderId: createdOrder.id,
        methodUsed:
          paymentMethod === 'gcash'
            ? 'GCash'
            : paymentMethod === 'paymaya'
            ? 'PayMaya'
            : 'Cash on Hand',
        amountTendered: paymentMethod === 'cash_on_hand' ? effectiveTendered : createdOrder.total,
        changeDue: paymentMethod === 'cash_on_hand' ? changeDue : 0,
        processedAt: new Date().toISOString(),
        receiptRef: `POS-${createdOrder.id.replace('ORD-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      };

      setPosCart([]);
      setCustomerName('');
      setOrderNotes('');
      setCashTendered('');
      setDiscountPct(0);
      onOrderCreated(createdOrder, paymentDetails);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              Walk-In Customer &amp; Takeout POS Register
            </h3>
            <p className="text-xs text-slate-400">
              Ring up counter walk-in dine-in or takeout orders, build meal combos &amp; collect instant payment
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setComboModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>+ Build Custom Meal Combo (15% Off)</span>
        </button>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT 7 COLS: Menu Catalog Picker */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search + Category Pills */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={posSearch}
                onChange={e => setPosSearch(e.target.value)}
                placeholder="Search menu item to ring up..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setPosCategoryId(cat.id)}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  posCategoryId === cat.id
                    ? 'bg-sky-500 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredProducts.map(product => {
              const qty = product.stockQuantity ?? (product.inStock ? 10 : 0);
              const isOut = !product.inStock || qty <= 0;
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isOut}
                  onClick={() => addProductToPosCart(product)}
                  className={`flex flex-col justify-between rounded-2xl border p-2.5 text-left transition ${
                    isOut
                      ? 'border-slate-800 bg-slate-900/40 opacity-50 cursor-not-allowed'
                      : 'border-slate-800 bg-slate-900 hover:border-sky-500/60 active:scale-98'
                  }`}
                >
                  <div>
                    <div className="relative h-20 w-full overflow-hidden rounded-xl bg-slate-800 mb-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute right-1.5 top-1.5 rounded-md bg-slate-950/85 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                        {isOut ? 'Sold Out' : `${qty} left`}
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-white line-clamp-1">
                      {product.name}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400 tabular-nums">
                      ₱{product.price.toFixed(2)}
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT 5 COLS: Walk-In / Takeout Order Ticket & Checkout */}
        <form
          onSubmit={handleCompletePosSale}
          className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-4"
        >
          <div className="space-y-3">
            {/* Order Type Toggle: Walk-In Dine-In vs Takeout */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => setDiningOption('walk_in_dine_in')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition ${
                  diningOption === 'walk_in_dine_in'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Utensils className="h-3.5 w-3.5" />
                <span>Walk-In (Dine-In)</span>
              </button>
              <button
                type="button"
                onClick={() => setDiningOption('takeout')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black transition ${
                  diningOption === 'takeout'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Takeout / To-Go</span>
              </button>
            </div>

            {/* Customer Name & Table Picker (if Walk-In Dine-In) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Customer Name
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder={
                      diningOption === 'takeout' ? 'Walk-In Takeout' : 'Walk-In Guest'
                    }
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {diningOption === 'walk_in_dine_in' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Assign Table
                  </label>
                  <select
                    value={selectedTableId}
                    onChange={e => setSelectedTableId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs font-bold text-white focus:border-sky-500 focus:outline-none"
                  >
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        Table #{t.tableNumber} ({t.status === 'available' ? 'Empty' : t.status})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Order Notes
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="Cutlery, extra napkins..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Ticket Cart Items */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 space-y-2 max-h-48 overflow-y-auto">
              {posCart.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">
                  Tap menu items on the left or build a combo to start a Walk-In / Takeout ticket.
                </p>
              ) : (
                posCart.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-2 border-b border-slate-900 pb-2 last:border-none last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">
                        {item.product.name}
                      </p>
                      {item.selectedModifiers.length > 0 && (
                        <p className="text-[10px] text-emerald-400 line-clamp-2">
                          {item.selectedModifiers.map(m => m.name).join(' • ')}
                        </p>
                      )}
                      <span className="text-[11px] font-black text-slate-300 tabular-nums">
                        ₱{item.itemTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updatePosItemQty(item.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-black tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePosItemQty(item.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Discount Selector */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                <Tag className="h-3.5 w-3.5 text-emerald-400" /> POS Discount:
              </span>
              <div className="flex items-center gap-1">
                {[0, 10, 15, 20].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPct(pct)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-black transition ${
                      discountPct === pct
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {pct === 0 ? 'None' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Totals & Payment Method */}
          <div className="space-y-3 border-t border-slate-800 pt-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="tabular-nums">₱{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({discountPct}%)</span>
                  <span className="tabular-nums">-₱{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Tax (10%)</span>
                <span className="tabular-nums">₱{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-800">
                <span>Total Due</span>
                <span className="text-emerald-400 tabular-nums">₱{totalDue.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash_on_hand')}
                className={`flex items-center justify-center gap-1 rounded-xl border py-2 text-[11px] font-bold transition ${
                  paymentMethod === 'cash_on_hand'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <Banknote className="h-3.5 w-3.5" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={`flex items-center justify-center gap-1 rounded-xl border py-2 text-[11px] font-bold transition ${
                  paymentMethod === 'gcash'
                    ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>GCash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('paymaya')}
                className={`flex items-center justify-center gap-1 rounded-xl border py-2 text-[11px] font-bold transition ${
                  paymentMethod === 'paymaya'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                    : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>PayMaya</span>
              </button>
            </div>

            {paymentMethod === 'cash_on_hand' && posCart.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min={totalDue}
                  value={cashTendered}
                  onChange={e => setCashTendered(e.target.value)}
                  placeholder={`Tendered (₱${totalDue.toFixed(2)})`}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
                <div className="rounded-xl bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 text-xs">
                  <span className="text-slate-400 mr-1">Change:</span>
                  <span className="font-black text-emerald-400 tabular-nums">
                    ₱{changeDue.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {posCart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPosCart([])}
                  className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-bold text-rose-400 hover:bg-slate-800"
                  title="Clear Ticket"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={posCart.length === 0}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 py-2.5 px-4 text-xs font-black text-white shadow-lg shadow-emerald-600/25 transition active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Charge &amp; Send {diningOption === 'takeout' ? 'Takeout' : 'Walk-In'} Order (₱{totalDue.toFixed(2)})
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Custom Meal Combo Builder Modal for Cashier POS */}
      <MealComboBuilderModal
        isOpen={comboModalOpen}
        onClose={() => setComboModalOpen(false)}
        onComboAdded={comboData => {
          const modSum = comboData.selectedModifiers.reduce((s, m) => s + m.price, 0);
          const unitPrice = comboData.product.price + modSum;
          const newCartItem: CartItem = {
            id: `pos-combo-${Date.now()}`,
            product: comboData.product,
            quantity: comboData.quantity,
            selectedModifiers: comboData.selectedModifiers,
            notes: comboData.notes,
            itemTotal: Number((unitPrice * comboData.quantity).toFixed(2)),
          };
          setPosCart(prev => [...prev, newCartItem]);
          showToast(`Added Custom Meal Combo to POS Ticket!`);
        }}
      />
    </div>
  );
};
