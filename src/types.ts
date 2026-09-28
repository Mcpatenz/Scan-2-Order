export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type PaymentMethod =
  | 'gcash'
  | 'paymaya'
  | 'cash_on_hand'
  | 'cash'
  | 'card'
  | 'pay_at_counter'
  | 'qr_wallet'
  | 'virtual_wallet';

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

export interface LowStockAlertConfig {
  enabled: boolean;
  dashboardNotifications: boolean;
  emailNotifications: boolean;
  recipientEmails: string[];
  notifyOnLowStock: boolean;
  notifyOnOutOfStock: boolean;
  notifyOnRestock: boolean;
  globalDefaultThreshold: number;
  autoReorderSuggestion: number;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  productName: string;
  categoryName?: string;
  previousStock: number;
  currentStock: number;
  threshold?: number;
  status: StockStatus;
  timestamp: string;
  message: string;
  channelsNotified?: ('dashboard' | 'email')[];
  recipientEmails?: string[];
  emailSubject?: string;
  emailBodyPreview?: string;
  acknowledged?: boolean;
  triggerSource?: 'order_placed' | 'stock_update' | 'threshold_change' | 'scheduled_scan' | 'manual_test';
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
  alertEnabled?: boolean;
  autoReorderQuantity?: number;
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

export interface CustomerFeedback {
  id: string;
  orderId: string;
  tableNumber: string;
  customerName: string;
  rating: number; // 1 to 5
  tags?: string[];
  comment?: string;
  createdAt: string;
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
  isScheduled?: boolean;
  scheduledFor?: string; // ISO string or formatted future schedule timestamp
  createdAt: string; // ISO string
  updatedAt: string;
  estimatedReadyTime?: string; // ISO string
  feedback?: CustomerFeedback;
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
  status: 'available' | 'occupied' | 'cleaning' | 'reserved';
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
  employeeCode?: string;
  role?: string;
  type: 'clock_in' | 'break_start' | 'break_end' | 'clock_out';
  timestamp: string; // ISO String
  shiftDurationHours?: number;
  notes?: string;
}

export interface ShiftSession {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  role: string;
  department: 'Front of House' | 'Kitchen & Culinary' | 'Bar & Beverage' | 'Management';
  hourlyRate: number;
  date: string; // YYYY-MM-DD
  scheduledShift: string;
  clockInTime: string; // ISO string
  clockOutTime?: string; // ISO string (undefined if still active)
  breakMinutes: number;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  status: 'active' | 'on_break' | 'completed';
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
  role: 'admin' | 'cashier' | 'kitchen' | 'customer';
  employeeCode: string; // e.g. "EMP-101"
  pinCode?: string;
  scheduledShift?: string;
  hourlyRate?: number;
}

export interface EmployeeSchedule {
  employeeId: string;
  employeeName: string;
  role: string;
  department?: 'Front of House' | 'Kitchen & Culinary' | 'Bar & Beverage' | 'Management';
  employeeCode: string;
  avatarUrl?: string;
  scheduledShift: string; // e.g. "08:00 AM - 04:00 PM"
  scheduledHours: number;
  hourlyRate?: number;
  status: ClockStatus;
  lastClockIn?: string; // ISO string
  lastClockOut?: string; // ISO string
  breakStartTime?: string; // ISO string
  accumulatedBreakMinutesToday?: number;
  totalHoursWorkedToday: number;
  weeklyHoursWorked?: number;
  pinCode: string;
}

export interface BusinessSettings {
  businessName: string;
  address: string;
  contactNumber: string;
  timeOpen: string; // e.g. "08:00"
  timeClosed: string; // e.g. "22:00"
  gcashNumber: string;
  gcashQrCode: string; // Base64 Data URL or image URL
  paymayaNumber: string;
  paymayaQrCode: string; // Base64 Data URL or image URL
}


