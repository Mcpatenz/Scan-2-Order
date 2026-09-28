import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Order, OrderItem } from '../../types';
import { History, X, Receipt, RotateCcw, ChevronDown, ChevronUp, Search, ShoppingBag, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { ReceiptModal } from '../Common/ReceiptModal';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose }) => {
  const { customerOrderHistory, activeTable, addToCart, products, showToast } = useOrderContext();
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '7d' | '30d'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');

  if (!isOpen) return null;

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const isProductAvailable = (productId: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return false;
    const isAvailable = p.inStock && (p.stockQuantity === undefined || p.stockQuantity > 0);
    return isAvailable;
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
        showToast(`Added ${reorderCount} available item(s) to cart. (${outOfStockCount} item(s) out of stock)`);
      } else {
        showToast(`Added all items from Order #${order.id} to cart!`);
      }
      onClose();
    } else {
      showToast('All items in this order are currently out of stock.');
    }
  };

  const isWithinDays = (isoDate: string, days: number) => {
    const orderTime = new Date(isoDate).getTime();
    if (isNaN(orderTime)) return true;
    return orderTime >= Date.now() - days * 24 * 60 * 60 * 1000;
  };

  const count7d = customerOrderHistory.filter(o => isWithinDays(o.createdAt, 7)).length;
  const count30d = customerOrderHistory.filter(o => isWithinDays(o.createdAt, 30)).length;

  const filteredOrders = customerOrderHistory.filter(ord => {
    if (dateRangeFilter === '7d' && !isWithinDays(ord.createdAt, 7)) return false;
    if (dateRangeFilter === '30d' && !isWithinDays(ord.createdAt, 30)) return false;

    const matchesSearch =
      ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'completed') matchesStatus = ord.status === 'completed';
    if (statusFilter === 'pending') matchesStatus = ord.status === 'pending' || ord.status === 'preparing' || ord.status === 'ready';
    if (statusFilter === 'cancelled') matchesStatus = ord.status === 'cancelled';

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Order History
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Table #{activeTable.tableNumber} • {customerOrderHistory.length} Total Orders
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        {customerOrderHistory.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders by ID or dish name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(
                [
                  { id: '7d', label: `Last 7 Days (${count7d})` },
                  { id: '30d', label: `Last 30 Days (${count30d})` },
                  { id: 'all', label: `All Orders (${customerOrderHistory.length})` },
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
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-800'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                Active / Pending
              </button>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="my-4 max-h-[55vh] overflow-y-auto space-y-3 pr-1 scrollbar-none">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShoppingBag className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">No orders found for Table #{activeTable.tableNumber}</p>
              <p className="text-[11px] text-slate-400">Place an order from the menu catalog to see it listed here.</p>
            </div>
          ) : (
            filteredOrders.map(ord => {
              const isExpanded = expandedOrderId === ord.id;

              return (
                <div
                  key={ord.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50 transition hover:border-emerald-500/40 space-y-2.5"
                >
                  {/* Order Card Header */}
                  <div
                    onClick={() => toggleExpand(ord.id)}
                    className="flex justify-between items-start cursor-pointer select-none"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          Order #{ord.id}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          ord.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : ord.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ₱{ord.total.toFixed(2)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Summary row */}
                  {!isExpanded && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                      {ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </p>
                  )}

                  {/* Expanded Item Breakdown */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Items Ordered
                      </p>
                      <div className="space-y-2">
                        {ord.items.map((item, idx) => {
                          const available = isProductAvailable(item.productId);

                          return (
                            <div
                              key={idx}
                              className="flex flex-col gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-extrabold text-slate-900 dark:text-white break-words">
                                      {item.quantity}x {item.productName}
                                    </span>
                                    {!available && (
                                      <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                                        Sold Out
                                      </span>
                                    )}
                                  </div>
                                  {item.modifiers && item.modifiers.length > 0 && (
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {item.modifiers.map(m => m.optionName).join(' · ')}
                                    </p>
                                  )}
                                </div>
                                <span className="font-black text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
                                  ₱{item.itemTotal.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex items-center justify-end pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
                                <button
                                  disabled={!available}
                                  onClick={(e) => handleReorderItem(e, item)}
                                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                  title="Add single item to cart"
                                >
                                  <RotateCcw className="h-3 w-3 shrink-0" /> Reorder Item
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReceiptOrder(ord);
                      }}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
                    >
                      <Receipt className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> View Receipt
                    </button>

                    <button
                      onClick={(e) => handleReorderOrder(e, ord)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white shadow-xs hover:bg-emerald-500 active:scale-95 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5 shrink-0" /> Reorder All
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Receipt Modal */}
        <ReceiptModal
          order={selectedReceiptOrder}
          isOpen={!!selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />

      </div>
    </div>
  );
};

