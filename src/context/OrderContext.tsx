import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Category,
  Product,
  Table,
  Order,
  OrderStatus,
  CartItem,
  ViewMode,
  PaymentStatus,
  WaiterRequest,
  CashierInfo,
  InventoryAlert,
  StockStatus,
  LoyaltyReward,
  LoyaltyTransaction,
  Employee,
  EmployeeSchedule,
  ClockLog,
  ClockStatus,
  ShiftSession,
  LowStockAlertConfig,
  CustomerFeedback,
  BusinessSettings,
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_TABLES, INITIAL_ORDERS } from '../data/mockData';
import { playChime } from '../utils/audio';
import { CustomerLanguage } from '../i18n/customerTranslations';

interface OrderContextType {
  // Navigation / View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  mobileFrameEnabled: boolean;
  setMobileFrameEnabled: (enabled: boolean) => void;
  customerLanguage: CustomerLanguage;
  setCustomerLanguage: (lang: CustomerLanguage) => void;

  // Active Customer Table
  activeTable: Table;
  setActiveTable: (table: Table) => void;
  selectTableByNumber: (tableNumber: string) => boolean;
  exitTableSession: () => void;

  // Whether the customer has claimed a table by scanning its QR code
  isTableSelected: boolean;
  // A scanned table waives the login requirement. Without a scan the customer must
  // be signed in (any role account) before they can add items to the cart or order.
  canOrder: boolean;

  // Products & Categories
  categories: Category[];
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProductStock: (id: string) => void;
  
  // Categories management
  addCategory: (name: string, icon?: string) => void;
  deleteCategory: (id: string) => void;

