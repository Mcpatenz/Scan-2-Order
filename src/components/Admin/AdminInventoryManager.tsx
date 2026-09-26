import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Product, StockStatus } from '../../types';
import {
  Package,
  PackageX,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  RefreshCw,
  Sliders,
  BellRing,
  Sparkles,
  TrendingUp,
  History,
} from 'lucide-react';

export const AdminInventoryManager: React.FC = () => {
  const {
    products,
    categories,
    updateProductStock,
    restockProduct,
    setLowStockThreshold,
    toggleProductStock,
    adminAlerts,
    triggerDemoInventoryAlert,
  } = useOrderContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'out_of_stock' | 'low_stock' | 'in_stock'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'activity'>('inventory');

  // Helper for stock status calculation
  const getStockStatus = (p: Product): StockStatus => {
    const qty = p.stockQuantity ?? (p.inStock ? 10 : 0);
    const threshold = p.lowStockThreshold ?? 5;

    if (!p.inStock || qty <= 0) return 'out_of_stock';
    if (qty <= threshold) return 'low_stock';
    return 'in_stock';
  };

  // Stats calculation
  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => getStockStatus(p) === 'out_of_stock').length;
  const lowStockCount = products.filter(p => getStockStatus(p) === 'low_stock').length;
  const inStockCount = products.filter(p => getStockStatus(p) === 'in_stock').length;

  // Filtering products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
    
    const status = getStockStatus(p);
    let matchesStatus = true;
    if (selectedFilter === 'out_of_stock') matchesStatus = status === 'out_of_stock';
    if (selectedFilter === 'low_stock') matchesStatus = status === 'low_stock';
    if (selectedFilter === 'in_stock') matchesStatus = status === 'in_stock';

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Demo Toast Simulator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-5 text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-black tracking-tight">Stock & Inventory Management</h2>
          </div>
          <p className="text-xs text-slate-400">
            Monitor real-time product quantities, set low-stock thresholds, and trigger automated stock alert notifications.
          </p>
        </div>

        {/* Demo Toast Triggers */}
        <div className="flex items-center gap-2 flex-wrap bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
            <BellRing className="h-3 w-3 text-amber-400" /> Test Toast Alerts:
          </span>
          <button
            onClick={() => triggerDemoInventoryAlert('out_of_stock')}
            className="flex items-center gap-1 rounded-xl bg-rose-500/20 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition"
          >
            🔴 Out of Stock
          </button>
          <button
            onClick={() => triggerDemoInventoryAlert('low_stock')}
            className="flex items-center gap-1 rounded-xl bg-amber-500/20 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition"
          >
            ⚠️ Low Stock
          </button>
          <button
            onClick={() => triggerDemoInventoryAlert('in_stock')}
            className="flex items-center gap-1 rounded-xl bg-emerald-500/20 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition"
          >
            🟢 In Stock
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setSelectedFilter('all')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedFilter === 'all'
              ? 'border-emerald-500 bg-slate-900 shadow-md shadow-emerald-500/10'
              : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Catalog</span>
            <Package className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{totalProducts}</p>
          <p className="text-[10px] text-slate-400 mt-1">Tracked menu products</p>
        </div>

        <div
          onClick={() => setSelectedFilter('in_stock')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedFilter === 'in_stock'
              ? 'border-emerald-500 bg-slate-900 shadow-md shadow-emerald-500/10'
              : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">In Stock</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">{inStockCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Healthy stock levels</p>
        </div>

        <div
          onClick={() => setSelectedFilter('low_stock')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedFilter === 'low_stock'
              ? 'border-amber-500 bg-slate-900 shadow-md shadow-amber-500/10'
              : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Low Stock Warnings</span>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-400">{lowStockCount}</p>
          <p className="text-[10px] text-amber-300/80 mt-1">Needs reordering soon</p>
        </div>

        <div
          onClick={() => setSelectedFilter('out_of_stock')}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedFilter === 'out_of_stock'
              ? 'border-rose-500 bg-slate-900 shadow-md shadow-rose-500/10'
              : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Out of Stock</span>
            <PackageX className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-400">{outOfStockCount}</p>
          <p className="text-[10px] text-rose-300/80 mt-1">Unavailable to customers</p>
        </div>
      </div>

      {/* Sub Tabs: Inventory Table vs Activity Alerts Log */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition ${
            activeSubTab === 'inventory'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="h-4 w-4" /> Stock Control Table
        </button>
        <button
          onClick={() => setActiveSubTab('activity')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition ${
            activeSubTab === 'activity'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <History className="h-4 w-4" /> Activity & Alert History ({adminAlerts.length})
        </button>
      </div>

      {activeSubTab === 'inventory' ? (
        <div className="space-y-4">
          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                All ({totalProducts})
              </button>
              <button
                onClick={() => setSelectedFilter('out_of_stock')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedFilter === 'out_of_stock'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                🔴 Out of Stock ({outOfStockCount})
              </button>
              <button
                onClick={() => setSelectedFilter('low_stock')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedFilter === 'low_stock'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                ⚠️ Low Stock ({lowStockCount})
              </button>
              <button
                onClick={() => setSelectedFilter('in_stock')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedFilter === 'in_stock'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                🟢 Healthy ({inStockCount})
              </button>
            </div>
          </div>

          {/* Product Inventory Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Product Details</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Current Stock</th>
                    <th className="py-3.5 px-4">Low Stock Limit</th>
                    <th className="py-3.5 px-4 text-right">Quick Restock Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No products found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const status = getStockStatus(p);
                      const qty = p.stockQuantity ?? (p.inStock ? 10 : 0);
                      const threshold = p.lowStockThreshold ?? 5;
                      const catName = categories.find(c => c.id === p.categoryId)?.name || 'General';

                      return (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition">
                          {/* Product Image & Title */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="h-10 w-10 rounded-xl object-cover border border-slate-800 shrink-0"
                              />
                              <div>
                                <span className="font-extrabold text-white text-xs block leading-tight">
                                  {p.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">
                                  {catName}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-3 px-4 font-black text-emerald-400">
                            ${p.price.toFixed(2)}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            {status === 'out_of_stock' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-black text-rose-300 border border-rose-500/30">
                                🔴 Out of Stock
                              </span>
                            )}
                            {status === 'low_stock' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/30">
                                ⚠️ Low Stock
                              </span>
                            )}
                            {status === 'in_stock' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                                🟢 In Stock
                              </span>
                            )}
                          </td>

                          {/* Current Stock Input & Indicator */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                value={qty}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 0;
                                  updateProductStock(p.id, val);
                                }}
                                className="w-16 rounded-xl border border-slate-800 bg-slate-900 px-2 py-1 text-center font-extrabold text-white focus:border-emerald-500 focus:outline-none"
                              />
                              <span className="text-slate-400 text-[11px]">units</span>
                            </div>
                          </td>

                          {/* Threshold Limit */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 font-bold">Limit:</span>
                              <input
                                type="number"
                                min={1}
                                value={threshold}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 1;
                                  setLowStockThreshold(p.id, val);
                                }}
                                className="w-14 rounded-xl border border-slate-800 bg-slate-900 px-2 py-1 text-center text-xs font-bold text-slate-300 focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          </td>

                          {/* Restock Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => restockProduct(p.id, 5)}
                                className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-slate-700 active:scale-95 transition"
                              >
                                +5
                              </button>
                              <button
                                onClick={() => restockProduct(p.id, 10)}
                                className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-slate-700 active:scale-95 transition"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => restockProduct(p.id, 25)}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white hover:bg-emerald-500 active:scale-95 transition"
                              >
                                +25
                              </button>
                              <button
                                onClick={() => toggleProductStock(p.id)}
                                className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase transition ${
                                  p.inStock
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                }`}
                              >
                                {p.inStock ? 'Set Sold Out' : 'Set Available'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Activity Alert Log Tab */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Recent Inventory Toast Alert Logs
            </h3>
            <span className="text-[10px] text-slate-400">
              Auto-logged whenever stock drops to low/zero or is replenished.
            </span>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {adminAlerts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No inventory alerts triggered yet. Place orders or modify product stock to test alerts!
              </div>
            ) : (
              adminAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-2xl border text-xs flex justify-between items-center ${
                    alert.status === 'out_of_stock'
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                      : alert.status === 'low_stock'
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">
                      {alert.status === 'out_of_stock' ? '🔴' : alert.status === 'low_stock' ? '⚠️' : '🟢'}
                    </span>
                    <div>
                      <span className="font-extrabold text-white text-xs">{alert.productName}</span>
                      <p className="text-[11px] opacity-90">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-[10px] opacity-70 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    <p className="text-[10px] font-extrabold uppercase">
                      Stock: {alert.previousStock} ➔ {alert.currentStock}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
