import React, { useState, useMemo } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Table, Order, OrderStatus } from '../../types';
import {
  Users,
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  Plus,
  Edit,
  Trash2,
  QrCode,
  Receipt,
  ExternalLink,
  Search,
  MapPin,
  Sparkles,
  Utensils,
  Armchair,
  CalendarClock,
  RotateCcw,
  X,
  Check,
  AlertCircle,
  LayoutGrid,
  List,
} from 'lucide-react';
import { ReceiptModal } from '../Common/ReceiptModal';

interface TableOccupancyTrackerProps {
  onOpenAddTableModal?: () => void;
  onEditTable?: (table: Table) => void;
  onSwitchToQrStudio?: (table: Table) => void;
}

export const TableOccupancyTracker: React.FC<TableOccupancyTrackerProps> = ({
  onOpenAddTableModal,
  onEditTable,
  onSwitchToQrStudio,
}) => {
  const {
    tables,
    orders,
    updateTable,
    setTableOccupancyStatus,
    deleteTable,
    updateOrderStatus,
    setActiveTable,
    selectTableByNumber,
    setViewMode,
  } = useOrderContext();

  const [occupancyFilter, setOccupancyFilter] = useState<'all' | 'occupied' | 'vacant' | 'reserved'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutView, setLayoutView] = useState<'grid' | 'sections'>('grid');

  // Local Edit/Create Table Modal state (if parent doesn't override or for inline editing)
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [formTableNumber, setFormTableNumber] = useState<string>('');
  const [formTableName, setFormTableName] = useState<string>('');
  const [formSection, setFormSection] = useState<Table['section']>('Main Hall');
  const [formCapacity, setFormCapacity] = useState<string>('4');
  const [formStatus, setFormStatus] = useState<Table['status']>('available');
  const [formOrderId, setFormOrderId] = useState<string>('');

  // Receipt Modal for active order inspection
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  // Map each table to its active orders (not completed and not cancelled)
  const tableOccupancyData = useMemo(() => {
    return tables.map(table => {
      const activeOrdersForTable = orders.filter(
        o =>
          (o.tableId === table.id || o.tableNumber === table.tableNumber) &&
          o.status !== 'completed' &&
          o.status !== 'cancelled'
      );

      const primaryOrder =
        activeOrdersForTable.find(o => o.id === table.currentOrderId) ||
        activeOrdersForTable[0] ||
        null;

      const hasActiveOrder = activeOrdersForTable.length > 0;
      const effectiveStatus: Table['status'] =
        hasActiveOrder || table.status === 'occupied'
          ? 'occupied'
          : table.status === 'reserved'
          ? 'reserved'
          : 'available';

      const activeSpend = activeOrdersForTable.reduce((sum, o) => sum + o.total, 0);

      return {
        table,
        activeOrders: activeOrdersForTable,
        primaryOrder,
        hasActiveOrder,
        effectiveStatus,
        activeSpend,
      };
    });
  }, [tables, orders]);

  // Summary KPIs
  const totalTables = tableOccupancyData.length;
  const occupiedEntries = tableOccupancyData.filter(d => d.effectiveStatus === 'occupied');
  const vacantEntries = tableOccupancyData.filter(d => d.effectiveStatus === 'available');
  const reservedEntries = tableOccupancyData.filter(d => d.effectiveStatus === 'reserved');
  const tablesWithLiveOrdersCount = tableOccupancyData.filter(d => d.hasActiveOrder).length;

  const totalSeats = tables.reduce((sum, t) => sum + (t.capacity || 0), 0);
  const occupiedSeats = occupiedEntries.reduce((sum, d) => sum + (d.table.capacity || 0), 0);
  const vacantSeats = vacantEntries.reduce((sum, d) => sum + (d.table.capacity || 0), 0);
  const occupancyRate = totalTables > 0 ? Math.round((occupiedEntries.length / totalTables) * 100) : 0;
  const activeFloorRevenue = tableOccupancyData.reduce((sum, d) => sum + d.activeSpend, 0);

  // Filtered tables
  const filteredEntries = useMemo(() => {
    return tableOccupancyData.filter(entry => {
      if (occupancyFilter === 'occupied' && entry.effectiveStatus !== 'occupied') return false;
      if (occupancyFilter === 'vacant' && entry.effectiveStatus !== 'available') return false;
      if (occupancyFilter === 'reserved' && entry.effectiveStatus !== 'reserved') return false;

      if (sectionFilter !== 'ALL' && entry.table.section !== sectionFilter) return false;

      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchesTable =
          entry.table.tableNumber.toLowerCase().includes(q) ||
          entry.table.name.toLowerCase().includes(q) ||
          entry.table.section.toLowerCase().includes(q);
        const matchesOrder = entry.activeOrders.some(
          o =>
            o.id.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.items.some(i => i.productName.toLowerCase().includes(q))
        );
        return matchesTable || matchesOrder;
      }

      return true;
    });
  }, [tableOccupancyData, occupancyFilter, sectionFilter, searchQuery]);

  // Open Edit Modal for a Table
  const handleOpenEditModal = (table: Table, currentEffectiveStatus: Table['status'], activeOrder?: Order | null) => {
    if (onEditTable) {
      onEditTable(table);
      return;
    }
    setEditingTable(table);
    setFormTableNumber(table.tableNumber);
    setFormTableName(table.name);
    setFormSection(table.section);
    setFormCapacity(String(table.capacity));
    setFormStatus(currentEffectiveStatus);
    setFormOrderId(table.currentOrderId || activeOrder?.id || '');
    setIsAddModalOpen(false);
  };

  const handleSaveTableEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !formTableNumber.trim()) return;

    updateTable({
      ...editingTable,
      tableNumber: formTableNumber.trim(),
      name: formTableName.trim() || `Table ${formTableNumber.trim()} (${formSection})`,
      section: formSection,
      capacity: Math.max(1, parseInt(formCapacity, 10) || 4),
      status: formStatus,
      currentOrderId: formStatus === 'occupied' && formOrderId.trim() ? formOrderId.trim() : undefined,
    });

    setEditingTable(null);
  };

  const handleVacateAndCompleteTable = (table: Table, activeOrders: Order[]) => {
    activeOrders.forEach(ord => {
      updateOrderStatus(ord.id, 'completed');
    });
    setTableOccupancyStatus(table.id, 'available');
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'ready':
        return {
          label: 'Ready to Serve',
          cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Bell className="h-3 w-3 text-emerald-400 animate-bounce" />,
        };
      case 'preparing':
        return {
          label: 'Preparing',
          cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <ChefHat className="h-3 w-3 text-amber-400" />,
        };
      case 'accepted':
        return {
          label: 'Accepted',
          cls: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          icon: <CheckCircle2 className="h-3 w-3 text-sky-400" />,
        };
      case 'pending':
      default:
        return {
          label: 'Pending Kitchen',
          cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <Clock className="h-3 w-3 text-rose-400" />,
        };
    }
  };

  const formatElapsedMinutes = (isoString: string) => {
    const diffMs = Math.max(0, Date.now() - new Date(isoString).getTime());
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  const renderTableCard = (entry: (typeof tableOccupancyData)[number]) => {
    const { table, activeOrders, primaryOrder, hasActiveOrder, effectiveStatus, activeSpend } = entry;
    const isOccupied = effectiveStatus === 'occupied';
    const isReserved = effectiveStatus === 'reserved';
    const isVacant = effectiveStatus === 'available';

    const orderStatusInfo = primaryOrder ? getOrderStatusBadge(primaryOrder.status) : null;
    const totalActiveItems = activeOrders.reduce(
      (sum, ord) => sum + ord.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    return (
      <div
        key={table.id}
        className={`relative rounded-3xl border p-5 shadow-xl transition flex flex-col justify-between ${
          isOccupied
            ? 'border-amber-500/50 bg-gradient-to-b from-amber-950/25 via-slate-950 to-slate-950 hover:border-amber-400/70'
            : isReserved
            ? 'border-indigo-500/50 bg-gradient-to-b from-indigo-950/25 via-slate-950 to-slate-950 hover:border-indigo-400/70'
            : 'border-emerald-500/30 bg-slate-950 hover:border-emerald-500/60'
        }`}
      >
        {/* Top Row: Table Identity & Visual Occupancy Status Indicator */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border font-black ${
                  isOccupied
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-lg shadow-amber-500/10'
                    : isReserved
                    ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                }`}
              >
                <span className="text-[9px] uppercase tracking-wider opacity-75">TBL</span>
                <span className="text-base leading-none">#{table.tableNumber}</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">{table.name}</h4>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-indigo-400" />
                    {table.section}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Armchair className="h-3 w-3 text-slate-400" />
                    {table.capacity} Seats
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Table Button */}
            <button
              type="button"
              onClick={() => handleOpenEditModal(table, effectiveStatus, primaryOrder)}
              className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:border-indigo-500 hover:bg-indigo-600 hover:text-white transition shrink-0"
              title="Edit Table Details, Capacity, Section, or Status"
            >
              <Edit className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {/* Visual Occupancy Status Banner */}
          <div
            className={`mb-3 flex items-center justify-between rounded-2xl border px-3 py-2 text-xs font-black ${
              isOccupied
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                : isReserved
                ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isOccupied
                    ? 'bg-amber-400 animate-ping'
                    : isReserved
                    ? 'bg-indigo-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="uppercase tracking-wider text-[11px]">
                {isOccupied
                  ? hasActiveOrder
                    ? `OCCUPIED • ${activeOrders.length} ACTIVE ${
                        activeOrders.length === 1 ? 'ORDER' : 'ORDERS'
                      }`
                    : 'OCCUPIED • SEATED GUESTS'
                  : isReserved
                  ? 'RESERVED TABLE'
                  : 'VACANT • AVAILABLE FOR SEATING'}
              </span>
            </div>

            {isOccupied && activeSpend > 0 && (
              <span className="text-xs font-black text-white">₱{activeSpend.toFixed(2)}</span>
            )}
          </div>

          {/* Active Order Details Box (when table has active order) vs Vacant State Box */}
          {primaryOrder ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">#{primaryOrder.id}</span>
                  {orderStatusInfo && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${orderStatusInfo.cls}`}
                    >
                      {orderStatusInfo.icon}
                      <span>{orderStatusInfo.label}</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {formatElapsedMinutes(primaryOrder.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-bold truncate">Guest: {primaryOrder.customerName}</span>
                <span
                  className={`font-black uppercase text-[10px] ${
                    primaryOrder.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {primaryOrder.paymentStatus === 'paid' ? '✓ PAID' : 'UNPAID'}
                </span>
              </div>

              {/* Dish list preview */}
              <div className="space-y-1 pt-1 border-t border-slate-800/80">
                {primaryOrder.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                    <span className="truncate pr-2">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="text-slate-400 shrink-0">₱{item.itemTotal.toFixed(2)}</span>
                  </div>
                ))}
                {primaryOrder.items.length > 3 && (
                  <p className="text-[10px] text-slate-500 italic">
                    +{primaryOrder.items.length - 3} more dish(es) ({totalActiveItems} total items)
                  </p>
                )}
              </div>

              {/* Active Order Quick Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedReceiptOrder(primaryOrder)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-800 py-1.5 px-2.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700 transition"
                >
                  <Receipt className="h-3 w-3 text-emerald-400" />
                  <span>Receipt &amp; QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVacateAndCompleteTable(table, activeOrders)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-600/20 border border-emerald-500/30 py-1.5 px-2.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition"
                  title="Mark active order completed and set table to Vacant"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Complete &amp; Clear</span>
                </button>
              </div>
            </div>
          ) : isOccupied ? (
            <div className="rounded-2xl border border-amber-500/20 bg-slate-900/60 p-3.5 text-center space-y-1.5">
              <Users className="h-5 w-5 text-amber-400 mx-auto" />
              <p className="text-xs font-bold text-slate-200">
                Guests Seated — Browsing Menu
              </p>
              <p className="text-[11px] text-slate-400">
                Table is marked occupied while guests scan the QR code or place their order.
              </p>
            </div>
          ) : isReserved ? (
            <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 p-3.5 text-center space-y-1.5">
              <CalendarClock className="h-5 w-5 text-indigo-400 mx-auto" />
              <p className="text-xs font-bold text-slate-200">Reserved for Incoming Party</p>
              <p className="text-[11px] text-slate-400">
                Holding {table.capacity} seats in {table.section}.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-center space-y-1.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-emerald-300">Table Vacant &amp; Sanitized</p>
              <p className="text-[11px] text-slate-400">
                No active orders. Ready to seat up to {table.capacity} guests.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Controls: Quick Occupancy Switcher & Table Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800/90 space-y-2.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Status:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTableOccupancyStatus(table.id, 'available')}
                className={`rounded-lg px-2 py-1 text-[10px] font-black transition ${
                  isVacant
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-emerald-300 border border-slate-800'
                }`}
              >
                Vacant
              </button>
              <button
                type="button"
                onClick={() =>
                  setTableOccupancyStatus(table.id, 'occupied', primaryOrder?.id)
                }
                className={`rounded-lg px-2 py-1 text-[10px] font-black transition ${
                  isOccupied
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                }`}
              >
                Occupied
              </button>
              <button
                type="button"
                onClick={() => setTableOccupancyStatus(table.id, 'reserved')}
                className={`rounded-lg px-2 py-1 text-[10px] font-black transition ${
                  isReserved
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-indigo-300 border border-slate-800'
                }`}
              >
                Reserved
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTable(table);
                selectTableByNumber(table.tableNumber);
                setViewMode('customer');
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 py-2 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
              <span>Open Table Menu</span>
            </button>

            {onSwitchToQrStudio && (
              <button
                type="button"
                onClick={() => onSwitchToQrStudio(table)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 transition"
                title="Configure QR Code & URL Parameters"
              >
                <QrCode className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => deleteTable(table.id)}
              className="p-2 rounded-xl bg-red-950/60 border border-red-900/50 text-red-400 hover:bg-red-900/80 transition"
              title="Delete Table"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Occupancy Header & Visual Meter */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Armchair className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Live Floor Occupancy &amp; Table Management
              </h3>
              <p className="text-xs text-slate-400">
                Real-time visual tracking of tables with active orders vs. vacant tables — click any table to update or edit details
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setLayoutView('grid')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  layoutView === 'grid'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> All Tables Grid
              </button>
              <button
                type="button"
                onClick={() => setLayoutView('sections')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  layoutView === 'sections'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="h-3.5 w-3.5" /> Floor Zones
              </button>
            </div>

            {onOpenAddTableModal && (
              <button
                type="button"
                onClick={onOpenAddTableModal}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Table</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => setOccupancyFilter(occupancyFilter === 'occupied' ? 'all' : 'occupied')}
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              occupancyFilter === 'occupied'
                ? 'border-amber-500 bg-amber-500/15'
                : 'border-amber-500/30 bg-amber-950/20 hover:border-amber-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Active / Occupied Tables
              </span>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{occupiedEntries.length}</span>
              <span className="text-xs font-bold text-amber-300">
                / {totalTables} Tables ({occupancyRate}%)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {tablesWithLiveOrdersCount} with active kitchen orders • {occupiedSeats} seats in use
            </p>
          </div>

          <div
            onClick={() => setOccupancyFilter(occupancyFilter === 'vacant' ? 'all' : 'vacant')}
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              occupancyFilter === 'vacant'
                ? 'border-emerald-500 bg-emerald-500/15'
                : 'border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                Vacant / Available Tables
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{vacantEntries.length}</span>
              <span className="text-xs font-bold text-emerald-300">Ready to Seat</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {vacantSeats} open seats across available tables
            </p>
          </div>

          <div
            onClick={() => setOccupancyFilter(occupancyFilter === 'reserved' ? 'all' : 'reserved')}
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              occupancyFilter === 'reserved'
                ? 'border-indigo-500 bg-indigo-500/15'
                : 'border-indigo-500/30 bg-indigo-950/20 hover:border-indigo-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
                Reserved Tables
              </span>
              <CalendarClock className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{reservedEntries.length}</span>
              <span className="text-xs font-bold text-indigo-300">Held for Guests</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Total restaurant capacity: {totalSeats} seats
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Active Floor Bill Value
              </span>
              <Utensils className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">
                ₱{activeFloorRevenue.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Live running total across {tablesWithLiveOrdersCount} active table(s)
            </p>
          </div>
        </div>

        {/* Visual Segmented Occupancy Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Occupied / Active Orders ({occupiedEntries.length})
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Vacant ({vacantEntries.length})
              </span>
              <span className="flex items-center gap-1.5 text-indigo-300">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                Reserved ({reservedEntries.length})
              </span>
            </div>
            <span className="text-slate-400">{occupancyRate}% Floor Occupancy</span>
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
            {occupiedEntries.length > 0 && (
              <div
                style={{ width: `${(occupiedEntries.length / Math.max(1, totalTables)) * 100}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Occupied: ${occupiedEntries.length}`}
              />
            )}
            {vacantEntries.length > 0 && (
              <div
                style={{ width: `${(vacantEntries.length / Math.max(1, totalTables)) * 100}%` }}
                className="bg-emerald-500 transition-all duration-500"
                title={`Vacant: ${vacantEntries.length}`}
              />
            )}
            {reservedEntries.length > 0 && (
              <div
                style={{ width: `${(reservedEntries.length / Math.max(1, totalTables)) * 100}%` }}
                className="bg-indigo-500 transition-all duration-500"
                title={`Reserved: ${reservedEntries.length}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: `All Tables (${totalTables})` },
              { id: 'occupied', label: `Active / Occupied (${occupiedEntries.length})` },
              { id: 'vacant', label: `Vacant (${vacantEntries.length})` },
              { id: 'reserved', label: `Reserved (${reservedEntries.length})` },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setOccupancyFilter(tab.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                occupancyFilter === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <span className="mx-1 text-slate-700 hidden sm:inline">|</span>

          {['ALL', 'Main Hall', 'Patio', 'VIP Room', 'Bar Area'].map(sec => (
            <button
              key={sec}
              type="button"
              onClick={() => setSectionFilter(sec)}
              className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                sectionFilter === sec
                  ? 'bg-slate-800 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sec === 'ALL' ? 'All Zones' : sec}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search table #, guest, order..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Tables Display */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-10 text-center space-y-2">
          <Armchair className="h-8 w-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-black text-white">No matching tables found</h4>
          <p className="text-xs text-slate-400">
            Try clearing your search or switching the occupancy filter back to &ldquo;All Tables&rdquo;.
          </p>
        </div>
      ) : layoutView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map(entry => renderTableCard(entry))}
        </div>
      ) : (
        <div className="space-y-6">
          {(['Main Hall', 'Patio', 'VIP Room', 'Bar Area'] as const).map(zone => {
            const zoneTables = filteredEntries.filter(e => e.table.section === zone);
            if (zoneTables.length === 0) return null;
            const zoneOccupied = zoneTables.filter(e => e.effectiveStatus === 'occupied').length;

            return (
              <div key={zone} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-400" />
                    <h4 className="text-sm font-black text-white">{zone}</h4>
                    <span className="text-xs text-slate-400">
                      ({zoneOccupied} occupied / {zoneTables.length} total)
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {zoneTables.map(entry => renderTableCard(entry))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Table Modal */}
      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 p-5 text-white border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Edit className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Edit Table #{editingTable.tableNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Update table number, label, dining section, capacity &amp; occupancy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTableEdits} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Table Number:
                  </label>
                  <input
                    type="text"
                    required
                    value={formTableNumber}
                    onChange={e => setFormTableNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Seat Capacity:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={formCapacity}
                    onChange={e => setFormCapacity(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-bold focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Table Display Label / Name:
                </label>
                <input
                  type="text"
                  required
                  value={formTableName}
                  onChange={e => setFormTableName(e.target.value)}
                  placeholder="e.g. Table 1 (Main Hall Window)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Dining Section:
                  </label>
                  <select
                    value={formSection}
                    onChange={e => setFormSection(e.target.value as Table['section'])}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Main Hall">Main Hall</option>
                    <option value="Patio">Patio</option>
                    <option value="VIP Room">VIP Room</option>
                    <option value="Bar Area">Bar Area</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Occupancy Status:
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as Table['status'])}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-bold focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="available">Vacant / Available</option>
                    <option value="occupied">Occupied (Active)</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>
              </div>

              {formStatus === 'occupied' && (
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Linked Active Order ID (Optional):
                  </label>
                  <input
                    type="text"
                    value={formOrderId}
                    onChange={e => setFormOrderId(e.target.value)}
                    placeholder="e.g. ORD-101"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 font-black text-white hover:bg-indigo-500 transition"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Table Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 font-bold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt & Payment QR Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
};