  // Tables management
  tables: Table[];
  addTable: (tableNumber: string, name: string, section: Table['section'], capacity: number) => void;
  updateTable: (updatedTable: Table) => void;
  setTableOccupancyStatus: (tableId: string, status: Table['status'], currentOrderId?: string) => void;
  deleteTable: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'itemTotal'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, newQty: number) => void;
  clearCart: () => void;
  appliedDiscountCode: string;
  discountAmount: number;
  applyDiscountCode: (code: string) => boolean;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;

  // Orders
  orders: Order[];
  placeOrder: (
    customerName: string,
    customerPhone: string,
    diningOption: 'dine_in' | 'takeout',
    paymentMethod: Order['paymentMethod'],
    notes?: string,
    scheduledFor?: string
  ) => Order | null;
  createWalkInPosOrder: (params: {
    customerName: string;
    customerPhone?: string;
    diningOption: 'dine_in' | 'takeout';
    tableId?: string;
    paymentMethod: Order['paymentMethod'];
    paymentStatus: PaymentStatus;
    items: CartItem[];
    discountAmount?: number;
    notes?: string;
  }) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: PaymentStatus) => void;
  adjustOrderWaitTime: (orderId: string, deltaMinutes: number) => void;
  cancelOrder: (orderId: string) => void;
  currentCustomerOrder: Order | null;
  customerOrderHistory: Order[];

  // Customer Feedback (Post-Payment)
  feedbacks: CustomerFeedback[];
  pendingFeedbackOrder: Order | null;
  setPendingFeedbackOrder: (order: Order | null) => void;
  submitCustomerFeedback: (
    orderId: string,
    rating: number,
    comment?: string,
    tags?: string[]
  ) => void;

  // Waiter Requests
  waiterRequests: WaiterRequest[];
  requestWaiterService: (type: WaiterRequest['type']) => void;
  resolveWaiterRequest: (id: string) => void;

  // Audio & Notification
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Inventory Management & Automated Low Stock Alerts
  adminAlerts: InventoryAlert[];
  activeAdminAlert: InventoryAlert | null;
  dismissActiveAdminAlert: () => void;
  acknowledgeInventoryAlert: (alertId: string) => void;
  clearAcknowledgedAlerts: () => void;
  lowStockAlertConfig: LowStockAlertConfig;
  updateLowStockAlertConfig: (updates: Partial<LowStockAlertConfig>) => void;
  toggleProductAlertEnabled: (productId: string) => void;
  sendLowStockEmailAlert: (productId: string) => void;
  runAutomatedStockScan: () => number;
  updateProductStock: (productId: string, newStock: number) => void;
  restockProduct: (productId: string, amount: number) => void;
  setLowStockThreshold: (productId: string, threshold: number) => void;
  triggerDemoInventoryAlert: (status: StockStatus) => void;

  // Active Cashier Session
  activeCashier: CashierInfo;
  setActiveCashier: (cashier: CashierInfo) => void;
  availableCashiers: CashierInfo[];
  switchCashierById: (id: string) => void;

  // Loyalty Points System
  loyaltyPoints: number;
  loyaltyHistory: LoyaltyTransaction[];
  redeemedLoyaltyDiscount: number;
  redeemedLoyaltyPoints: number;
  applyLoyaltyDiscount: (points: number, discountInDollars: number) => boolean;
  cancelLoyaltyDiscount: () => void;
  claimBonusLoyaltyPoints: (amount: number, reason: string) => void;

  // Employee Management & Authentication
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  currentEmployee: Employee | null;
  loginEmployee: (email: string, pass: string) => boolean;
  logoutEmployee: () => void;

  // Employee Time Clock & Labor Hours Tracking
  employeeSchedules: EmployeeSchedule[];
  clockLogs: ClockLog[];
  shiftSessions: ShiftSession[];
  performClockAction: (
    employeeId: string,
    action: 'clock_in' | 'break_start' | 'break_end' | 'clock_out',
    notes?: string
  ) => void;
  addManualShiftSession: (session: Omit<ShiftSession, 'id'>) => void;
  updateShiftSession: (session: ShiftSession) => void;
  deleteShiftSession: (id: string) => void;
  updateEmployeeHourlyRate: (employeeId: string, newRate: number) => void;

  // Business & Payment Settings (Admin Configurable)
  businessSettings: BusinessSettings;
  updateBusinessSettings: (updates: Partial<BusinessSettings>) => void;
  resetBusinessSettings: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-101',
    firstName: 'Alex',
    middleName: 'James',
    lastName: 'Mercer',
    gender: 'Male',
    status: 'Active',
    birthDate: '1988-05-14',
    address: '742 Evergreen Terrace, Springfield',
    contactNumber: '+1 (555) 234-5678',
    email: 'admin@restaurant.com',
    password: 'admin123',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    role: 'admin',
    employeeCode: 'EMP-101',
    pinCode: '1234',
    scheduledShift: '08:00 AM - 05:00 PM',
  },
  {
    id: 'emp-102',
    firstName: 'Sarah',
    middleName: 'Louise',
    lastName: 'Connor',
    gender: 'Female',
    status: 'Active',
    birthDate: '1992-09-22',
    address: '1048 Ocean Drive, Suite 4B, Miami',
    contactNumber: '+1 (555) 876-5432',
    email: 'cashier@restaurant.com',
    password: 'cashier123',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    role: 'cashier',
    employeeCode: 'EMP-102',
    pinCode: '5678',
    scheduledShift: '08:00 AM - 04:00 PM',
  },
  {
    id: 'emp-103',
    firstName: 'Marco',
    middleName: 'Antonio',
    lastName: 'Rossi',
    gender: 'Male',
    status: 'Active',
    birthDate: '1985-11-03',
    address: '512 Culinary Lane, Gourmet District',
    contactNumber: '+1 (555) 432-1098',
    email: 'kitchen@restaurant.com',
    password: 'kitchen123',
    photo: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
    role: 'kitchen',
    employeeCode: 'EMP-103',
    pinCode: '9012',
    scheduledShift: '10:00 AM - 08:00 PM',
  },
  {
    id: 'cus-201',
    firstName: 'Jamie',
    middleName: 'Reyes',
    lastName: 'Diaz',
    gender: 'Female',
    status: 'Active',
    birthDate: '1995-03-08',
    address: '88 Harbor Lane, Springfield',
    contactNumber: '+1 (555) 987-1122',
    email: 'customer@restaurant.com',
    password: 'customer123',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
    role: 'customer',
    employeeCode: 'CUS-201',
    pinCode: '4321',
  },
];

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('customer');
  const [mobileFrameEnabled, setMobileFrameEnabled] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Categories & Products state with localStorage
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('qr_app_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('qr_app_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [tables, setTables] = useState<Table[]>(() => {
    const saved = localStorage.getItem('qr_app_tables_v3');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [activeTable, setActiveTable] = useState<Table>(() => {
    const firstAvailable = tables.find(t => t.status === 'available');
    return firstAvailable || tables[0] || INITIAL_TABLES[0];
  });

  // A table is only "claimed" once the customer scans its QR code (or follows a ?table= deep link).
  // Until then the customer stays on the landing page and no table number is shown anywhere.
  const [isTableSelected, setIsTableSelected] = useState<boolean>(false);

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('qr_app_orders_v3');
    if (saved) {
      try {
        const parsed: Order[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(o => o.id));
        const missingSeedOrders = INITIAL_ORDERS.filter(o => !existingIds.has(o.id));
        return [...parsed, ...missingSeedOrders];
      } catch {
        return INITIAL_ORDERS;
      }
    }
    return INITIAL_ORDERS;
  });

  // Employee management state
  // Storage key is versioned: the seed now includes a `customer` role account, and
  // previously cached lists would not contain it.
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('qr_app_employees_v2');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(() => {
    const saved = localStorage.getItem('qr_app_current_employee');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('qr_app_employees_v2', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    if (currentEmployee) {
      localStorage.setItem('qr_app_current_employee', JSON.stringify(currentEmployee));
    } else {
      localStorage.removeItem('qr_app_current_employee');
    }
  }, [currentEmployee]);

  // Employee Time Clock & Labor Hours Seed Data
  const INITIAL_SCHEDULES: EmployeeSchedule[] = [
    {
      employeeId: 'cash-101',
      employeeName: 'Sarah Jenkins',
      role: 'Head Cashier',
      department: 'Front of House',
      employeeCode: 'EMP-9021',
      scheduledShift: '08:00 AM - 04:00 PM',
      scheduledHours: 8.0,
      hourlyRate: 145,
      status: 'clocked_in',
      lastClockIn: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
      accumulatedBreakMinutesToday: 0,
      totalHoursWorkedToday: 3.5,
      weeklyHoursWorked: 38.5,
      pinCode: '1234',
    },
    {
      employeeId: 'cash-102',
      employeeName: 'Alex Rivera',
      role: 'Senior Cashier',
      department: 'Front of House',
      employeeCode: 'EMP-9022',
      scheduledShift: '04:00 PM - 12:00 AM',
      scheduledHours: 8.0,
      hourlyRate: 135,
      status: 'clocked_out',
      lastClockOut: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
      accumulatedBreakMinutesToday: 30,
      totalHoursWorkedToday: 8.0,
      weeklyHoursWorked: 40.0,
      pinCode: '2222',
    },
    {
      employeeId: 'cash-103',
      employeeName: 'Marcus Vance',
      role: 'POS Specialist',
      department: 'Front of House',
      employeeCode: 'EMP-9023',
      scheduledShift: '08:00 AM - 04:00 PM',
      scheduledHours: 8.0,
      hourlyRate: 125,
      status: 'on_break',
      lastClockIn: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      breakStartTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      accumulatedBreakMinutesToday: 15,
      totalHoursWorkedToday: 3.75,
      weeklyHoursWorked: 35.75,
      pinCode: '3333',
    },
    {
      employeeId: 'cash-104',
      employeeName: 'Elena Rostova',
      role: 'Cashier & Supervisor',
      department: 'Management',
      employeeCode: 'EMP-9024',
      scheduledShift: '12:00 PM - 08:00 PM',
      scheduledHours: 8.0,
      hourlyRate: 165,
      status: 'clocked_in',
      lastClockIn: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
      accumulatedBreakMinutesToday: 0,
      totalHoursWorkedToday: 1.5,
      weeklyHoursWorked: 41.5,
      pinCode: '4444',
    },
    {
      employeeId: 'staff-105',
      employeeName: 'David Kim',
      role: 'Head Chef',
      department: 'Kitchen & Culinary',
      employeeCode: 'EMP-9025',
      scheduledShift: '07:30 AM - 03:30 PM',
      scheduledHours: 8.0,
      hourlyRate: 185,
      status: 'clocked_in',
      lastClockIn: new Date(Date.now() - 4.2 * 3600 * 1000).toISOString(),
      accumulatedBreakMinutesToday: 0,
      totalHoursWorkedToday: 4.2,
      weeklyHoursWorked: 44.2,
      pinCode: '5555',
    },
    {
      employeeId: 'staff-106',
      employeeName: 'Maria Santos',
      role: 'Lead Barista',
      department: 'Bar & Beverage',
      employeeCode: 'EMP-9026',
      scheduledShift: '08:00 AM - 04:00 PM',
      scheduledHours: 8.0,
      hourlyRate: 130,
      status: 'clocked_in',
      lastClockIn: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
      accumulatedBreakMinutesToday: 0,
      totalHoursWorkedToday: 3.8,
      weeklyHoursWorked: 37.8,
      pinCode: '6666',
    },
    {
      employeeId: 'emp-103',
      employeeName: 'Marco Rossi',
      role: 'Sous Chef',
      department: 'Kitchen & Culinary',
      employeeCode: 'EMP-103',
      scheduledShift: '10:00 AM - 06:00 PM',
      scheduledHours: 8.0,
      hourlyRate: 160,
      status: 'clocked_out',
      lastClockOut: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      accumulatedBreakMinutesToday: 30,
      totalHoursWorkedToday: 8.5,
      weeklyHoursWorked: 42.5,
      pinCode: '9012',
    },
  ];

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const yesterdayDateStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
  const twoDaysAgoDateStr = new Date(Date.now() - 48 * 3600 * 1000).toISOString().slice(0, 10);

  const INITIAL_SHIFT_SESSIONS: ShiftSession[] = [
    {
      id: 'shift-active-1',
      employeeId: 'cash-101',
      employeeName: 'Sarah Jenkins',
      employeeCode: 'EMP-9021',
      role: 'Head Cashier',
      department: 'Front of House',
      hourlyRate: 145,
      date: todayDateStr,
      scheduledShift: '08:00 AM - 04:00 PM',
      clockInTime: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
      breakMinutes: 0,
      regularHours: 3.5,
      overtimeHours: 0,
      totalHours: 3.5,
      status: 'active',
      notes: 'Morning POS terminal 1 opening shift',
    },
    {
      id: 'shift-active-2',
      employeeId: 'cash-103',
      employeeName: 'Marcus Vance',
      employeeCode: 'EMP-9023',
      role: 'POS Specialist',
      department: 'Front of House',
      hourlyRate: 125,
      date: todayDateStr,
      scheduledShift: '08:00 AM - 04:00 PM',
      clockInTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      breakMinutes: 15,
      regularHours: 3.75,
      overtimeHours: 0,
      totalHours: 3.75,
      status: 'on_break',
      notes: 'Covering counter 2 & takeout queue',
    },
    {
      id: 'shift-active-3',
      employeeId: 'cash-104',
      employeeName: 'Elena Rostova',
      employeeCode: 'EMP-9024',
      role: 'Cashier & Supervisor',
      department: 'Management',
      hourlyRate: 165,
      date: todayDateStr,
      scheduledShift: '12:00 PM - 08:00 PM',
      clockInTime: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
      breakMinutes: 0,
      regularHours: 1.5,
      overtimeHours: 0,
      totalHours: 1.5,
      status: 'active',
      notes: 'Mid-day floor supervision & cashier relief',
    },
    {
      id: 'shift-active-4',
      employeeId: 'staff-105',
      employeeName: 'David Kim',
      employeeCode: 'EMP-9025',
      role: 'Head Chef',
      department: 'Kitchen & Culinary',
      hourlyRate: 185,
      date: todayDateStr,
      scheduledShift: '07:30 AM - 03:30 PM',
      clockInTime: new Date(Date.now() - 4.2 * 3600 * 1000).toISOString(),
      breakMinutes: 0,
      regularHours: 4.2,
      overtimeHours: 0,
      totalHours: 4.2,
      status: 'active',
      notes: 'Morning prep & hot line lead',
    },
    {
      id: 'shift-active-5',
      employeeId: 'staff-106',
      employeeName: 'Maria Santos',
      employeeCode: 'EMP-9026',
      role: 'Lead Barista',
      department: 'Bar & Beverage',
      hourlyRate: 130,
      date: todayDateStr,
      scheduledShift: '08:00 AM - 04:00 PM',
      clockInTime: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
      breakMinutes: 0,
      regularHours: 3.8,
      overtimeHours: 0,
      totalHours: 3.8,
      status: 'active',
      notes: 'Espresso bar & cold beverage station',
    },
    {
      id: 'shift-comp-1',
      employeeId: 'cash-102',
      employeeName: 'Alex Rivera',
      employeeCode: 'EMP-9022',
      role: 'Senior Cashier',
      department: 'Front of House',
      hourlyRate: 135,
      date: todayDateStr,
      scheduledShift: '12:00 AM - 08:00 AM',
      clockInTime: new Date(Date.now() - 17 * 3600 * 1000).toISOString(),
      clockOutTime: new Date(Date.now() - 8.5 * 3600 * 1000).toISOString(),
      breakMinutes: 30,
      regularHours: 8.0,
      overtimeHours: 0,
      totalHours: 8.0,
      status: 'completed',
      notes: 'Completed early shift, drawer balanced',
    },
    {
      id: 'shift-comp-2',
      employeeId: 'emp-103',
      employeeName: 'Marco Rossi',
      employeeCode: 'EMP-103',
      role: 'Sous Chef',
      department: 'Kitchen & Culinary',
      hourlyRate: 160,
      date: yesterdayDateStr,
      scheduledShift: '10:00 AM - 06:00 PM',
      clockInTime: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      clockOutTime: new Date(Date.now() - 27 * 3600 * 1000).toISOString(),
      breakMinutes: 30,
      regularHours: 8.0,
      overtimeHours: 0.5,
      totalHours: 8.5,
      status: 'completed',
      notes: 'Dinner rush inventory prep (+0.5h overtime)',
    },
    {
      id: 'shift-comp-3',
      employeeId: 'cash-101',
      employeeName: 'Sarah Jenkins',
      employeeCode: 'EMP-9021',
      role: 'Head Cashier',
      department: 'Front of House',
      hourlyRate: 145,
      date: yesterdayDateStr,
      scheduledShift: '08:00 AM - 04:00 PM',
      clockInTime: new Date(Date.now() - 38 * 3600 * 1000).toISOString(),
      clockOutTime: new Date(Date.now() - 29.5 * 3600 * 1000).toISOString(),
      breakMinutes: 30,
      regularHours: 8.0,
      overtimeHours: 0,
      totalHours: 8.0,
      status: 'completed',
      notes: 'Full morning shift completed on time',
    },
    {
      id: 'shift-comp-4',
      employeeId: 'staff-105',
      employeeName: 'David Kim',
      employeeCode: 'EMP-9025',
      role: 'Head Chef',
      department: 'Kitchen & Culinary',
      hourlyRate: 185,
      date: yesterdayDateStr,
      scheduledShift: '07:30 AM - 03:30 PM',
      clockInTime: new Date(Date.now() - 39 * 3600 * 1000).toISOString(),
      clockOutTime: new Date(Date.now() - 29 * 3600 * 1000).toISOString(),
      breakMinutes: 30,
      regularHours: 8.0,
      overtimeHours: 1.5,
      totalHours: 9.5,
      status: 'completed',
      notes: 'Catering prep & supplier delivery check (+1.5h OT)',
    },
    {
      id: 'shift-comp-5',
      employeeId: 'cash-104',
      employeeName: 'Elena Rostova',
      employeeCode: 'EMP-9024',
      role: 'Cashier & Supervisor',
      department: 'Management',
      hourlyRate: 165,
      date: twoDaysAgoDateStr,
      scheduledShift: '12:00 PM - 08:00 PM',
      clockInTime: new Date(Date.now() - 60 * 3600 * 1000).toISOString(),
      clockOutTime: new Date(Date.now() - 50.5 * 3600 * 1000).toISOString(),
      breakMinutes: 30,
      regularHours: 8.0,
      overtimeHours: 1.0,
      totalHours: 9.0,
      status: 'completed',
      notes: 'Closed registers and audited daily Z-reading',
    },
  ];

  const INITIAL_CLOCK_LOGS: ClockLog[] = [
    {
      id: 'log-1',
      employeeId: 'cash-104',
      employeeName: 'Elena Rostova',
      employeeCode: 'EMP-9024',
      role: 'Cashier & Supervisor',
      type: 'clock_in',
      timestamp: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
      notes: 'Mid-day supervisor shift started.',
    },
    {
      id: 'log-2',
      employeeId: 'cash-103',
      employeeName: 'Marcus Vance',
      employeeCode: 'EMP-9023',
      role: 'POS Specialist',
      type: 'break_start',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      notes: '15-min meal break.',
    },
    {
      id: 'log-3',
      employeeId: 'cash-101',
      employeeName: 'Sarah Jenkins',
      employeeCode: 'EMP-9021',
      role: 'Head Cashier',
      type: 'clock_in',
      timestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
      notes: 'Morning shift started on time. Register cash verified.',
    },
    {
      id: 'log-4',
      employeeId: 'staff-106',
      employeeName: 'Maria Santos',
      employeeCode: 'EMP-9026',
      role: 'Lead Barista',
      type: 'clock_in',
      timestamp: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
      notes: 'Bar station calibrated.',
    },
    {
      id: 'log-5',
      employeeId: 'cash-103',
      employeeName: 'Marcus Vance',
      employeeCode: 'EMP-9023',
      role: 'POS Specialist',
      type: 'clock_in',
      timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      notes: 'Covering register 2.',
    },
    {
      id: 'log-6',
      employeeId: 'staff-105',
      employeeName: 'David Kim',
      employeeCode: 'EMP-9025',
      role: 'Head Chef',
      type: 'clock_in',
      timestamp: new Date(Date.now() - 4.2 * 3600 * 1000).toISOString(),
      notes: 'Kitchen prep started.',
    },
    {
      id: 'log-7',
      employeeId: 'cash-102',
      employeeName: 'Alex Rivera',
      employeeCode: 'EMP-9022',
      role: 'Senior Cashier',
      type: 'clock_out',
      timestamp: new Date(Date.now() - 8.5 * 3600 * 1000).toISOString(),
      shiftDurationHours: 8.0,
      notes: 'Completed shift (8.0 hrs). Cash drawer balanced.',
    },
  ];

  const [employeeSchedules, setEmployeeSchedules] = useState<EmployeeSchedule[]>(() => {
    const saved = localStorage.getItem('qr_app_employee_schedules_v2');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  const [clockLogs, setClockLogs] = useState<ClockLog[]>(() => {
    const saved = localStorage.getItem('qr_app_clock_logs_v2');
    return saved ? JSON.parse(saved) : INITIAL_CLOCK_LOGS;
  });

  const [shiftSessions, setShiftSessions] = useState<ShiftSession[]>(() => {
    const saved = localStorage.getItem('qr_app_shift_sessions_v2');
    return saved ? JSON.parse(saved) : INITIAL_SHIFT_SESSIONS;
  });

  useEffect(() => {
    localStorage.setItem('qr_app_employee_schedules_v2', JSON.stringify(employeeSchedules));
  }, [employeeSchedules]);

  const [customerLanguage, setCustomerLanguage] = useState<CustomerLanguage>(() => {
    const saved = localStorage.getItem('qr_app_customer_lang_v1') as CustomerLanguage | null;
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('qr_app_customer_lang_v1', customerLanguage);
  }, [customerLanguage]);

  const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
    businessName: 'DineFlow QR Bistro',
    address: '128 Gourmet Avenue, Bonifacio Global City, Taguig',
    contactNumber: '+63 917 555 0199',
    timeOpen: '08:00',
    timeClosed: '22:00',
    gcashNumber: '0917 888 9912',
    gcashQrCode: '',
    paymayaNumber: '0918 777 6654',
    paymayaQrCode: '',
  };

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => {
    try {
      const saved = localStorage.getItem('qr_app_business_settings_v1');
      if (saved) {
        return { ...DEFAULT_BUSINESS_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse business settings:', e);
    }
    return DEFAULT_BUSINESS_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('qr_app_business_settings_v1', JSON.stringify(businessSettings));
    } catch (e) {
      console.warn('Failed to save business settings:', e);
    }
  }, [businessSettings]);

  const updateBusinessSettings = (updates: Partial<BusinessSettings>) => {
    setBusinessSettings(prev => ({ ...prev, ...updates }));
    showToast('✓ Business & Payment Settings updated!');
  };

  const resetBusinessSettings = () => {
    setBusinessSettings(DEFAULT_BUSINESS_SETTINGS);
    showToast('↺ Business & Payment Settings reset to default');
  };

  useEffect(() => {
    localStorage.setItem('qr_app_clock_logs_v2', JSON.stringify(clockLogs));
  }, [clockLogs]);

  useEffect(() => {
    localStorage.setItem('qr_app_shift_sessions_v2', JSON.stringify(shiftSessions));
  }, [shiftSessions]);

  const performClockAction = (
    employeeId: string,
    action: 'clock_in' | 'break_start' | 'break_end' | 'clock_out',
    notes?: string
  ) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const todayStr = nowIso.slice(0, 10);

    const targetSchedule = employeeSchedules.find(s => s.employeeId === employeeId);
    if (!targetSchedule) return;

    let shiftWorkedHours = 0;
    let updatedBreakMins = targetSchedule.accumulatedBreakMinutesToday || 0;

    if (action === 'break_end' && targetSchedule.breakStartTime) {
      const breakDiffMins = Math.max(
        1,
        Math.round((now.getTime() - new Date(targetSchedule.breakStartTime).getTime()) / (1000 * 60))
      );
      updatedBreakMins += breakDiffMins;
    }

    if (action === 'clock_out' && targetSchedule.lastClockIn) {
      if (targetSchedule.status === 'on_break' && targetSchedule.breakStartTime) {
        const breakDiffMins = Math.max(
          1,
          Math.round((now.getTime() - new Date(targetSchedule.breakStartTime).getTime()) / (1000 * 60))
        );
        updatedBreakMins += breakDiffMins;
      }
      const rawDiffHours = (now.getTime() - new Date(targetSchedule.lastClockIn).getTime()) / (1000 * 3600);
      const netHours = Math.max(0.1, rawDiffHours - updatedBreakMins / 60);
      shiftWorkedHours = Math.round(netHours * 100) / 100;
    }

    setEmployeeSchedules(prev =>
      prev.map(emp => {
        if (emp.employeeId !== employeeId) return emp;

        if (action === 'clock_in') {
          return {
            ...emp,
            status: 'clocked_in',
            lastClockIn: nowIso,
            breakStartTime: undefined,
            accumulatedBreakMinutesToday: 0,
          };
        }
        if (action === 'break_start') {
          return {
            ...emp,
            status: 'on_break',
            breakStartTime: nowIso,
          };
        }
        if (action === 'break_end') {
          return {
            ...emp,
            status: 'clocked_in',
            breakStartTime: undefined,
            accumulatedBreakMinutesToday: updatedBreakMins,
          };
        }
        if (action === 'clock_out') {
          const newTotalToday = Math.round((emp.totalHoursWorkedToday + shiftWorkedHours) * 100) / 100;
          const newWeekly = Math.round(((emp.weeklyHoursWorked || emp.totalHoursWorkedToday) + shiftWorkedHours) * 100) / 100;
          return {
            ...emp,
            status: 'clocked_out',
            lastClockOut: nowIso,
            breakStartTime: undefined,
            accumulatedBreakMinutesToday: updatedBreakMins,
            totalHoursWorkedToday: newTotalToday,
            weeklyHoursWorked: newWeekly,
          };
        }
        return emp;
      })
    );

    // Update or create ShiftSession record for Admin Labor Hours Report
    if (action === 'clock_in') {
      const newSession: ShiftSession = {
        id: `shift-${Date.now()}`,
        employeeId: targetSchedule.employeeId,
        employeeName: targetSchedule.employeeName,
        employeeCode: targetSchedule.employeeCode,
        role: targetSchedule.role,
        department: targetSchedule.department || 'Front of House',
        hourlyRate: targetSchedule.hourlyRate || 135,
        date: todayStr,
        scheduledShift: targetSchedule.scheduledShift,
        clockInTime: nowIso,
        breakMinutes: 0,
        regularHours: 0,
        overtimeHours: 0,
        totalHours: 0,
        status: 'active',
        notes: notes?.trim() || 'Clocked in at Cashier Terminal',
      };
      setShiftSessions(prev => [newSession, ...prev]);
    } else {
      setShiftSessions(prev => {
        const activeIdx = prev.findIndex(
          s => s.employeeId === employeeId && (s.status === 'active' || s.status === 'on_break')
        );
        if (activeIdx === -1) {
          if (action === 'clock_out') {
            const regHrs = Math.min(8, shiftWorkedHours);
            const otHrs = Math.max(0, Math.round((shiftWorkedHours - 8) * 100) / 100);
            const fallbackSession: ShiftSession = {
              id: `shift-${Date.now()}`,
              employeeId: targetSchedule.employeeId,
              employeeName: targetSchedule.employeeName,
              employeeCode: targetSchedule.employeeCode,
              role: targetSchedule.role,
              department: targetSchedule.department || 'Front of House',
              hourlyRate: targetSchedule.hourlyRate || 135,
              date: todayStr,
              scheduledShift: targetSchedule.scheduledShift,
              clockInTime: targetSchedule.lastClockIn || new Date(now.getTime() - 3600 * 1000).toISOString(),
              clockOutTime: nowIso,
              breakMinutes: updatedBreakMins,
              regularHours: regHrs,
              overtimeHours: otHrs,
              totalHours: shiftWorkedHours,
              status: 'completed',
              notes: notes?.trim() || 'Clocked out at Cashier Terminal',
            };
            return [fallbackSession, ...prev];
          }
          return prev;
        }

        return prev.map((sess, idx) => {
          if (idx !== activeIdx) return sess;
          if (action === 'break_start') {
            return {
              ...sess,
              status: 'on_break',
              notes: notes?.trim() ? `${sess.notes ? sess.notes + ' • ' : ''}${notes.trim()}` : sess.notes,
            };
          }
          if (action === 'break_end') {
            return {
              ...sess,
              status: 'active',
              breakMinutes: updatedBreakMins,
            };
          }
          if (action === 'clock_out') {
            const regHrs = Math.min(8, shiftWorkedHours);
            const otHrs = Math.max(0, Math.round((shiftWorkedHours - 8) * 100) / 100);
            return {
              ...sess,
              clockOutTime: nowIso,
              breakMinutes: updatedBreakMins,
              regularHours: regHrs,
              overtimeHours: otHrs,
              totalHours: shiftWorkedHours,
              status: 'completed',
              notes: notes?.trim() || sess.notes || 'Shift completed',
            };
          }
          return sess;
        });
      });
    }

    const actionLabels: Record<string, string> = {
      clock_in: 'Clocked In to Shift',
      break_start: 'Started Meal Break',
      break_end: 'Ended Break & Resumed Shift',
      clock_out: `Clocked Out (${shiftWorkedHours.toFixed(2)} hrs worked)`,
    };

    const newLog: ClockLog = {
      id: `log-${Date.now()}`,
      employeeId: targetSchedule.employeeId,
      employeeName: targetSchedule.employeeName,
      employeeCode: targetSchedule.employeeCode,
      role: targetSchedule.role,
      type: action,
      timestamp: nowIso,
      shiftDurationHours: action === 'clock_out' ? shiftWorkedHours : undefined,
      notes: notes?.trim() || actionLabels[action],
    };

    setClockLogs(prev => [newLog, ...prev]);

    if (soundEnabled) playChime('success');
    showToast(`✓ ${targetSchedule.employeeName}: ${actionLabels[action]}`);
  };

  const addManualShiftSession = (sessionData: Omit<ShiftSession, 'id'>) => {
    const newSession: ShiftSession = {
      ...sessionData,
      id: `shift-manual-${Date.now()}`,
    };
    setShiftSessions(prev => [newSession, ...prev]);
    setEmployeeSchedules(prev =>
      prev.map(emp =>
        emp.employeeId === sessionData.employeeId
          ? {
              ...emp,
              totalHoursWorkedToday:
                sessionData.date === new Date().toISOString().slice(0, 10)
                  ? Math.round((emp.totalHoursWorkedToday + sessionData.totalHours) * 100) / 100
                  : emp.totalHoursWorkedToday,
              weeklyHoursWorked: Math.round(((emp.weeklyHoursWorked || 0) + sessionData.totalHours) * 100) / 100,
            }
          : emp
      )
    );
    showToast(`✓ Logged ${sessionData.totalHours.toFixed(2)} hrs for ${sessionData.employeeName}`);
  };

  const updateShiftSession = (updatedSession: ShiftSession) => {
    setShiftSessions(prev => prev.map(s => (s.id === updatedSession.id ? updatedSession : s)));
    showToast(`✓ Updated shift record for ${updatedSession.employeeName}`);
  };

  const deleteShiftSession = (id: string) => {
    setShiftSessions(prev => prev.filter(s => s.id !== id));
    showToast('Shift entry removed from labor report');
  };

  const updateEmployeeHourlyRate = (employeeId: string, newRate: number) => {
    setEmployeeSchedules(prev =>
      prev.map(s => (s.employeeId === employeeId ? { ...s, hourlyRate: newRate } : s))
    );
    setShiftSessions(prev =>
      prev.map(s => (s.employeeId === employeeId ? { ...s, hourlyRate: newRate } : s))
    );
    showToast(`✓ Updated hourly rate to ₱${newRate.toFixed(2)}/hr`);
  };

  const addEmployee = (newEmpData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...newEmpData,
      id: `emp-${Date.now()}`,
    };
    setEmployees(prev => [newEmp, ...prev]);

    if (newEmp.role !== 'customer') {
      const fullName = `${newEmp.firstName} ${newEmp.lastName}`.trim();
      const dept =
        newEmp.role === 'kitchen'
          ? 'Kitchen & Culinary'
          : newEmp.role === 'admin'
          ? 'Management'
          : 'Front of House';
      const newSched: EmployeeSchedule = {
        employeeId: newEmp.id,
        employeeName: fullName,
        role: newEmp.role === 'admin' ? 'Store Manager' : newEmp.role === 'kitchen' ? 'Kitchen Staff' : 'Cashier POS',
        department: dept,
        employeeCode: newEmp.employeeCode,
        avatarUrl: newEmp.photo,
        scheduledShift: newEmp.scheduledShift || '08:00 AM - 04:00 PM',
        scheduledHours: 8.0,
        hourlyRate: newEmp.hourlyRate || 135,
        status: 'clocked_out',
        accumulatedBreakMinutesToday: 0,
        totalHoursWorkedToday: 0,
        weeklyHoursWorked: 0,
        pinCode: newEmp.pinCode || '1234',
      };
      setEmployeeSchedules(prev => [newSched, ...prev]);
    }

    showToast(`✓ Added employee ${newEmp.firstName} ${newEmp.lastName} (${newEmp.role.toUpperCase()})`);
  };

  const updateEmployee = (updatedEmp: Employee) => {
    setEmployees(prev => prev.map(e => (e.id === updatedEmp.id ? updatedEmp : e)));
    if (currentEmployee && currentEmployee.id === updatedEmp.id) {
      setCurrentEmployee(updatedEmp);
    }
    setEmployeeSchedules(prev =>
      prev.map(s =>
        s.employeeId === updatedEmp.id || s.employeeCode === updatedEmp.employeeCode
          ? {
              ...s,
              employeeName: `${updatedEmp.firstName} ${updatedEmp.lastName}`.trim(),
              employeeCode: updatedEmp.employeeCode,
              avatarUrl: updatedEmp.photo,
            }
          : s
      )
    );
    showToast(`✓ Updated employee record for ${updatedEmp.firstName} ${updatedEmp.lastName}`);
  };

  const deleteEmployee = (id: string) => {
    const target = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    setEmployeeSchedules(prev => prev.filter(s => s.employeeId !== id));
    if (currentEmployee && currentEmployee.id === id) {
      setCurrentEmployee(null);
    }
    if (target) {
      showToast(`Removed employee ${target.firstName} ${target.lastName}`);
    }
  };

  const loginEmployee = (emailOrCode: string, pass: string): boolean => {
    const trimmedInput = emailOrCode.trim().toLowerCase();
    const found = employees.find(
      e =>
        (e.email.toLowerCase() === trimmedInput || e.employeeCode.toLowerCase() === trimmedInput) &&
        e.password === pass
    );

    if (found) {
      if (found.status === 'Inactive') {
        showToast('⚠️ Account is inactive. Please contact store administrator.');
        return false;
      }
      setCurrentEmployee(found);
      if (found.role === 'customer') {
        setIsTableSelected(true);
      }
      setViewMode(found.role);
      showToast(`Welcome back, ${found.firstName} ${found.lastName}! Redirected to ${found.role.toUpperCase()} Dashboard.`);
      if (soundEnabled) playChime('success');
      return true;
    } else {
      showToast('❌ Invalid credentials. Please check your Email / Employee Code and Password.');
      return false;
    }
  };

  const logoutEmployee = () => {
    if (currentEmployee) {
      showToast(`Signed out ${currentEmployee.firstName} ${currentEmployee.lastName}`);
    } else {
      showToast('Signed out and returned to landing page');
    }
    setCurrentEmployee(null);
    setIsTableSelected(false);
    setViewMode('customer');
  };

  // Automated Low Stock Alert Configuration State
  const INITIAL_LOW_STOCK_CONFIG: LowStockAlertConfig = {
    enabled: true,
    dashboardNotifications: true,
    emailNotifications: true,
    recipientEmails: ['mcpatenz45@gmail.com', 'inventory@restaurant.com', 'chef@restaurant.com'],
    notifyOnLowStock: true,
    notifyOnOutOfStock: true,
    notifyOnRestock: true,
    globalDefaultThreshold: 5,
    autoReorderSuggestion: 25,
  };

  const [lowStockAlertConfig, setLowStockAlertConfig] = useState<LowStockAlertConfig>(() => {
    const saved = localStorage.getItem('qr_app_low_stock_alert_config_v1');
    return saved ? JSON.parse(saved) : INITIAL_LOW_STOCK_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('qr_app_low_stock_alert_config_v1', JSON.stringify(lowStockAlertConfig));
  }, [lowStockAlertConfig]);

  const updateLowStockAlertConfig = (updates: Partial<LowStockAlertConfig>) => {
    setLowStockAlertConfig(prev => ({ ...prev, ...updates }));
    showToast('✓ Updated Low Stock Alert automation settings');
  };

  // Admin Inventory Alerts State
  const [adminAlerts, setAdminAlerts] = useState<InventoryAlert[]>(() => {
    const saved = localStorage.getItem('qr_app_inventory_alerts_v2');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'alt-init-1',
        productId: 'prod-3',
        productName: 'Truffle Cream Penne Pasta',
        categoryName: 'Signature Mains',
        previousStock: 2,
        currentStock: 0,
        threshold: 5,
        status: 'out_of_stock',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        message: 'CRITICAL: "Truffle Cream Penne Pasta" fell to 0 units (Threshold: 5). Automated email & dashboard alert dispatched.',
        channelsNotified: ['dashboard', 'email'],
        recipientEmails: ['mcpatenz45@gmail.com', 'inventory@restaurant.com'],
        emailSubject: '[CRITICAL OUT OF STOCK] Truffle Cream Penne Pasta (0 units remaining)',
        emailBodyPreview:
          'Automated Inventory Alert:\n\nMenu Item: Truffle Cream Penne Pasta\nStatus: OUT OF STOCK (0 units remaining)\nDefined Threshold: 5 units\nPrevious Stock: 2 units\nRecommended Action: Restock +25 units immediately or mark unavailable on POS.',
        acknowledged: false,
        triggerSource: 'order_placed',
      },
      {
        id: 'alt-init-2',
        productId: 'prod-2',
        productName: 'Classic Angus Beef Cheeseburger',
        categoryName: 'Signature Mains',
        previousStock: 7,
        currentStock: 4,
        threshold: 5,
        status: 'low_stock',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        message: 'LOW STOCK: "Classic Angus Beef Cheeseburger" dropped to 4 units (Defined threshold: 5 units).',
        channelsNotified: ['dashboard', 'email'],
        recipientEmails: ['mcpatenz45@gmail.com', 'inventory@restaurant.com'],
        emailSubject: '[LOW STOCK WARNING] Classic Angus Beef Cheeseburger (4 units left <= threshold 5)',
        emailBodyPreview:
          'Automated Inventory Alert:\n\nMenu Item: Classic Angus Beef Cheeseburger\nStatus: LOW STOCK WARNING\nCurrent Stock: 4 units\nDefined Threshold: 5 units\nPrevious Stock: 7 units\nRecommended Action: Schedule kitchen prep or supplier reorder (+25 units).',
        acknowledged: false,
        triggerSource: 'order_placed',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('qr_app_inventory_alerts_v2', JSON.stringify(adminAlerts));
  }, [adminAlerts]);

  const [activeAdminAlert, setActiveAdminAlert] = useState<InventoryAlert | null>(null);

  const dismissActiveAdminAlert = () => {
    setActiveAdminAlert(null);
  };

  const acknowledgeInventoryAlert = (alertId: string) => {
    setAdminAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    if (activeAdminAlert?.id === alertId) {
      setActiveAdminAlert(null);
    }
  };

  const clearAcknowledgedAlerts = () => {
    setAdminAlerts(prev => prev.filter(a => !a.acknowledged));
    showToast('Cleared acknowledged alerts from history');
  };

  const triggerInventoryAlert = (
    alert: Omit<InventoryAlert, 'id' | 'timestamp'>,
    forceDispatch: boolean = false
  ) => {
    if (!forceDispatch && !lowStockAlertConfig.enabled) return;

    const channels: ('dashboard' | 'email')[] = [];
    if (lowStockAlertConfig.dashboardNotifications || forceDispatch) channels.push('dashboard');
    if (
      (lowStockAlertConfig.emailNotifications || forceDispatch) &&
      lowStockAlertConfig.recipientEmails.length > 0
    ) {
      channels.push('email');
    }

    const thresholdVal = alert.threshold ?? lowStockAlertConfig.globalDefaultThreshold;
    const statusLabel =
      alert.status === 'out_of_stock'
        ? 'CRITICAL OUT OF STOCK'
        : alert.status === 'low_stock'
        ? 'LOW STOCK THRESHOLD WARNING'
        : 'STOCK REPLENISHED';

    const emailSubject =
      alert.emailSubject ||
      `[${statusLabel}] ${alert.productName} (${alert.currentStock} units remaining · Threshold: ${thresholdVal})`;

    const emailBodyPreview =
      alert.emailBodyPreview ||
      `Automated Inventory Notification — Store Admin Panel\n` +
        `----------------------------------------------------\n` +
        `Menu Item: ${alert.productName}\n` +
        `Alert Status: ${statusLabel}\n` +
        `Current Stock: ${alert.currentStock} units\n` +
        `Defined Threshold: ${thresholdVal} units\n` +
        `Previous Stock: ${alert.previousStock} units\n` +
        `Triggered At: ${new Date().toLocaleString()}\n` +
        `Recommended Reorder: +${lowStockAlertConfig.autoReorderSuggestion} units\n\n` +
        `Summary: ${alert.message}`;

    const newAlert: InventoryAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      threshold: thresholdVal,
      channelsNotified: alert.channelsNotified || channels,
      recipientEmails: alert.recipientEmails || [...lowStockAlertConfig.recipientEmails],
      emailSubject,
      emailBodyPreview,
      acknowledged: false,
    };

    setAdminAlerts(prev => [newAlert, ...prev]);

    if (lowStockAlertConfig.dashboardNotifications || forceDispatch) {
      setActiveAdminAlert(newAlert);
    }

    if (soundEnabled) {
      if (alert.status === 'out_of_stock' || alert.status === 'low_stock') {
        playChime('alert');
      } else {
        playChime('success');
      }
    }
  };

  const sendLowStockEmailAlert = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const currentStock = prod.stockQuantity ?? (prod.inStock ? 10 : 0);
    const threshold = prod.lowStockThreshold ?? lowStockAlertConfig.globalDefaultThreshold;
    const status: StockStatus =
      !prod.inStock || currentStock <= 0
        ? 'out_of_stock'
        : currentStock <= threshold
        ? 'low_stock'
        : 'in_stock';

    const recipients =
      lowStockAlertConfig.recipientEmails.length > 0
        ? lowStockAlertConfig.recipientEmails
        : ['mcpatenz45@gmail.com'];

    triggerInventoryAlert(
      {
        productId: prod.id,
        productName: prod.name,
        previousStock: currentStock,
        currentStock,
        threshold,
        status,
        channelsNotified: ['dashboard', 'email'],
        recipientEmails: recipients,
        triggerSource: 'manual_test',
        message: `📧 Automated Low Stock Email & Dashboard Alert dispatched for "${prod.name}" (${currentStock} units left · Threshold: ${threshold}) to ${recipients.join(', ')}`,
      },
      true
    );

    showToast(`📧 Low stock email alert sent for "${prod.name}" to ${recipients[0]}`);
  };

  const runAutomatedStockScan = (): number => {
    let triggeredCount = 0;
    const recipients =
      lowStockAlertConfig.recipientEmails.length > 0
        ? lowStockAlertConfig.recipientEmails
        : ['mcpatenz45@gmail.com'];

    products.forEach(p => {
      if (p.alertEnabled === false) return;
      const qty = p.stockQuantity ?? (p.inStock ? 10 : 0);
      const threshold = p.lowStockThreshold ?? lowStockAlertConfig.globalDefaultThreshold;

      if (!p.inStock || qty <= 0) {
        triggeredCount++;
        triggerInventoryAlert(
          {
            productId: p.id,
            productName: p.name,
            previousStock: qty,
            currentStock: 0,
            threshold,
            status: 'out_of_stock',
            channelsNotified: ['dashboard', 'email'],
            recipientEmails: recipients,
            triggerSource: 'scheduled_scan',
            message: `🔴 Automated Scan: "${p.name}" is OUT OF STOCK (0/${threshold} units). Email dispatched to ${recipients[0]}.`,
          },
          true
        );
      } else if (qty <= threshold) {
        triggeredCount++;
        triggerInventoryAlert(
          {
            productId: p.id,
            productName: p.name,
            previousStock: qty,
            currentStock: qty,
            threshold,
            status: 'low_stock',
            channelsNotified: ['dashboard', 'email'],
            recipientEmails: recipients,
            triggerSource: 'scheduled_scan',
            message: `⚠️ Automated Scan: "${p.name}" is below threshold (${qty}/${threshold} units). Email dispatched to ${recipients[0]}.`,
          },
          true
        );
      }
    });

    if (triggeredCount === 0) {
      showToast('✓ Automated stock scan complete: All monitored items are above their threshold!');
    } else {
      showToast(
        `🔔 Automated scan triggered ${triggeredCount} low-stock alert(s) & emailed ${recipients[0]}!`
      );
    }
    return triggeredCount;
  };

  const toggleProductAlertEnabled = (productId: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const nextVal = p.alertEnabled === false ? true : false;
          showToast(
            `${nextVal ? '🔔 Enabled' : '🔕 Muted'} automated low-stock alerts for "${p.name}"`
          );
          return { ...p, alertEnabled: nextVal };
        }
        return p;
      })
    );
  };

  const triggerDemoInventoryAlert = (status: StockStatus) => {
    const recipients = lowStockAlertConfig.recipientEmails;
    if (status === 'out_of_stock') {
      triggerInventoryAlert(
        {
          productId: 'prod-2',
          productName: 'Classic Angus Beef Cheeseburger',
          previousStock: 2,
          currentStock: 0,
          threshold: 5,
          status: 'out_of_stock',
          triggerSource: 'manual_test',
          message: `🔴 CRITICAL: "Classic Angus Beef Cheeseburger" is OUT OF STOCK (0/5 units)! Email sent to ${recipients[0] || 'Admin'}.`,
        },
        true
      );
    } else if (status === 'low_stock') {
      triggerInventoryAlert(
        {
          productId: 'prod-1',
          productName: 'Grilled Flame Chicken Breast',
          previousStock: 12,
          currentStock: 4,
          threshold: 5,
          status: 'low_stock',
          triggerSource: 'manual_test',
          message: `⚠️ LOW STOCK: "Grilled Flame Chicken Breast" dropped below threshold (4/5 units)! Email sent to ${recipients[0] || 'Admin'}.`,
        },
        true
      );
    } else {
      triggerInventoryAlert(
        {
          productId: 'prod-3',
          productName: 'Truffle Cream Penne Pasta',
          previousStock: 0,
          currentStock: 25,
          threshold: 5,
          status: 'in_stock',
          triggerSource: 'manual_test',
          message: '🟢 RESTOCKED: "Truffle Cream Penne Pasta" replenished to 25 units (Threshold: 5)!',
        },
        true
      );
    }
  };

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('qr_app_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const INITIAL_CASHIERS: CashierInfo[] = [
    {
      id: 'cash-101',
      name: 'Sarah Jenkins',
      role: 'Head Cashier',
      shift: 'Morning Shift (08:00 - 16:00)',
      employeeCode: 'EMP-9021',
      loginTime: '08:00 AM',
    },
    {
      id: 'cash-102',
      name: 'Alex Rivera',
      role: 'Senior Cashier',
      shift: 'Evening Shift (16:00 - 24:00)',
      employeeCode: 'EMP-9022',
      loginTime: '04:00 PM',
    },
    {
      id: 'cash-103',
      name: 'Marcus Vance',
      role: 'POS Specialist',
      shift: 'Morning Shift (08:00 - 16:00)',
      employeeCode: 'EMP-9023',
      loginTime: '08:15 AM',
    },
    {
      id: 'cash-104',
      name: 'Elena Rostova',
      role: 'Cashier & Supervisor',
      shift: 'Night Shift (00:00 - 08:00)',
      employeeCode: 'EMP-9024',
      loginTime: '12:00 AM',
    },
  ];

  const [availableCashiers] = useState<CashierInfo[]>(INITIAL_CASHIERS);
  const [activeCashier, setActiveCashier] = useState<CashierInfo>(INITIAL_CASHIERS[0]);

  // Loyalty Points State
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(() => {
    const saved = localStorage.getItem('qr_app_loyalty_points');
    return saved ? parseInt(saved, 10) : 320;
  });

  const [loyaltyHistory, setLoyaltyHistory] = useState<LoyaltyTransaction[]>(() => {
    const saved = localStorage.getItem('qr_app_loyalty_history');
    return saved ? JSON.parse(saved) : [
      {
        id: 'tx-1',
        date: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        title: 'Earned from Order #ORD-108',
        points: 220,
        type: 'earned',
      },
      {
        id: 'tx-2',
        date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        title: 'Welcome Loyalty Bonus',
        points: 100,
        type: 'earned',
      },
    ];
  });

  const [redeemedLoyaltyDiscount, setRedeemedLoyaltyDiscount] = useState<number>(0);
  const [redeemedLoyaltyPoints, setRedeemedLoyaltyPoints] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('qr_app_loyalty_points', loyaltyPoints.toString());
  }, [loyaltyPoints]);

  useEffect(() => {
    localStorage.setItem('qr_app_loyalty_history', JSON.stringify(loyaltyHistory));
  }, [loyaltyHistory]);

  const applyLoyaltyDiscount = (points: number, discountInDollars: number): boolean => {
    if (loyaltyPoints < points) {
      showToast(`Insufficient points! You have ${loyaltyPoints} PTS.`);
      return false;
    }
    setRedeemedLoyaltyPoints(points);
    setRedeemedLoyaltyDiscount(discountInDollars);
    showToast(`🎉 Redeemed ${points} PTS for ₱${discountInDollars.toFixed(2)} discount!`);
    if (soundEnabled) playChime('success');
    return true;
  };

  const cancelLoyaltyDiscount = () => {
    setRedeemedLoyaltyPoints(0);
    setRedeemedLoyaltyDiscount(0);
    showToast('Removed loyalty reward discount.');
  };

  const claimBonusLoyaltyPoints = (amount: number, reason: string) => {
    setLoyaltyPoints(prev => prev + amount);
    const newTx: LoyaltyTransaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      title: reason,
      points: amount,
      type: 'earned',
    };
    setLoyaltyHistory(prev => [newTx, ...prev]);
    showToast(`🎁 Claimed +${amount} Bonus Loyalty Points!`);
    if (soundEnabled) playChime('success');
  };

  const switchCashierById = (id: string) => {
    const found = availableCashiers.find(c => c.id === id);
    if (found) {
      setActiveCashier({
        ...found,
        loginTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      showToast(`Logged in as Cashier: ${found.name}`);
    }
  };

  const [waiterRequests, setWaiterRequests] = useState<WaiterRequest[]>([]);

  // Customer Feedback State
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(() => {
    const saved = localStorage.getItem('qr_app_feedbacks_v1');
    return saved ? JSON.parse(saved) : [];
  });
  const [pendingFeedbackOrder, setPendingFeedbackOrder] = useState<Order | null>(null);

  useEffect(() => {
    localStorage.setItem('qr_app_feedbacks_v1', JSON.stringify(feedbacks));
  }, [feedbacks]);

  const submitCustomerFeedback = (
    orderId: string,
    rating: number,
    comment?: string,
    tags?: string[]
  ) => {
    const targetOrder = orders.find(o => o.id === orderId);
    const newFeedback: CustomerFeedback = {
      id: `fb-${Date.now()}`,
      orderId,
      tableNumber: targetOrder?.tableNumber || activeTable.tableNumber,
      customerName: targetOrder?.customerName || `Table ${activeTable.tableNumber} Guest`,
      rating,
      tags: tags && tags.length > 0 ? tags : undefined,
      comment: comment?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    setFeedbacks(prev => [newFeedback, ...prev.filter(f => f.orderId !== orderId)]);
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, feedback: newFeedback } : o))
    );
    setPendingFeedbackOrder(null);

    // Reward customer with +15 bonus loyalty points for leaving dining feedback
    setLoyaltyPoints(prev => prev + 15);
    setLoyaltyHistory(prev => [
      {
        id: `tx-fb-${Date.now()}`,
        date: new Date().toISOString(),
        title: `Dining Feedback Bonus (${orderId})`,
        points: 15,
        type: 'earned',
      },
      ...prev,
    ]);

    if (soundEnabled) playChime('success');
    showToast(`Thank you for your ${rating}-star feedback! You earned +15 Bonus Points!`);
  };

  // Persist state
  useEffect(() => {
    localStorage.setItem('qr_app_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('qr_app_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('qr_app_tables_v3', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('qr_app_orders_v3', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('qr_app_cart', JSON.stringify(cart));
  }, [cart]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // Select table helper — scanning a table QR opens or re-opens the Customer Dashboard for that table
  const selectTableByNumber = (num: string): boolean => {
    const clean = num.trim().replace(/^0+/, '') || num.trim();
    const found = tables.find(
      t =>
        t.tableNumber === num.trim() ||
        t.tableNumber === clean ||
        t.tableNumber.padStart(2, '0') === num.trim() ||
        t.id === num.trim() ||
        t.id === `table-${clean}`
    );
    if (found) {
      if (found.status === 'cleaning') {
        showToast(
          `🧹 Table #${found.tableNumber} is currently being sanitized. Please wait a moment or ask staff.`
        );
        if (soundEnabled) playChime('alert');
        return false;
      }

      setActiveTable(found);
      setIsTableSelected(true);
      setViewMode('customer');
      showToast(`Checked in to Table #${found.tableNumber} (${found.section || 'Main Hall'})`);
      return true;
    } else {
      showToast(`Table #${num} not found.`);
      return false;
    }
  };

  // Exit current table session: serves as Log Out and redirects customer to the Landing Page.
  // Customer can scan the table QR code again on the Landing Page to re-open the dashboard.
  const exitTableSession = () => {
    const exitedTableNumber = activeTable.tableNumber;
    const signedInName = currentEmployee
      ? `${currentEmployee.firstName} ${currentEmployee.lastName}`
      : null;

    clearCart();
    setCurrentEmployee(null);
    setIsTableSelected(false);
    setViewMode('customer');

    try {
      if (window.location.search.includes('table')) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {
      // Ignore history error
    }

    if (signedInName) {
      showToast(
        `Logged out ${signedInName} & exited Table #${exitedTableNumber}. Scan your table QR code to re-open the dashboard.`
      );
    } else {
      showToast(
        `Logged out of Table #${exitedTableNumber}. Scan your table QR code to re-open the dashboard.`
      );
    }
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((acc, item) => acc + item.itemTotal, 0);
  const codeDiscount = (cartSubtotal * discountPercent) / 100;
  const discountAmount = codeDiscount + redeemedLoyaltyDiscount;
  const taxableAmount = Math.max(0, cartSubtotal - discountAmount);
  const cartTax = taxableAmount * 0.10; // 10% tax
  const cartTotal = taxableAmount + cartTax;

  const applyDiscountCode = (code: string): boolean => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed === 'WELCOME10' || trimmed === 'DISCOUNT10') {
      setAppliedDiscountCode(trimmed);
      setDiscountPercent(10);
      showToast('🎉 Promo code applied! 10% off');
      if (soundEnabled) playChime('success');
      return true;
    } else if (trimmed === 'VIP15' || trimmed === 'HAPPYHOUR') {
      setAppliedDiscountCode(trimmed);
      setDiscountPercent(15);
      showToast(`🎉 Promo code ${trimmed} applied! 15% off`);
      if (soundEnabled) playChime('success');
      return true;
    } else if (trimmed === 'HALF20') {
      setAppliedDiscountCode(trimmed);
      setDiscountPercent(20);
      showToast('🎉 Promo code applied! 20% off');
      if (soundEnabled) playChime('success');
      return true;
    } else {
      showToast('Invalid promo code. Try WELCOME10, VIP15, or HALF20');
      if (soundEnabled) playChime('alert');
      return false;
    }
  };

  // Parse URL query parameters generated by Admin Table QR Generator on startup
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table') || params.get('tableNumber') || params.get('tableId');
      const promoParam = params.get('promo') || params.get('discount');

      if (tableParam) {
        const clean = tableParam.trim().replace(/^0+/, '') || tableParam.trim();
        const found = tables.find(
          t =>
            t.tableNumber === tableParam.trim() ||
            t.tableNumber === clean ||
            t.tableNumber.padStart(2, '0') === tableParam.trim() ||
            t.id === tableParam.trim() ||
            t.id === `table-${clean}`
        );
        if (found) {
          setActiveTable(found);
          setIsTableSelected(true);
          setViewMode('customer');
        }
      }

      if (promoParam) {
        const upperPromo = promoParam.trim().toUpperCase();
        if (upperPromo === 'WELCOME10' || upperPromo === 'DISCOUNT10') {
          setAppliedDiscountCode(upperPromo);
          setDiscountPercent(10);
        } else if (upperPromo === 'VIP15' || upperPromo === 'HAPPYHOUR') {
          setAppliedDiscountCode(upperPromo);
          setDiscountPercent(15);
        } else if (upperPromo === 'HALF20') {
          setAppliedDiscountCode(upperPromo);
          setDiscountPercent(20);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  const addToCart = (itemData: Omit<CartItem, 'id' | 'itemTotal'>) => {
    const modifierSum = itemData.selectedModifiers.reduce((sum, m) => sum + m.price, 0);
    const unitPrice = itemData.product.price + modifierSum;
    const itemTotal = unitPrice * itemData.quantity;

    const newItem: CartItem = {
      ...itemData,
      id: 'cart-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      itemTotal,
    };

    setCart(prev => [...prev, newItem]);
    showToast(`Added ${itemData.quantity}x ${itemData.product.name} to cart`);
    if (soundEnabled) playChime('click');
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(i => i.id !== cartItemId));
    if (soundEnabled) playChime('click');
  };

  const updateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCart(prev =>
      prev.map(item => {
        if (item.id === cartItemId) {
          const modifierSum = item.selectedModifiers.reduce((sum, m) => sum + m.price, 0);
          const unitPrice = item.product.price + modifierSum;
          return {
            ...item,
            quantity: newQty,
            itemTotal: unitPrice * newQty,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedDiscountCode('');
    setDiscountPercent(0);
  };

  // Place order
  // Requires a scanned table: without one, activeTable is only a placeholder and the
  // order would be mis-attributed to the default table. Returns null when blocked.
  const placeOrder = (
    customerName: string,
    customerPhone: string,
    diningOption: 'dine_in' | 'takeout',
    paymentMethod: Order['paymentMethod'],
    notes?: string,
    scheduledFor?: string
  ): Order | null => {
    if (!isTableSelected && !currentEmployee) {
      showToast('⚠️ Please scan your table QR code before placing an order.');
      return null;
    }

    if (cart.length === 0) {
      showToast('⚠️ Your cart is empty.');
      return null;
    }

    const newOrderNumber = `ORD-${Math.floor(100 + Math.random() * 900)}`;

    const orderItems = cart.map(item => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      modifiers: item.selectedModifiers,
      notes: item.notes,
      itemTotal: item.itemTotal,
    }));

    const isPaid =
      paymentMethod === 'gcash' ||
      paymentMethod === 'paymaya' ||
      paymentMethod === 'cash_on_hand' ||
      paymentMethod === 'cash' ||
      paymentMethod === 'card' ||
      paymentMethod === 'qr_wallet' ||
      paymentMethod === 'virtual_wallet';

    const newOrder: Order = {
      id: newOrderNumber,
      tableId: activeTable.id,
      tableNumber: activeTable.tableNumber,
      branchName: businessSettings.businessName || 'Central Branch',
      customerName: customerName || `Table ${activeTable.tableNumber} Guest`,
      customerPhone,
      cashierName: activeCashier.name,
      diningOption,
      items: orderItems,
      subtotal: cartSubtotal,
      tax: cartTax,
      discount: discountAmount,
      total: cartTotal,
      status: 'pending',
      paymentMethod,
      paymentStatus: isPaid ? 'paid' : 'unpaid',
      notes,
      isScheduled: Boolean(scheduledFor),
      scheduledFor: scheduledFor || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedReadyTime: scheduledFor || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update table status to occupied (disabled so other customers cannot use it)
    const occupiedTable: Table = {
      ...activeTable,
      status: 'occupied',
      currentOrderId: newOrder.id,
    };
    setActiveTable(occupiedTable);
    setTables(prev =>
      prev.map(t =>
        t.id === activeTable.id
          ? occupiedTable
          : t
      )
    );

    // Deduct stock for each ordered product and trigger admin alerts if low/zero stock
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const orderedItem = cart.find(ci => ci.product.id === p.id);
        if (orderedItem) {
          const currentQty = p.stockQuantity ?? (p.inStock ? 10 : 0);
          const newQty = Math.max(0, currentQty - orderedItem.quantity);
          const threshold = p.lowStockThreshold ?? 5;
          const stillInStock = newQty > 0;

          if (newQty <= 0 && currentQty > 0) {
            triggerInventoryAlert({
              productId: p.id,
              productName: p.name,
              previousStock: currentQty,
              currentStock: 0,
              status: 'out_of_stock',
              message: `🔴 Order placed! "${p.name}" is now OUT OF STOCK!`,
            });
          } else if (newQty <= threshold && currentQty > threshold) {
            triggerInventoryAlert({
              productId: p.id,
              productName: p.name,
              previousStock: currentQty,
              currentStock: newQty,
              status: 'low_stock',
              message: `⚠️ Order placed! "${p.name}" is down to LOW STOCK (${newQty} left)!`,
            });
          }

          return {
            ...p,
            stockQuantity: newQty,
            inStock: stillInStock,
          };
        }
        return p;
      })
    );

    // Award loyalty points & deduct redeemed points
    const pointsEarned = Math.max(10, Math.round(cartTotal * 10)); // 10 points per ₱1 spent
    let netPointsChange = pointsEarned;
    const newTxList: LoyaltyTransaction[] = [];

    if (redeemedLoyaltyPoints > 0) {
      netPointsChange -= redeemedLoyaltyPoints;
      newTxList.push({
        id: `tx-red-${Date.now()}`,
        date: new Date().toISOString(),
        title: `Redeemed for ₱${redeemedLoyaltyDiscount.toFixed(2)} Order Discount`,
        points: -redeemedLoyaltyPoints,
        type: 'redeemed',
      });
    }

    newTxList.push({
      id: `tx-earn-${Date.now()}`,
      date: new Date().toISOString(),
      title: `Earned from Order #${newOrder.id}`,
      points: pointsEarned,
      type: 'earned',
    });

    setLoyaltyPoints(prev => Math.max(0, prev + netPointsChange));
    setLoyaltyHistory(prev => [...newTxList, ...prev]);

    // Reset redeemed state for next cart
    setRedeemedLoyaltyPoints(0);
    setRedeemedLoyaltyDiscount(0);

    clearCart();

    if (isPaid) {
      setPendingFeedbackOrder(newOrder);
    }

    if (soundEnabled) playChime('new_order');
    showToast(`Order ${newOrder.id} placed! You earned +${pointsEarned} Loyalty Points! 🎉`);

    return newOrder;
  };

  // Cashier POS order creation for Walk-In (Dine-In) or Takeout customers
  const createWalkInPosOrder = (params: {
    customerName: string;
    customerPhone?: string;
    diningOption: 'dine_in' | 'takeout';
    tableId?: string;
    paymentMethod: Order['paymentMethod'];
    paymentStatus: PaymentStatus;
    items: CartItem[];
    discountAmount?: number;
    notes?: string;
  }): Order | null => {
    if (params.items.length === 0) {
      showToast('⚠️ POS cart is empty.');
      return null;
    }

    const newOrderNumber = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const matchedTable =
      params.diningOption === 'dine_in' && params.tableId
        ? tables.find(t => t.id === params.tableId) || tables[0]
        : null;

    const orderItems = params.items.map(item => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      modifiers: item.selectedModifiers,
      notes: item.notes,
      itemTotal: item.itemTotal,
    }));

    const subtotal = Number(params.items.reduce((s, i) => s + i.itemTotal, 0).toFixed(2));
    const discount = Number((params.discountAmount || 0).toFixed(2));
    const discountedSub = Math.max(0, subtotal - discount);
    const tax = Number((discountedSub * 0.1).toFixed(2));
    const total = Number((discountedSub + tax).toFixed(2));

    const newOrder: Order = {
      id: newOrderNumber,
      tableId: matchedTable ? matchedTable.id : 'walkin-pos',
      tableNumber: matchedTable ? matchedTable.tableNumber : 'TAKEOUT',
      branchName: 'Central Branch',
      customerName:
        params.customerName.trim() ||
        (params.diningOption === 'takeout' ? 'Walk-In Takeout' : `Walk-In Table #${matchedTable?.tableNumber || '01'}`),
      customerPhone: params.customerPhone || '',
      cashierName: activeCashier.name,
      diningOption: params.diningOption,
      items: orderItems,
      subtotal,
      tax,
      discount,
      total,
      status: 'accepted',
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus,
      notes: params.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedReadyTime: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);

    if (matchedTable) {
      setTables(prev =>
        prev.map(t =>
          t.id === matchedTable.id
            ? { ...t, status: 'occupied', currentOrderId: newOrder.id }
            : t
        )
      );
    }

    // Deduct stock
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const orderedQty = params.items
          .filter(ci => ci.product.id === p.id)
          .reduce((sum, ci) => sum + ci.quantity, 0);
        if (orderedQty > 0) {
          const currentQty = p.stockQuantity ?? (p.inStock ? 10 : 0);
          const newQty = Math.max(0, currentQty - orderedQty);
          return {
            ...p,
            stockQuantity: newQty,
            inStock: newQty > 0,
          };
        }
        return p;
      })
    );

    if (soundEnabled) playChime('new_order');
    showToast(`POS Order ${newOrder.id} (${params.diningOption === 'takeout' ? 'Takeout' : 'Walk-In Dine-In'}) created!`);

    return newOrder;
  };

  // Order status transition
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    let targetTableId: string | null = null;
    setOrders(prev => {
      const nextOrders = prev.map(o => {
        if (o.id === orderId) {
          targetTableId = o.tableId;
          const updated = {
            ...o,
            status,
            updatedAt: new Date().toISOString(),
          };

          if (status === 'ready' && soundEnabled) {
            playChime('order_ready');
          } else if (status === 'preparing' && soundEnabled) {
            playChime('click');
          }

          return updated;
        }
        return o;
      });

      if (targetTableId) {
        const activeOrderOnTable = nextOrders.find(
          o =>
            o.tableId === targetTableId &&
            o.status !== 'completed' &&
            o.status !== 'cancelled'
        );

        setTables(prevTables =>
          prevTables.map(t => {
            if (t.id === targetTableId) {
              if (activeOrderOnTable) {
                return {
                  ...t,
                  status: 'occupied',
                  currentOrderId: activeOrderOnTable.id,
                };
              } else if (status === 'cancelled') {
                return {
                  ...t,
                  status: 'available',
                  currentOrderId: undefined,
                };
              } else {
                // Keep table occupied/disabled after order completion until staff explicitly resets table occupancy
                return {
                  ...t,
                  status: 'occupied',
                  currentOrderId: t.currentOrderId || orderId,
                };
              }
            }
            return t;
          })
        );
      }

      return nextOrders;
    });

    showToast(`Order ${orderId} status changed to ${status.toUpperCase()}`);
  };

  const updateOrderPaymentStatus = (orderId: string, paymentStatus: PaymentStatus) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          const updated = { ...o, paymentStatus, updatedAt: new Date().toISOString() };
          if (paymentStatus === 'paid' && !updated.feedback) {
            setPendingFeedbackOrder(updated);
          }
          return updated;
        }
        return o;
      })
    );
    showToast(`Order ${orderId} marked as ${paymentStatus.toUpperCase()}`);
  };

  const adjustOrderWaitTime = (orderId: string, deltaMinutes: number) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          const currentCreatedMs = new Date(o.createdAt).getTime();
          // Adding wait time means shifting createdAt earlier in the past
          const nextCreatedMs = Math.min(Date.now() - 10 * 1000, currentCreatedMs - deltaMinutes * 60 * 1000);
          return {
            ...o,
            createdAt: new Date(nextCreatedMs).toISOString(),
          };
        }
        return o;
      })
    );
  };

  const cancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  // Active customer order for table
  const currentCustomerOrder =
    orders.find(
      o =>
        (o.tableId === activeTable.id || o.tableNumber === activeTable.tableNumber) &&
        o.status !== 'completed' &&
        o.status !== 'cancelled'
    ) ||
    orders.find(o => o.tableId === activeTable.id || o.tableNumber === activeTable.tableNumber) ||
    null;

  const customerOrderHistory = [...orders]
    .filter(o => o.tableId === activeTable.id || o.tableNumber === activeTable.tableNumber)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Scanning a table QR waives the login requirement; otherwise the customer must be
  // signed in before they can add to the cart or place an order.
  const canOrder = isTableSelected || currentEmployee !== null;

  // Products CRUD
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);
    showToast(`Added product "${newProd.name}"`);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    showToast(`Updated product "${updated.name}"`);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Product deleted');
  };

  const toggleProductStock = (id: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextInStock = !p.inStock;
          const newQty = nextInStock ? (p.stockQuantity && p.stockQuantity > 0 ? p.stockQuantity : 10) : 0;
          
          if (!nextInStock) {
            triggerInventoryAlert({
              productId: p.id,
              productName: p.name,
              previousStock: p.stockQuantity ?? 10,
              currentStock: 0,
              status: 'out_of_stock',
              message: `🔴 "${p.name}" marked as SOLD OUT!`,
            });
          } else {
            triggerInventoryAlert({
              productId: p.id,
              productName: p.name,
              previousStock: 0,
              currentStock: newQty,
              status: 'in_stock',
              message: `🟢 "${p.name}" marked as AVAILABLE (${newQty} units)!`,
            });
          }

          return {
            ...p,
            inStock: nextInStock,
            stockQuantity: newQty,
          };
        }
        return p;
      })
    );
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const prevStock = p.stockQuantity ?? (p.inStock ? 10 : 0);
          const threshold = p.lowStockThreshold ?? lowStockAlertConfig.globalDefaultThreshold;
          const clampedStock = Math.max(0, newStock);
          const isNowInStock = clampedStock > 0;
          const isMonitored = p.alertEnabled !== false;

          if (isMonitored) {
            if (clampedStock <= 0 && prevStock > 0 && lowStockAlertConfig.notifyOnOutOfStock) {
              triggerInventoryAlert({
                productId: p.id,
                productName: p.name,
                previousStock: prevStock,
                currentStock: 0,
                threshold,
                status: 'out_of_stock',
                triggerSource: 'stock_update',
                message: `🔴 "${p.name}" fell to 0 units (Threshold: ${threshold})! Automated email & dashboard alert triggered.`,
              });
            } else if (
              clampedStock > 0 &&
              clampedStock <= threshold &&
              (prevStock > threshold || prevStock === 0 || clampedStock < prevStock) &&
              lowStockAlertConfig.notifyOnLowStock
            ) {
              triggerInventoryAlert({
                productId: p.id,
                productName: p.name,
                previousStock: prevStock,
                currentStock: clampedStock,
                threshold,
                status: 'low_stock',
                triggerSource: 'stock_update',
                message: `⚠️ "${p.name}" fell below defined threshold (${clampedStock} left ≤ limit ${threshold})! Automated alert sent.`,
              });
            } else if (clampedStock > threshold && prevStock <= threshold && lowStockAlertConfig.notifyOnRestock) {
              triggerInventoryAlert({
                productId: p.id,
                productName: p.name,
                previousStock: prevStock,
                currentStock: clampedStock,
                threshold,
                status: 'in_stock',
                triggerSource: 'stock_update',
                message: `🟢 "${p.name}" restocked above threshold (${clampedStock} units · Limit: ${threshold})!`,
              });
            }
          }

          return {
            ...p,
            stockQuantity: clampedStock,
            inStock: isNowInStock,
          };
        }
        return p;
      })
    );
  };

  const restockProduct = (productId: string, amount: number) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      const currentStock = prod.stockQuantity ?? (prod.inStock ? 10 : 0);
      updateProductStock(productId, currentStock + amount);
    }
  };

  const setLowStockThreshold = (productId: string, threshold: number) => {
    const nextThreshold = Math.max(1, threshold);
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const currentQty = p.stockQuantity ?? (p.inStock ? 10 : 0);
          const prevThreshold = p.lowStockThreshold ?? lowStockAlertConfig.globalDefaultThreshold;

          if (
            p.alertEnabled !== false &&
            currentQty > 0 &&
            currentQty <= nextThreshold &&
            currentQty > prevThreshold &&
            lowStockAlertConfig.notifyOnLowStock
          ) {
            triggerInventoryAlert({
              productId: p.id,
              productName: p.name,
              previousStock: currentQty,
              currentStock: currentQty,
              threshold: nextThreshold,
              status: 'low_stock',
              triggerSource: 'threshold_change',
              message: `⚠️ Threshold updated to ${nextThreshold}: "${p.name}" (${currentQty} units) is now at/below its defined threshold!`,
            });
          }

          return { ...p, lowStockThreshold: nextThreshold };
        }
        return p;
      })
    );
    showToast(`✓ Updated low-stock threshold limit to ${nextThreshold} units`);
  };

  // Categories
  const addCategory = (name: string, icon: string = 'Utensils') => {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      icon,
      sortOrder: categories.length,
    };
    setCategories(prev => [...prev, newCat]);
    showToast(`Category "${name}" created`);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast('Category removed');
  };

  // Tables CRUD & Occupancy Management
  const addTable = (tableNumber: string, name: string, section: Table['section'], capacity: number) => {
    const newTbl: Table = {
      id: `tbl-${Date.now()}`,
      tableNumber,
      name,
      section,
      capacity,
      qrCodeUrl: `https://order.company.com/table/${tableNumber}`,
      status: 'available',
    };
    setTables(prev => [...prev, newTbl]);
    showToast(`Table #${tableNumber} added`);
  };

  const updateTable = (updatedTable: Table) => {
    const normalizedTable: Table = {
      ...updatedTable,
      qrCodeUrl: updatedTable.qrCodeUrl || `https://order.company.com/table/${updatedTable.tableNumber}`,
      currentOrderId:
        updatedTable.status === 'occupied' ? updatedTable.currentOrderId : undefined,
    };

    setTables(prev => prev.map(t => (t.id === normalizedTable.id ? normalizedTable : t)));

    if (activeTable.id === normalizedTable.id) {
      setActiveTable(normalizedTable);
    }

    showToast(`✓ Updated Table #${normalizedTable.tableNumber} (${normalizedTable.name})`);
  };

  const setTableOccupancyStatus = (
    tableId: string,
    status: Table['status'],
    currentOrderId?: string
  ) => {
    const target = tables.find(t => t.id === tableId);
    setTables(prev =>
      prev.map(t => {
        if (t.id === tableId) {
          return {
            ...t,
            status,
            currentOrderId: status === 'occupied' ? currentOrderId ?? t.currentOrderId : undefined,
          };
        }
        return t;
      })
    );

    if (target) {
      const label =
        status === 'available'
          ? 'EMPTY / AVAILABLE'
          : status === 'cleaning'
          ? 'NEEDS CLEANING'
          : status.toUpperCase();
      showToast(`Table #${target.tableNumber} marked as ${label}`);
    }
  };

  const deleteTable = (id: string) => {
    setTables(prev => prev.filter(t => t.id !== id));
    showToast('Table deleted');
  };

  // Waiter Service Requests
  const requestWaiterService = (type: WaiterRequest['type']) => {
    const req: WaiterRequest = {
      id: `req-${Date.now()}`,
      tableNumber: activeTable.tableNumber,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      resolved: false,
    };
    setWaiterRequests(prev => [req, ...prev]);
    if (type === 'clean') {
      setTables(prev =>
        prev.map(t => (t.id === activeTable.id ? { ...t, status: 'cleaning' } : t))
      );
    }
    const typeLabel =
      type === 'water'
        ? 'Water refill'
        : type === 'bill'
        ? 'Bill / Check'
        : type === 'clean'
        ? 'Table cleaning'
        : 'Waiter assistance';
    showToast(`Requested ${typeLabel} for Table #${activeTable.tableNumber}`);
    if (soundEnabled) playChime('click');
  };

  const resolveWaiterRequest = (id: string) => {
    setWaiterRequests(prev => prev.map(r => (r.id === id ? { ...r, resolved: true } : r)));
  };

  return (
    <OrderContext.Provider
      value={{
        viewMode,
        setViewMode,
        mobileFrameEnabled,
        setMobileFrameEnabled,
        customerLanguage,
        setCustomerLanguage,
        activeTable,
        setActiveTable,
        selectTableByNumber,
        exitTableSession,
        isTableSelected,
        canOrder,
        categories,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStock,
        addCategory,
        deleteCategory,
        tables,
        addTable,
        updateTable,
        setTableOccupancyStatus,
        deleteTable,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        appliedDiscountCode,
        discountAmount,
        applyDiscountCode,
        cartSubtotal,
        cartTax,
        cartTotal,
        orders,
        placeOrder,
        createWalkInPosOrder,
        updateOrderStatus,
        updateOrderPaymentStatus,
        adjustOrderWaitTime,
        cancelOrder,
        currentCustomerOrder,
        customerOrderHistory,
        feedbacks,
        pendingFeedbackOrder,
        setPendingFeedbackOrder,
        submitCustomerFeedback,
        waiterRequests,
        requestWaiterService,
        resolveWaiterRequest,
        soundEnabled,
        setSoundEnabled,
        toastMessage,
        showToast,
        adminAlerts,
        activeAdminAlert,
        dismissActiveAdminAlert,
        acknowledgeInventoryAlert,
        clearAcknowledgedAlerts,
        lowStockAlertConfig,
        updateLowStockAlertConfig,
        toggleProductAlertEnabled,
        sendLowStockEmailAlert,
        runAutomatedStockScan,
        updateProductStock,
        restockProduct,
        setLowStockThreshold,
        triggerDemoInventoryAlert,
        activeCashier,
        setActiveCashier,
        availableCashiers,
        switchCashierById,
        loyaltyPoints,
        loyaltyHistory,
        redeemedLoyaltyDiscount,
        redeemedLoyaltyPoints,
        applyLoyaltyDiscount,
        cancelLoyaltyDiscount,
        claimBonusLoyaltyPoints,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        currentEmployee,
        loginEmployee,
        logoutEmployee,
        employeeSchedules,
        clockLogs,
        shiftSessions,
        performClockAction,
        addManualShiftSession,
        updateShiftSession,
        deleteShiftSession,
        updateEmployeeHourlyRate,
        businessSettings,
        updateBusinessSettings,
        resetBusinessSettings,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
};
