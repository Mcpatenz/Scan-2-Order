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
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PrintQRModal } from '../Common/PrintQRModal';
import { SalesReportSection } from '../Common/SalesReportSection';
import { AdminInventoryToast } from './AdminInventoryToast';
import { AdminInventoryManager } from './AdminInventoryManager';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { EmployeeManager } from './EmployeeManager';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStock,
    categories,
    addCategory,
    deleteCategory,
    tables,
    addTable,
    deleteTable,
    orders,
    setViewMode,
    setActiveTable,
    showToast,
  } = useOrderContext();

  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'inventory' | 'employees' | 'categories' | 'tables' | 'reports'>('analytics');

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

  // Table form state
  const [tableFormOpen, setTableFormOpen] = useState(false);
  const [tblNumber, setTblNumber] = useState('');
  const [tblName, setTblName] = useState('');
  const [tblSection, setTblSection] = useState<Table['section']>('Main Hall');
  const [tblCapacity, setTblCapacity] = useState('4');

  // Category form state
  const [newCatName, setNewCatName] = useState('');

  // Printable QR Modal
  const [selectedPrintTable, setSelectedPrintTable] = useState<Table | null>(null);

  // Search product
  const [productSearch, setProductSearch] = useState('');

  // Analytics Math
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled' && o.paymentStatus === 'paid')
    .reduce((acc, o) => acc + o.total, 0);

  const totalOrdersCount = orders.length;
  const occupiedTablesCount = tables.filter(t => t.status === 'occupied').length;

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

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tblNumber.trim()) return;

    addTable(
      tblNumber.trim(),
      tblName.trim() || `Table ${tblNumber}`,
      tblSection,
      parseInt(tblCapacity) || 4
    );

    setTableFormOpen(false);
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

  // Low or out of stock warning count for tab badge
  const lowOrOutCount = products.filter(
    p => !p.inStock || (p.stockQuantity !== undefined && p.stockQuantity <= (p.lowStockThreshold ?? 5))
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
            <Package className="h-3.5 w-3.5" /> Inventory & Stock
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
        </div>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && <AnalyticsDashboard />}

      {/* TAB: EMPLOYEES */}
      {activeTab === 'employees' && <EmployeeManager />}

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
                    <span className="text-base font-black text-emerald-400">${p.price.toFixed(2)}</span>

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

      {/* TAB 4: TABLES & QR CODES */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-white">Registered Tables & QR Codes</h3>
            <button
              onClick={() => setTableFormOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" /> Add New Table
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map(tbl => {
              const targetUrl = window.location.origin + `?table=${tbl.tableNumber}`;
              return (
                <div key={tbl.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-black text-white">TABLE #{tbl.tableNumber}</h4>
                        <p className="text-xs text-slate-400">{tbl.name} • {tbl.section}</p>
                      </div>
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                        Cap: {tbl.capacity} Seats
                      </span>
                    </div>

                    {/* QR Code Container */}
                    <div className="my-3 flex justify-center bg-white p-3 rounded-2xl">
                      <QRCodeSVG value={targetUrl} size={140} level="M" />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                    <button
                      onClick={() => {
                        setActiveTable(tbl);
                        setViewMode('customer');
                        showToast(`Simulating QR scan for Table #${tbl.tableNumber}`);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Simulate Scan (Customer View)
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedPrintTable(tbl)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 border border-slate-800 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print Flyer
                      </button>

                      <button
                        onClick={() => deleteTable(tbl.id)}
                        className="p-2 rounded-xl bg-red-950 text-red-400 border border-red-900/50 hover:bg-red-900"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
                  <label className="block text-slate-400 mb-1">Price ($):</label>
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

      {/* Table Form Modal */}
      {tableFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-5 text-white border border-slate-800">
            <h3 className="text-base font-bold mb-4">Add New Table</h3>
            <form onSubmit={handleSaveTable} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Table Number (e.g. 7):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7"
                  value={tblNumber}
                  onChange={e => setTblNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
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
                <label className="block text-slate-400 mb-1">Capacity (Seats):</label>
                <input
                  type="number"
                  value={tblCapacity}
                  onChange={e => setTblCapacity(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-bold hover:bg-indigo-500"
                >
                  Create Table & QR
                </button>
                <button
                  type="button"
                  onClick={() => setTableFormOpen(false)}
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
        isOpen={!!selectedPrintTable}
        onClose={() => setSelectedPrintTable(null)}
      />

    </div>
  );
};
