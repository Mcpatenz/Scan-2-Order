import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Product, Table, Category } from '../../types';
import {
  Settings,
  BarChart3,
  Utensils,
  FolderPlus,
  QrCode,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  ExternalLink,
  Flame,
  Search,
  Package,
  AlertTriangle,
  Users,
  Armchair,
  Clock,
  Mail,
  BellRing,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PrintQRModal } from '../Common/PrintQRModal';
import { SalesReportSection } from '../Common/SalesReportSection';
import { AdminInventoryToast } from './AdminInventoryToast';
import { AdminInventoryManager } from './AdminInventoryManager';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { EmployeeManager } from './EmployeeManager';
import { TableQRGeneratorTool } from './TableQRGeneratorTool';
import { TableOccupancyTracker } from './TableOccupancyTracker';
import { LaborHoursReport } from './LaborHoursReport';
import { AdminSettingsManager } from './AdminSettingsManager';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStock,
    restockProduct,
    lowStockAlertConfig,
    runAutomatedStockScan,
    categories,
    addCategory,
    deleteCategory,
    tables,
    addTable,
    updateTable,
    deleteTable,
    orders,
    employeeSchedules,
    setViewMode,
    setActiveTable,
    showToast,
  } = useOrderContext();

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'occupancy' | 'products' | 'inventory' | 'employees' | 'labor_hours' | 'categories' | 'tables' | 'reports' | 'settings'
  >('analytics');

  // Product modal form state
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('cat-mains');
  const [prodPrice, setProdPrice] = useState('10.00');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80');
  const [prodCalories, setProdCalories] = useState('450');
  const [prodPrepTime, setProdPrepTime] = useState('10');
  const [prodStockQuantity, setProdStockQuantity] = useState('10');
  const [prodLowStockThreshold, setProdLowStockThreshold] = useState('5');
  const [prodPopular, setProdPopular] = useState(false);

  // Table form state (Add & Edit)
  const [tableFormOpen, setTableFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tblNumber, setTblNumber] = useState('');
  const [tblName, setTblName] = useState('');
  const [tblSection, setTblSection] = useState<Table['section']>('Main Hall');
  const [tblCapacity, setTblCapacity] = useState('4');
  const [tblStatus, setTblStatus] = useState<Table['status']>('available');

  // Category form state
  const [newCatName, setNewCatName] = useState('');

  // Printable QR Modal
  const [selectedPrintTable, setSelectedPrintTable] = useState<Table | null>(null);
  const [selectedPrintCustomUrl, setSelectedPrintCustomUrl] = useState<string | undefined>(undefined);

  // Search product
  const [productSearch, setProductSearch] = useState('');

  // Analytics Math
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled' && o.paymentStatus === 'paid')
    .reduce((acc, o) => acc + o.total, 0);

  const totalOrdersCount = orders.length;
  const occupiedTablesCount = tables.filter(t => {
    const hasActiveOrd = orders.some(
      o =>
        (o.tableId === t.id || o.tableNumber === t.tableNumber) &&
        o.status !== 'completed' &&
        o.status !== 'cancelled'
    );
    return hasActiveOrd || t.status === 'occupied';
  }).length;

  // Open edit product modal
  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.categoryId);
    setProdPrice(p.price.toString());
    setProdDesc(p.description);
    setProdImage(p.image);
    setProdCalories((p.calories || 400).toString());
    setProdPrepTime((p.prepTimeMinutes || 10).toString());
    setProdStockQuantity((p.stockQuantity ?? (p.inStock ? 10 : 0)).toString());
    setProdLowStockThreshold((p.lowStockThreshold ?? 5).toString());
    setProdPopular(!!p.isPopular);
    setProductFormOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const stockQty = parseInt(prodStockQuantity) || 0;
    const lowThreshold = parseInt(prodLowStockThreshold) || 5;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: prodName,
        categoryId: prodCategory,
        price: parseFloat(prodPrice) || 0,
        description: prodDesc,
        image: prodImage,
        stockQuantity: stockQty,
        lowStockThreshold: lowThreshold,
        inStock: stockQty > 0,
        calories: parseInt(prodCalories) || 400,
        prepTimeMinutes: parseInt(prodPrepTime) || 10,
        isPopular: prodPopular,
      });
    } else {
      addProduct({
        name: prodName,
        categoryId: prodCategory,
        price: parseFloat(prodPrice) || 0,
        description: prodDesc,
        image: prodImage,
        stockQuantity: stockQty,
        lowStockThreshold: lowThreshold,
        inStock: stockQty > 0,
        calories: parseInt(prodCalories) || 400,
        prepTimeMinutes: parseInt(prodPrepTime) || 10,
        isPopular: prodPopular,
      });
    }

    setProductFormOpen(false);
    setEditingProduct(null);
  };

  const openAddTableModal = () => {
    setEditingTable(null);
    setTblNumber('');
    setTblName('');
    setTblSection('Main Hall');
    setTblCapacity('4');
    setTblStatus('available');
    setTableFormOpen(true);
  };

  const openEditTableModal = (table: Table) => {
    const hasActiveOrd = orders.some(
      o =>
        (o.tableId === table.id || o.tableNumber === table.tableNumber) &&
        o.status !== 'completed' &&
        o.status !== 'cancelled'
    );
    setEditingTable(table);
    setTblNumber(table.tableNumber);
    setTblName(table.name);
    setTblSection(table.section);
    setTblCapacity(String(table.capacity));
    setTblStatus(hasActiveOrd || table.status === 'occupied' ? 'occupied' : table.status);
    setTableFormOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tblNumber.trim()) return;

    if (editingTable) {
      updateTable({
        ...editingTable,
        tableNumber: tblNumber.trim(),
        name: tblName.trim() || `Table ${tblNumber.trim()} (${tblSection})`,
        section: tblSection,
        capacity: Math.max(1, parseInt(tblCapacity, 10) || 4),
        status: tblStatus,
      });
    } else {
      addTable(
        tblNumber.trim(),
        tblName.trim() || `Table ${tblNumber}`,
        tblSection,
        parseInt(tblCapacity) || 4
      );
    }

    setTableFormOpen(false);
    setEditingTable(null);
    setTblNumber('');
    setTblName('');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
    }
  };

  const exportSalesJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sales_report_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Sales report JSON downloaded!');
  };

  // Low or out of stock warning items
  const lowOrOutProducts = products.filter(
    p =>
      !p.inStock ||
      (p.stockQuantity !== undefined &&
        p.stockQuantity <= (p.lowStockThreshold ?? lowStockAlertConfig.globalDefaultThreshold))
  );
  const lowOrOutCount = lowOrOutProducts.length;

  const activeStaffOnClock = employeeSchedules.filter(
    s => s.status === 'clocked_in' || s.status === 'on_break'
  ).length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-900 text-slate-100 p-4 md:p-6 space-y-6">
      
      {/* Live Admin Inventory Alert Toast Notification */}
      <AdminInventoryToast onNavigateToInventory={() => setActiveTab('inventory')} />

      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-500/20">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Admin Management Panel</h2>
            <p className="text-xs text-slate-400">Configure Menu, Categories, Tables & View Analytics</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" /> Analytics
          </button>

          <button
            onClick={() => setActiveTab('occupancy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'occupancy' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Armchair className="h-3.5 w-3.5" /> Table Occupancy
            <span className="flex h-4 px-1.5 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300">
              {occupiedTablesCount}/{tables.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'products' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="h-3.5 w-3.5" /> Products ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'inventory' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BellRing className="h-3.5 w-3.5 text-amber-400" /> Stock &amp; Low Stock Alerts
            {lowOrOutCount > 0 && (
              <span className="flex h-4 px-1.5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white animate-pulse">
                {lowOrOutCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'employees' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" /> Employees
          </button>

          <button
            onClick={() => setActiveTab('labor_hours')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'labor_hours' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-emerald-400" /> Labor Hours
            <span className="text-[10px] font-black text-emerald-300">
              ({activeStaffOnClock})
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'categories' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderPlus className="h-3.5 w-3.5" /> Categories
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'tables' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" /> Tables & QRs ({tables.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Sales Log
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="h-3.5 w-3.5 text-indigo-400" /> Settings
          </button>
        </div>
      </div>

      {/* Persistent Automated Low Stock Alert Banner across Admin Views */}
      {lowStockAlertConfig.enabled &&
        lowStockAlertConfig.dashboardNotifications &&
        lowOrOutProducts.length > 0 &&
        activeTab !== 'inventory' && (
          <div className="rounded-3xl border border-amber-500/50 bg-amber-950/35 p-4 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-black text-white uppercase tracking-wide">
                    Automated Low Stock Alert ({lowOrOutProducts.length} Item{lowOrOutProducts.length > 1 ? 's' : ''})
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="inline-flex items-center gap-1 text-sky-300 font-semibold">
                    <Mail className="h-3.5 w-3.5" /> Auto-Email Active ({lowStockAlertConfig.recipientEmails[0] || 'Admin'})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-200">
                  {lowOrOutProducts.map(item => {
                    const qty = item.stockQuantity ?? (item.inStock ? 10 : 0);
                    const limit = item.lowStockThreshold ?? lowStockAlertConfig.globalDefaultThreshold;
                    return (
                      <span key={item.id} className="font-semibold">
                        <strong className={!item.inStock || qty <= 0 ? 'text-rose-400' : 'text-amber-300'}>
                          {item.name}
                        </strong>{' '}
                        <span className="font-mono text-[11px] text-slate-300">
                          ({qty}/{limit} units)
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => runAutomatedStockScan()}
                className="flex items-center gap-1.5 rounded-xl bg-sky-600/25 hover:bg-sky-600 border border-sky-500/40 px-3 py-2 text-xs font-bold text-sky-200 hover:text-white transition"
              >
                <Mail className="h-3.5 w-3.5" /> Dispatch Email Alert
              </button>
              <button
                type="button"
                onClick={() => {
                  lowOrOutProducts.forEach(p =>
                    restockProduct(p.id, lowStockAlertConfig.autoReorderSuggestion || 25)
                  );
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-black text-white transition"
              >
                <Plus className="h-3.5 w-3.5" /> Restock All (+{lowStockAlertConfig.autoReorderSuggestion})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-bold text-white transition"
              >
                Manage Thresholds →
              </button>
            </div>
          </div>
        )}

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && <AnalyticsDashboard />}

      {/* TAB: TABLE OCCUPANCY TRACKING & TABLE EDITOR */}
      {activeTab === 'occupancy' && (
        <TableOccupancyTracker
          onOpenAddTableModal={openAddTableModal}
          onEditTable={openEditTableModal}
          onSwitchToQrStudio={() => setActiveTab('tables')}
        />
      )}

      {/* TAB: EMPLOYEES */}
      {activeTab === 'employees' && <EmployeeManager />}

      {/* TAB: LABOR HOURS REPORT */}
      {activeTab === 'labor_hours' && <LaborHoursReport />}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setProdName('');
                setProdPrice('10.00');
                setProdDesc('');
                setProductFormOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" /> Add New Product
            </button>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products
              .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
              .map(p => (
                <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      <button
                        onClick={() => toggleProductStock(p.id)}
                        className={`absolute top-2 right-2 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                          p.inStock ? 'bg-emerald-500 text-slate-950' : 'bg-red-600 text-white'
                        }`}
                      >
                        {p.inStock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </div>

                    <h4 className="text-sm font-extrabold text-white">{p.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-base font-black text-emerald-400">₱{p.price.toFixed(2)}</span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditProduct(p)}
                        className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
                        title="Edit Product"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-2 rounded-lg bg-red-950 text-red-400 hover:text-red-300 border border-red-900/50"
                        title="Delete Product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="max-w-2xl space-y-6">
          {/* Add Category Form */}
          <form onSubmit={handleSaveCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Cocktails, Pizza, Vegan Specials..."
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
            >
              Add Category
            </button>
          </form>

          {/* List of categories */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4 divide-y divide-slate-800">
            {categories.map(c => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{c.name}</span>
                {c.id !== 'cat-all' && c.id !== 'cat-popular' && (
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TABLES & QR CODES (QR Code & URL Parameter Generator Studio) */}
      {activeTab === 'tables' && (
        <TableQRGeneratorTool
          onOpenAddTableModal={openAddTableModal}
          onEditTable={openEditTableModal}
          onSelectPrintTable={(tbl, customUrl) => {
            setSelectedPrintTable(tbl);
            setSelectedPrintCustomUrl(customUrl);
          }}
        />
      )}

      {/* TAB 5: INVENTORY */}
      {activeTab === 'inventory' && (
        <AdminInventoryManager />
      )}

      {/* TAB 6: REPORTS */}
      {activeTab === 'reports' && (
        <SalesReportSection
          orders={orders}
          userName="Store Admin Manager"
          role="Admin"
        />
      )}

      {/* TAB 7: SETTINGS */}
      {activeTab === 'settings' && <AdminSettingsManager />}

      {/* Product Edit Modal */}
      {productFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 p-5 text-white border border-slate-800 my-8">
            <h3 className="text-base font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Product Name:</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category:</label>
                <select
                  value={prodCategory}
                  onChange={e => setProdCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Price (₱):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPrice}
                    onChange={e => setProdPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Calories (kcal):</label>
                  <input
                    type="number"
                    value={prodCalories}
                    onChange={e => setProdCalories(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-amber-950/30 p-3 rounded-2xl border border-amber-500/30">
                <div>
                  <label className="block text-amber-300 font-bold mb-1">Stock Quantity:</label>
                  <input
                    type="number"
                    min="0"
                    value={prodStockQuantity}
                    onChange={e => setProdStockQuantity(e.target.value)}
                    className="w-full rounded-xl border border-amber-500/40 bg-slate-950 px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 font-bold mb-1">Low Stock Threshold:</label>
                  <input
                    type="number"
                    min="1"
                    value={prodLowStockThreshold}
                    onChange={e => setProdLowStockThreshold(e.target.value)}
                    className="w-full rounded-xl border border-amber-500/40 bg-slate-950 px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Image URL (Unsplash):</label>
                <input
                  type="text"
                  value={prodImage}
                  onChange={e => setProdImage(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description:</label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={e => setProdDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-bold hover:bg-indigo-500"
                >
                  Save Product
                </button>
                <button
                  type="button"
                  onClick={() => setProductFormOpen(false)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Form Modal (Add or Edit Table) */}
      {tableFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-5 text-white border border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold mb-4">
              {editingTable ? `Edit Table #${editingTable.tableNumber}` : 'Add New Table'}
            </h3>
            <form onSubmit={handleSaveTable} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 mb-1">Table Number (e.g. 7):</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7"
                    value={tblNumber}
                    onChange={e => setTblNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Capacity (Seats):</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={tblCapacity}
                    onChange={e => setTblCapacity(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Table Label / Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Table 7 (Patio Deck)"
                  value={tblName}
                  onChange={e => setTblName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-400 mb-1">Section:</label>
                  <select
                    value={tblSection}
                    onChange={e => setTblSection(e.target.value as Table['section'])}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="Main Hall">Main Hall</option>
                    <option value="Patio">Patio</option>
                    <option value="VIP Room">VIP Room</option>
                    <option value="Bar Area">Bar Area</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Occupancy Status:</label>
                  <select
                    value={tblStatus}
                    onChange={e => setTblStatus(e.target.value as Table['status'])}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-bold"
                  >
                    <option value="available">Vacant / Available</option>
                    <option value="occupied">Occupied (Active)</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-bold hover:bg-indigo-500"
                >
                  {editingTable ? 'Save Table Changes' : 'Create Table & QR'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTableFormOpen(false);
                    setEditingTable(null);
                  }}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print QR Flyer Modal */}
      <PrintQRModal
        table={selectedPrintTable}
        customUrl={selectedPrintCustomUrl}
        isOpen={!!selectedPrintTable}
        onClose={() => {
          setSelectedPrintTable(null);
          setSelectedPrintCustomUrl(undefined);
        }}
      />

    </div>
  );
};
