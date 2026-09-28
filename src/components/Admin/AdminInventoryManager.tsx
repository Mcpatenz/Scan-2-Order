import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { InventoryAlert, Product, StockStatus } from '../../types';
import {
  Package,
  PackageX,
  AlertTriangle,
  CheckCircle2,
  Search,
  Plus,
  Minus,
  Sliders,
  BellRing,
  BellOff,
  History,
  Mail,
  Send,
  Settings,
  Check,
  X,
  ExternalLink,
  Copy,
  Zap,
  Trash2,
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
    acknowledgeInventoryAlert,
    clearAcknowledgedAlerts,
    lowStockAlertConfig,
    updateLowStockAlertConfig,
    toggleProductAlertEnabled,
    sendLowStockEmailAlert,
    runAutomatedStockScan,
    triggerDemoInventoryAlert,
    showToast,
  } = useOrderContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'out_of_stock' | 'low_stock' | 'in_stock'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'automation' | 'activity'>('inventory');

  // Recipient email input state
  const [newEmailInput, setNewEmailInput] = useState('');

  // Email Preview Modal State
  const [previewEmailAlert, setPreviewEmailAlert] = useState<InventoryAlert | null>(null);

  // Helper for stock status calculation
  const getStockStatus = (p: Product): StockStatus => {
    const qty = p.stockQuantity ?? (p.inStock ? 10 : 0);
    const threshold = p.lowStockThreshold ?? lowStockAlertConfig.globalDefaultThreshold;

    if (!p.inStock || qty <= 0) return 'out_of_stock';
    if (qty <= threshold) return 'low_stock';
    return 'in_stock';
  };

  // Stats calculation
  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => getStockStatus(p) === 'out_of_stock').length;
  const lowStockCount = products.filter(p => getStockStatus(p) === 'low_stock').length;
  const inStockCount = products.filter(p => getStockStatus(p) === 'in_stock').length;
  const unacknowledgedAlertsCount = adminAlerts.filter(a => !a.acknowledged).length;

  const belowThresholdProducts = products.filter(p => {
    const st = getStockStatus(p);
    return st === 'low_stock' || st === 'out_of_stock';
  });

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

  const handleAddRecipientEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmailInput.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      showToast('⚠️ Please enter a valid email address');
      return;
    }
    if (lowStockAlertConfig.recipientEmails.includes(trimmed)) {
      showToast('Email address is already in the recipient list');
      return;
    }
    updateLowStockAlertConfig({
      recipientEmails: [...lowStockAlertConfig.recipientEmails, trimmed],
    });
    setNewEmailInput('');
  };

  const handleRemoveRecipientEmail = (emailToRemove: string) => {
    updateLowStockAlertConfig({
      recipientEmails: lowStockAlertConfig.recipientEmails.filter(e => e !== emailToRemove),
    });
  };

  const handleRestockAllLowItems = () => {
    const amount = lowStockAlertConfig.autoReorderSuggestion || 25;
    belowThresholdProducts.forEach(p => {
      restockProduct(p.id, amount);
    });
    showToast(`✓ Replenished ${belowThresholdProducts.length} low-stock item(s) by +${amount} units each!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Automated Low Stock Alert Engine Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`flex h-2.5 w-2.5 rounded-full ${
                lowStockAlertConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <h2 className="text-lg font-black tracking-tight">
              Inventory &amp; Automated Low Stock Alert System
            </h2>
            <span className="text-xs font-semibold text-emerald-400">
              {lowStockAlertConfig.enabled ? 'Auto-Monitoring Active' : 'Monitoring Paused'} ·{' '}
              {lowStockAlertConfig.emailNotifications
                ? `Emailing ${lowStockAlertConfig.recipientEmails[0] || 'Admin'}`
                : 'Dashboard Alerts Only'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Define per-item stock thresholds and automatically dispatch email &amp; dashboard alerts when items run low
          </p>
        </div>

        {/* Quick Scan & Test Alert Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => runAutomatedStockScan()}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-black text-white shadow-lg shadow-indigo-600/25 transition active:scale-95"
          >
            <Zap className="h-3.5 w-3.5" /> Scan Thresholds &amp; Send Alerts
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase px-2 flex items-center gap-1">
              <BellRing className="h-3 w-3 text-amber-400" /> Simulate:
            </span>
            <button
              type="button"
              onClick={() => triggerDemoInventoryAlert('low_stock')}
              className="rounded-xl bg-amber-500/20 px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition"
            >
              Low Stock
            </button>
            <button
              type="button"
              onClick={() => triggerDemoInventoryAlert('out_of_stock')}
              className="rounded-xl bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition"
            >
              Sold Out
            </button>
          </div>
        </div>
      </div>

      {/* Live Threshold Breach Alert Banner */}
      {belowThresholdProducts.length > 0 && (
        <div className="rounded-3xl border border-amber-500/50 bg-amber-950/30 p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-white">
                    {belowThresholdProducts.length} Menu Item{belowThresholdProducts.length > 1 ? 's' : ''} Below Defined Threshold
                  </h3>
                  <span className="text-xs text-amber-300">
                    · Automated {lowStockAlertConfig.emailNotifications ? 'Email & Dashboard' : 'Dashboard'} Alert Active
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Notifications routed to{' '}
                  <span className="font-mono text-sky-300">
                    {lowStockAlertConfig.recipientEmails.join(', ') || 'Admin Dashboard'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRestockAllLowItems}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-black text-white shadow-md transition"
              >
                <Plus className="h-3.5 w-3.5" /> Restock All (+{lowStockAlertConfig.autoReorderSuggestion})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('automation')}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200 transition"
              >
                <Settings className="h-3.5 w-3.5 text-indigo-400" /> Alert Rules &amp; Emails
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {belowThresholdProducts.map(item => {
              const qty = item.stockQuantity ?? (item.inStock ? 10 : 0);
              const threshold = item.lowStockThreshold ?? lowStockAlertConfig.globalDefaultThreshold;
              const isOut = !item.inStock || qty <= 0;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-2 rounded-2xl border p-3 ${
                    isOut
                      ? 'bg-rose-950/60 border-rose-500/40'
                      : 'bg-slate-950/90 border-amber-500/30'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-300 font-mono">
                      Stock: <strong className={isOut ? 'text-rose-400' : 'text-amber-400'}>{qty}</strong> / Threshold: {threshold}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => sendLowStockEmailAlert(item.id)}
                      className="p-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/30 transition"
                      title="Dispatch Email Alert Now"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => restockProduct(item.id, 15)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition"
                    >
                      +15
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => {
            setSelectedFilter('all');
            setActiveSubTab('inventory');
          }}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedFilter === 'all' && activeSubTab === 'inventory'
              ? 'border-emerald-500 bg-slate-900 shadow-md shadow-emerald-500/10'
              : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Monitored Menu Items</span>
            <Package className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{totalProducts}</p>
          <p className="text-[10px] text-slate-400 mt-1">
            {products.filter(p => p.alertEnabled !== false).length} with auto-alerts enabled
          </p>
        </div>

        <div
          onClick={() => {
            setSelectedFilter('in_stock');
            setActiveSubTab('inventory');
          }}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedFilter === 'in_stock' && activeSubTab === 'inventory'
              ? 'border-emerald-500 bg-slate-900 shadow-md shadow-emerald-500/10'
              : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Above Threshold</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">{inStockCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Healthy inventory levels</p>
        </div>

        <div
          onClick={() => {
            setSelectedFilter('low_stock');
            setActiveSubTab('inventory');
          }}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedFilter === 'low_stock' && activeSubTab === 'inventory'
              ? 'border-amber-500 bg-slate-900 shadow-md shadow-amber-500/10'
              : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Low Stock Warnings</span>
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-400">{lowStockCount}</p>
          <p className="text-[10px] text-amber-300/80 mt-1">At or below defined threshold</p>
        </div>

        <div
          onClick={() => {
            setSelectedFilter('out_of_stock');
            setActiveSubTab('inventory');
          }}
          className={`cursor-pointer rounded-2xl border p-4 transition ${
            selectedFilter === 'out_of_stock' && activeSubTab === 'inventory'
              ? 'border-rose-500 bg-slate-900 shadow-md shadow-rose-500/10'
              : 'border-slate-800 bg-slate-950 hover:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Out of Stock</span>
            <PackageX className="h-5 w-5 text-rose-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-400">{outOfStockCount}</p>
          <p className="text-[10px] text-rose-300/80 mt-1">0 units remaining</p>
        </div>
      </div>

      {/* Sub Tabs: Stock Table vs Automated Alert & Email Settings vs Alert Dispatch Log */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('inventory')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition ${
            activeSubTab === 'inventory'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="h-4 w-4" /> Stock &amp; Per-Item Thresholds
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('automation')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition ${
            activeSubTab === 'automation'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Mail className="h-4 w-4 text-sky-300" /> Automated Alert &amp; Email Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('activity')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl transition ${
            activeSubTab === 'activity'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <History className="h-4 w-4" /> Alert &amp; Email Dispatch Log ({adminAlerts.length})
          {unacknowledgedAlertsCount > 0 && (
            <span className="ml-1 text-[10px] font-black text-amber-300">
              · {unacknowledgedAlertsCount} new
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: STOCK CONTROL & PER-ITEM THRESHOLDS */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedCategoryId}
                onChange={e => setSelectedCategoryId(e.target.value)}
                className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                type="button"
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
                type="button"
                onClick={() => setSelectedFilter('out_of_stock')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedFilter === 'out_of_stock'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Out of Stock ({outOfStockCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('low_stock')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedFilter === 'low_stock'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Low Stock ({lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('in_stock')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedFilter === 'in_stock'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Healthy ({inStockCount})
              </button>
            </div>
          </div>

          {/* Product Inventory & Threshold Table */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Menu Item</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Current Stock</th>
                    <th className="py-3.5 px-4">Defined Threshold</th>
                    <th className="py-3.5 px-4">Auto-Alert Rule</th>
                    <th className="py-3.5 px-4 text-right">Restock &amp; Alert Actions</th>
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
                      const threshold = p.lowStockThreshold ?? lowStockAlertConfig.globalDefaultThreshold;
                      const catName = categories.find(c => c.id === p.categoryId)?.name || 'General';
                      const isAlertActive = p.alertEnabled !== false;

                      return (
                        <tr key={p.id} className="hover:bg-slate-900/50 transition">
                          {/* Product Image & Title */}
                          <td className="py-3.5 px-4">
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
                                <span className="text-[11px] text-slate-400">
                                  {catName} · ₱{p.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {status === 'out_of_stock' && (
                              <span className="text-xs font-black text-rose-400">
                                ● Out of Stock (0/{threshold})
                              </span>
                            )}
                            {status === 'low_stock' && (
                              <span className="text-xs font-black text-amber-400">
                                ▲ Below Threshold ({qty}/{threshold})
                              </span>
                            )}
                            {status === 'in_stock' && (
                              <span className="text-xs font-bold text-emerald-400">
                                ● Healthy ({qty}/{threshold})
                              </span>
                            )}
                          </td>

                          {/* Current Stock Stepper + Input */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updateProductStock(p.id, Math.max(0, qty - 1))}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                                title="Decrease stock by 1 (triggers alert if <= threshold)"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                min={0}
                                value={qty}
                                onChange={e => {
                                  const val = parseInt(e.target.value, 10);
                                  updateProductStock(p.id, isNaN(val) ? 0 : val);
                                }}
                                className="w-14 rounded-xl border border-slate-800 bg-slate-900 px-2 py-1 text-center font-mono font-extrabold text-white focus:border-emerald-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateProductStock(p.id, qty + 1)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
                                title="Increase stock by 1"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                          {/* Defined Threshold Limit */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400">≤</span>
                              <input
                                type="number"
                                min={1}
                                value={threshold}
                                onChange={e => {
                                  const val = parseInt(e.target.value, 10) || 1;
                                  setLowStockThreshold(p.id, val);
                                }}
                                className="w-14 rounded-xl border border-slate-800 bg-slate-900 px-2 py-1 text-center font-mono text-xs font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
                              />
                              <span className="text-[11px] text-slate-500">units</span>
                            </div>
                          </td>

                          {/* Per-Item Auto-Alert Toggle */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => toggleProductAlertEnabled(p.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition ${
                                isAlertActive
                                  ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60'
                                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              {isAlertActive ? (
                                <>
                                  <BellRing className="h-3.5 w-3.5 text-indigo-400" /> Auto-Alert ON
                                </>
                              ) : (
                                <>
                                  <BellOff className="h-3.5 w-3.5" /> Muted
                                </>
                              )}
                            </button>
                          </td>

                          {/* Restock & Direct Email Alert Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => sendLowStockEmailAlert(p.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-sky-500/15 hover:bg-sky-500 text-sky-300 hover:text-white border border-sky-500/30 px-2.5 py-1 text-[11px] font-bold transition"
                                title="Trigger email & dashboard alert for this item"
                              >
                                <Mail className="h-3 w-3" /> Email Alert
                              </button>
                              <button
                                type="button"
                                onClick={() => restockProduct(p.id, 10)}
                                className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-slate-700 transition"
                              >
                                +10
                              </button>
                              <button
                                type="button"
                                onClick={() => restockProduct(p.id, 25)}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white hover:bg-emerald-500 transition"
                              >
                                +25
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleProductStock(p.id)}
                                className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase transition ${
                                  p.inStock
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                }`}
                              >
                                {p.inStock ? 'Sold Out' : 'Available'}
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
      )}

      {/* SUB-TAB 2: AUTOMATED LOW STOCK ALERT & EMAIL CONFIGURATION */}
      {activeSubTab === 'automation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Notification Channels & Trigger Rules */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Automated Notification Channels &amp; Rules</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure how the Admin Dashboard notifies staff when menu items drop below their threshold
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 cursor-pointer">
                <div>
                  <p className="font-black text-white">Master Automated Low Stock Alert Engine</p>
                  <p className="text-[11px] text-slate-400">
                    Automatically evaluate stock levels after every order and inventory adjustment
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={lowStockAlertConfig.enabled}
                  onChange={e => updateLowStockAlertConfig({ enabled: e.target.checked })}
                  className="h-4 w-4 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 cursor-pointer">
                <div>
                  <p className="font-black text-white">Real-Time Dashboard Toast &amp; Banner Notifications</p>
                  <p className="text-[11px] text-slate-400">
                    Show instant visual popups and sound alerts inside the Admin &amp; Cashier views
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={lowStockAlertConfig.dashboardNotifications}
                  onChange={e => updateLowStockAlertConfig({ dashboardNotifications: e.target.checked })}
                  className="h-4 w-4 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 cursor-pointer">
                <div>
                  <p className="font-black text-white">Automated Email Alert Dispatch</p>
                  <p className="text-[11px] text-slate-400">
                    Generate and dispatch low-stock warning emails to configured recipients
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={lowStockAlertConfig.emailNotifications}
                  onChange={e => updateLowStockAlertConfig({ emailNotifications: e.target.checked })}
                  className="h-4 w-4 accent-emerald-500"
                />
              </label>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    Default Threshold (Units)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={lowStockAlertConfig.globalDefaultThreshold}
                    onChange={e =>
                      updateLowStockAlertConfig({
                        globalDefaultThreshold: Math.max(1, parseInt(e.target.value, 10) || 5),
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-sm font-black text-amber-400"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    Recommended Restock Qty
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={lowStockAlertConfig.autoReorderSuggestion}
                    onChange={e =>
                      updateLowStockAlertConfig({
                        autoReorderSuggestion: Math.max(5, parseInt(e.target.value, 10) || 25),
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-sm font-black text-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Email Recipients Directory */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white">Alert Recipient Email List</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Emails notified automatically whenever a menu item crosses its low-stock threshold
                </p>
              </div>

              <form onSubmit={handleAddRecipientEmail} className="flex gap-2">
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={e => setNewEmailInput(e.target.value)}
                  placeholder="Add recipient email (e.g. manager@restaurant.com)..."
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-black text-white transition"
                >
                  <Plus className="h-4 w-4" /> Add Email
                </button>
              </form>

              <div className="space-y-2">
                {lowStockAlertConfig.recipientEmails.map(email => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-sky-400" />
                      <span className="font-mono font-bold text-white">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipientEmail(email)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove recipient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Test automated scan across all {products.length} menu items:
              </span>
              <button
                type="button"
                onClick={() => runAutomatedStockScan()}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-lg transition"
              >
                <Send className="h-3.5 w-3.5" /> Run Scan &amp; Dispatch Emails
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ACTIVITY & EMAIL DISPATCH LOG */}
      {activeSubTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-white">
                Automated Low Stock Alert &amp; Email Dispatch History
              </h3>
              <p className="text-xs text-slate-400">
                Every threshold breach is logged below with its dashboard notification and email payload
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearAcknowledgedAlerts}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition"
              >
                Clear Acknowledged
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 space-y-3 max-h-[65vh] overflow-y-auto">
            {adminAlerts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No inventory alerts triggered yet. Lower a product&apos;s stock below its threshold to trigger an automated alert.
              </div>
            ) : (
              adminAlerts.map(alert => {
                const emailed = alert.channelsNotified?.includes('email');
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border text-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition ${
                      alert.acknowledged ? 'opacity-60 ' : ''
                    }${
                      alert.status === 'out_of_stock'
                        ? 'bg-rose-950/30 border-rose-800/60 text-rose-100'
                        : alert.status === 'low_stock'
                        ? 'bg-amber-950/30 border-amber-800/60 text-amber-100'
                        : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-100'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-black uppercase text-white">
                          {alert.status === 'out_of_stock'
                            ? '● CRITICAL OUT OF STOCK'
                            : alert.status === 'low_stock'
                            ? '▲ LOW STOCK THRESHOLD BREACH'
                            : '● RESTOCKED'}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-slate-300">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        {emailed && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="inline-flex items-center gap-1 text-sky-300 font-bold">
                              <Mail className="h-3 w-3" /> Email Sent ({alert.recipientEmails?.[0] || 'Admin'})
                            </span>
                          </>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-white">{alert.productName}</h4>
                      <p className="text-xs text-slate-200">{alert.message}</p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300 font-mono pt-0.5">
                        <span>
                          Stock Change: {alert.previousStock} → <strong>{alert.currentStock} units</strong>
                        </span>
                        <span>·</span>
                        <span>Defined Threshold: ≤ {alert.threshold ?? 5} units</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {alert.emailBodyPreview && (
                        <button
                          type="button"
                          onClick={() => setPreviewEmailAlert(alert)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-bold text-sky-300 transition"
                        >
                          <Mail className="h-3.5 w-3.5" /> View Email
                        </button>
                      )}

                      {(alert.status === 'low_stock' || alert.status === 'out_of_stock') && (
                        <button
                          type="button"
                          onClick={() => {
                            restockProduct(alert.productId, 15);
                            acknowledgeInventoryAlert(alert.id);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-black text-white transition"
                        >
                          <Plus className="h-3.5 w-3.5" /> Restock (+15)
                        </button>
                      )}

                      {!alert.acknowledged && (
                        <button
                          type="button"
                          onClick={() => acknowledgeInventoryAlert(alert.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 text-xs font-bold text-white transition"
                        >
                          <Check className="h-3.5 w-3.5" /> Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* EMAIL PAYLOAD PREVIEW MODAL */}
      {previewEmailAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-950 border border-slate-800 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-sky-400" />
                <h3 className="text-base font-black text-white">Dispatched Low Stock Email Notification</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmailAlert(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">To:</span>
                <span className="font-mono text-sky-300">
                  {(previewEmailAlert.recipientEmails || lowStockAlertConfig.recipientEmails).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Subject:</span>
                <span className="font-bold text-white text-right">{previewEmailAlert.emailSubject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Dispatched:</span>
                <span className="font-mono text-slate-300">
                  {new Date(previewEmailAlert.timestamp).toLocaleString()}
                </span>
              </div>
            </div>

            <pre className="whitespace-pre-wrap rounded-2xl bg-slate-900/90 border border-slate-800 p-4 text-xs font-mono text-slate-200 leading-relaxed max-h-60 overflow-y-auto">
              {previewEmailAlert.emailBodyPreview}
            </pre>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    `Subject: ${previewEmailAlert.emailSubject}\n\n${previewEmailAlert.emailBodyPreview}`
                  );
                  showToast('✓ Copied email content to clipboard!');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 transition"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Email Text
              </button>

              <a
                href={`mailto:${(previewEmailAlert.recipientEmails || lowStockAlertConfig.recipientEmails).join(
                  ','
                )}?subject=${encodeURIComponent(
                  previewEmailAlert.emailSubject || 'Low Stock Alert'
                )}&body=${encodeURIComponent(previewEmailAlert.emailBodyPreview || '')}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-black text-white shadow-lg transition"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open in Mail Client
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
