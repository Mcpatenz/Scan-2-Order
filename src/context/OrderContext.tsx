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
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_TABLES, INITIAL_ORDERS } from '../data/mockData';
import { playChime } from '../utils/audio';

interface OrderContextType {
  // Navigation / View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  mobileFrameEnabled: boolean;
  setMobileFrameEnabled: (enabled: boolean) => void;

  // Active Customer Table
  activeTable: Table;
  setActiveTable: (table: Table) => void;
  selectTableByNumber: (tableNumber: string) => void;

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
    notes?: string
  ) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: PaymentStatus) => void;
  cancelOrder: (orderId: string) => void;
  currentCustomerOrder: Order | null;
  customerOrderHistory: Order[];

  // Waiter Requests
  waiterRequests: WaiterRequest[];
  requestWaiterService: (type: WaiterRequest['type']) => void;
  resolveWaiterRequest: (id: string) => void;

  // Audio & Notification
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Inventory Management & Toast Alerts
  adminAlerts: InventoryAlert[];
  activeAdminAlert: InventoryAlert | null;
  dismissActiveAdminAlert: () => void;
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
    const saved = localStorage.getItem('qr_app_tables');
    return saved ? JSON.parse(saved) : INITIAL_TABLES;
  });

  const [activeTable, setActiveTable] = useState<Table>(() => tables[0] || INITIAL_TABLES[0]);

  // A table is only "claimed" once the customer scans its QR code (or follows a ?table= deep link).
  // Until then the customer stays on the landing page and no table number is shown anywhere.
  const [isTableSelected, setIsTableSelected] = useState<boolean>(false);

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('qr_app_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
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

  const addEmployee = (newEmpData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...newEmpData,
      id: `emp-${Date.now()}`,
    };
    setEmployees(prev => [newEmp, ...prev]);
    showToast(`✓ Added employee ${newEmp.firstName} ${newEmp.lastName} (${newEmp.role.toUpperCase()})`);
  };

  const updateEmployee = (updatedEmp: Employee) => {
    setEmployees(prev => prev.map(e => (e.id === updatedEmp.id ? updatedEmp : e)));
    if (currentEmployee && currentEmployee.id === updatedEmp.id) {
      setCurrentEmployee(updatedEmp);
    }
    showToast(`✓ Updated employee record for ${updatedEmp.firstName} ${updatedEmp.lastName}`);
  };

  const deleteEmployee = (id: string) => {
    const target = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
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
    }
    setCurrentEmployee(null);
    setViewMode('customer');
  };

  // Admin Inventory Alerts State
  const [adminAlerts, setAdminAlerts] = useState<InventoryAlert[]>(() => [
    {
      id: 'alt-init-1',
      productId: 'prod-3',
      productName: 'Truffle Cream Penne Pasta',
      previousStock: 2,
      currentStock: 0,
      status: 'out_of_stock',
      timestamp: new Date().toISOString(),
      message: 'Product "Truffle Cream Penne Pasta" is OUT OF STOCK (0 units left)!',
    },
    {
      id: 'alt-init-2',
      productId: 'prod-2',
      productName: 'Classic Angus Beef Cheeseburger',
      previousStock: 7,
      currentStock: 4,
      status: 'low_stock',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      message: 'Product "Classic Angus Beef Cheeseburger" has LOW STOCK (4 units left)!',
    },
  ]);

  const [activeAdminAlert, setActiveAdminAlert] = useState<InventoryAlert | null>(null);

  const dismissActiveAdminAlert = () => {
    setActiveAdminAlert(null);
  };

  const triggerInventoryAlert = (alert: Omit<InventoryAlert, 'id' | 'timestamp'>) => {
    const newAlert: InventoryAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
    };

    setAdminAlerts(prev => [newAlert, ...prev]);
    setActiveAdminAlert(newAlert);

    if (soundEnabled) {
      if (alert.status === 'out_of_stock' || alert.status === 'low_stock') {
        playChime('alert');
      } else {
        playChime('success');
      }
    }
  };

  const triggerDemoInventoryAlert = (status: StockStatus) => {
    if (status === 'out_of_stock') {
      triggerInventoryAlert({
        productId: 'prod-2',
        productName: 'Classic Angus Beef Cheeseburger',
        previousStock: 2,
        currentStock: 0,
        status: 'out_of_stock',
        message: '🔴 ALERT: Classic Angus Beef Cheeseburger is now OUT OF STOCK!',
      });
    } else if (status === 'low_stock') {
      triggerInventoryAlert({
        productId: 'prod-1',
        productName: 'Grilled Flame Chicken Breast',
        previousStock: 12,
        currentStock: 4,
        status: 'low_stock',
        message: '⚠️ WARNING: Grilled Flame Chicken Breast is running low (4 units left)!',
      });
    } else {
      triggerInventoryAlert({
        productId: 'prod-3',
        productName: 'Truffle Cream Penne Pasta',
        previousStock: 0,
        currentStock: 25,
        status: 'in_stock',
        message: '🟢 RESTOCKED: Truffle Cream Penne Pasta is back IN STOCK (25 units)!',
      });
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
    showToast(`🎉 Redeemed ${points} PTS for $${discountInDollars.toFixed(2)} discount!`);
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

  // Persist state
  useEffect(() => {
    localStorage.setItem('qr_app_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('qr_app_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('qr_app_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('qr_app_orders', JSON.stringify(orders));
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

  // Select table helper
  const selectTableByNumber = (num: string) => {
    const found = tables.find(t => t.tableNumber === num || t.id === num);
    if (found) {
      setActiveTable(found);
      setIsTableSelected(true);
      showToast(`Checked in to Table #${found.tableNumber}`);
    } else {
      showToast(`Table #${num} not found. Showing default Table 1.`);
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
    } else if (trimmed === 'HALF20') {
      setAppliedDiscountCode(trimmed);
      setDiscountPercent(20);
      showToast('🎉 Promo code applied! 20% off');
      if (soundEnabled) playChime('success');
      return true;
    } else {
      showToast('Invalid promo code. Try WELCOME10');
      if (soundEnabled) playChime('alert');
      return false;
    }
  };

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
    notes?: string
  ): Order | null => {
    if (!isTableSelected) {
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

    const isPaid = paymentMethod === 'card' || paymentMethod === 'gcash' || paymentMethod === 'qr_wallet' || paymentMethod === 'virtual_wallet';

    const newOrder: Order = {
      id: newOrderNumber,
      tableId: activeTable.id,
      tableNumber: activeTable.tableNumber,
      branchName: 'Central Branch',
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedReadyTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update table status
    setTables(prev =>
      prev.map(t =>
        t.id === activeTable.id
          ? { ...t, status: 'occupied', currentOrderId: newOrder.id }
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
    const pointsEarned = Math.max(10, Math.round(cartTotal * 10)); // 10 points per $1 spent
    let netPointsChange = pointsEarned;
    const newTxList: LoyaltyTransaction[] = [];

    if (redeemedLoyaltyPoints > 0) {
      netPointsChange -= redeemedLoyaltyPoints;
      newTxList.push({
        id: `tx-red-${Date.now()}`,
        date: new Date().toISOString(),
        title: `Redeemed for $${redeemedLoyaltyDiscount.toFixed(2)} Order Discount`,
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

    if (soundEnabled) playChime('new_order');
    showToast(`Order ${newOrder.id} placed! You earned +${pointsEarned} Loyalty Points! 🎉`);

    return newOrder;
  };

  // Order status transition
  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
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
      })
    );

    showToast(`Order ${orderId} status changed to ${status.toUpperCase()}`);
  };

  const updateOrderPaymentStatus = (orderId: string, paymentStatus: PaymentStatus) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o))
    );
    showToast(`Order ${orderId} marked as ${paymentStatus.toUpperCase()}`);
  };

  const cancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  // Active customer order for table
  const currentCustomerOrder =
    orders.find(o => o.tableId === activeTable.id && o.status !== 'completed' && o.status !== 'cancelled') ||
    orders.find(o => o.tableId === activeTable.id) || null;

  const customerOrderHistory = orders.filter(o => o.tableId === activeTable.id);

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
          const threshold = p.lowStockThreshold ?? 5;
          const isNowInStock = newStock > 0;

          if (newStock <= 0 && prevStock > 0) {
            triggerInventoryAlert({
              productId: p.id,
              productName: p.name,
              previousStock: prevStock,
              currentStock: 0,
              status: 'out_of_stock',
              message: `🔴 "${p.name}" is now OUT OF STOCK (0 units left)!`,
            });
          } else if (newStock > 0 && newStock <= threshold && (prevStock > threshold || prevStock === 0)) {
            triggerInventoryAlert({
              productId: p.id,
              productName: p.name,
              previousStock: prevStock,
              currentStock: newStock,
              status: 'low_stock',
              message: `⚠️ "${p.name}" has LOW STOCK warning (${newStock} units remaining)!`,
            });
          } else if (newStock > threshold && prevStock <= threshold) {
            triggerInventoryAlert({
              productId: p.id,
              productName: p.name,
              previousStock: prevStock,
              currentStock: newStock,
              status: 'in_stock',
              message: `🟢 "${p.name}" restocked to healthy level (${newStock} units)!`,
            });
          }

          return {
            ...p,
            stockQuantity: Math.max(0, newStock),
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
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, lowStockThreshold: Math.max(1, threshold) } : p))
    );
    showToast('Updated low stock threshold limit');
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

  // Tables CRUD
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
        activeTable,
        setActiveTable,
        selectTableByNumber,
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
        updateOrderStatus,
        updateOrderPaymentStatus,
        cancelOrder,
        currentCustomerOrder,
        customerOrderHistory,
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
