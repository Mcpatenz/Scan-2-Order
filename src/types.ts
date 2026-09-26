export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'gcash' | 'pay_at_counter' | 'qr_wallet' | 'virtual_wallet';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type DiningOption = 'dine_in' | 'takeout';

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelect?: number;
  options: ModifierOption[];
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  currentStock: number;
  status: StockStatus;
  timestamp: string;
  message: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  inStock: boolean;
  stockQuantity?: number;
  lowStockThreshold?: number;
  calories?: number;
  prepTimeMinutes?: number;
  isPopular?: boolean;
  modifierGroups?: ModifierGroup[];
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
}

export interface CartItemModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  id: string; // unique ID for item in cart
  product: Product;
  quantity: number;
  selectedModifiers: CartItemModifier[];
  notes?: string;
  itemTotal: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  modifiers?: CartItemModifier[];
  notes?: string;
  itemTotal: number;
}

export interface Order {
  id: string; // e.g., #ORD-101
  tableId: string;
  tableNumber: string;
  branchName: string;
  customerName: string;
  customerPhone?: string;
  cashierName?: string; // Logged-in Cashier who processed/accepted order
  diningOption: DiningOption;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string;
  estimatedReadyTime?: string; // ISO string
}

export interface CashierInfo {
  id: string;
  name: string;
  role: string;
  shift: string;
  employeeCode: string;
  loginTime: string;
}

export interface Table {
  id: string;
  tableNumber: string;
  name: string; // e.g. "Table 1 (Main Hall)"
  section: 'Main Hall' | 'Patio' | 'VIP Room' | 'Bar Area';
  capacity: number;
  qrCodeUrl: string;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
}

export type ViewMode = 'customer' | 'kitchen' | 'cashier' | 'admin';

export interface WaiterRequest {
  id: string;
  tableNumber: string;
  type: 'water' | 'waiter' | 'bill' | 'clean';
  timestamp: string;
  resolved: boolean;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  discountValue: number;
  icon?: string;
}

export interface LoyaltyTransaction {
  id: string;
  date: string;
  title: string;
  points: number;
  type: 'earned' | 'redeemed';
}

export type ClockStatus = 'clocked_in' | 'on_break' | 'clocked_out';

export interface ClockLog {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'clock_in' | 'break_start' | 'break_end' | 'clock_out';
  timestamp: string; // ISO String
  notes?: string;
}

export interface MonthlyTimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  date: string; // YYYY-MM-DD format
  scheduledShift: string; // e.g. "08:00 AM - 04:00 PM"
  timeIn: string; // e.g. "08:05 AM"
  timeOut: string; // e.g. "04:30 PM"
  totalHours: number; // e.g. 8.4
  lateMinutes: number; // e.g. 5
  overtimeHours: number; // e.g. 0.5
  undertimeMinutes: number; // e.g. 0
  status: 'On Time' | 'Late' | 'Overtime' | 'Undertime' | 'Half Day';
  notes?: string;
}

export interface Employee {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other' | string;
  status: 'Active' | 'Inactive';
  birthDate: string; // YYYY-MM-DD
  address: string;
  contactNumber: string;
  email: string;
  password: string;
  photo: string; // Image URL or Base64 string
  role: 'admin' | 'cashier' | 'kitchen';
  employeeCode: string; // e.g. "EMP-101"
  pinCode?: string;
  scheduledShift?: string;
}

export interface EmployeeSchedule {
  employeeId: string;
  employeeName: string;
  role: string;
  employeeCode: string;
  avatarUrl?: string;
  scheduledShift: string; // e.g. "08:00 AM - 04:00 PM"
  scheduledHours: number;
  status: ClockStatus;
  lastClockIn?: string; // ISO string
  lastClockOut?: string; // ISO string
  breakStartTime?: string; // ISO string
  totalHoursWorkedToday: number;
  pinCode: string;
}

