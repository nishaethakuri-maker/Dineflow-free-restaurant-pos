/**
 * DineFlow POS - Complete Type Definitions
 * Normalized schemas mirroring Room Entities for Android POS
 */

export type UserRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen';

export interface RolePermissions {
  canAccessPOS: boolean;
  canAccessDashboard: boolean;
  canAccessTables: boolean;
  canAccessKDS: boolean;
  canAccessReports: boolean;
  canAccessMenu: boolean;
  canAccessInventory: boolean;
  canAccessStaff: boolean;
  canAccessSettings: boolean;
  canApplyDiscount: boolean;
  canCancelOrder: boolean;
  canRefundPayment: boolean;
  canOverridePrices: boolean;
  canViewAuditLogs: boolean;
  canBackupRestore: boolean;
}

export type RolePermissionsMap = Record<UserRole, RolePermissions>;

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // 4-digit PIN for rapid authentication
  email?: string;
  password?: string; // Secure password for Owner / Manager access
  avatar?: string;
  isActive: boolean;
  failedPinAttempts?: number;
  lockoutUntil?: number;
  customPermissions?: Partial<RolePermissions>;
  createdAt?: number;
}

export type FoodType = 'veg' | 'non-veg' | 'egg' | 'vegan';

export interface MenuItem {
  id: string;
  name: string;
  nameNepali?: string;
  code: string; // e.g. "MOM-01"
  categoryId: string;
  price: number; // in NPR (e.g. 220)
  costPrice: number; // estimated cost to prepare in NPR (e.g. 85)
  foodType: FoodType;
  isAvailable: boolean;
  image?: string;
  description?: string;
  hasVariants?: boolean;
  variants?: MenuItemVariant[];
  recipeId?: string; // Links to inventory recipe
}

export interface MenuItemVariant {
  id: string;
  name: string; // e.g. "Buff Steam", "Buff Fried", "Buff Jhol", "Buff C-Momo"
  priceDifference: number; // in NPR (e.g. +30 for C-Momo)
}

export interface Category {
  id: string;
  name: string;
  nameNepali?: string;
  icon: string;
  displayOrder: number;
}

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export type OrderStatus = 'active' | 'held' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type KitchenStatus = 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  unitPrice: number; // Frozen price at time of order
  costPrice: number; // Frozen cost at time of order
  quantity: number;
  foodType: FoodType;
  selectedVariant?: MenuItemVariant;
  notes?: string; // e.g., "Extra spicy chutney, no onion"
  kitchenStatus: KitchenStatus;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-1042"
  orderType: OrderType;
  tableId?: string;
  tableName?: string;
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 10 (%) or 100 (NPR)
  discountAmount: number;
  discountReason?: string;
  serviceChargeRate: number; // e.g. 0.10 (10%)
  serviceChargeAmount: number;
  taxRate: number; // e.g. 0.13 (13% VAT)
  taxAmount: number;
  grandTotal: number;
  status: OrderStatus;
  createdAt: number; // Unix timestamp ms
  updatedAt: number;
  closedAt?: number;
  waiterId: string;
  waiterName: string;
  cashierId?: string;
  cashierName?: string;
  cancellationReason?: string;
  paymentId?: string;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'billed';

export interface RestaurantTable {
  id: string;
  tableNumber: string; // e.g. "T-01"
  section: string; // e.g. "Main Hall", "Terrace", "Rooftop", "Cabin"
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  currentOrderTotal?: number;
  occupiedSince?: number;
}

export type PaymentMethod = 'cash' | 'esewa' | 'khalti' | 'card' | 'split';

export interface PaymentSplitDetail {
  method: 'cash' | 'esewa' | 'khalti' | 'card';
  amount: number;
  referenceNumber?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  billNumber: string; // e.g. "INV-2026-0089"
  amount: number;
  method: PaymentMethod;
  tenderedCash?: number;
  changeDue?: number;
  transactionRef?: string; // Essential for eSewa/Khalti/Card
  splitDetails?: PaymentSplitDetail[];
  createdAt: number;
  cashierId: string;
  cashierName: string;
  isRefunded?: boolean;
  refundReason?: string;
  refundedBy?: string;
  refundedAt?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string; // e.g. "Meat", "Grains & Flour", "Vegetables", "Dairy", "Beverages"
  currentStock: number;
  unit: string; // "kg", "g", "ltr", "pcs", "packets"
  minThreshold: number; // Alert threshold
  costPerUnit: number; // in NPR
  lastUpdated: number;
}

export interface RecipeIngredient {
  inventoryItemId: string;
  quantityRequired: number; // In the inventory item's unit
}

export interface Recipe {
  id: string;
  menuItemId: string;
  ingredients: RecipeIngredient[];
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: 'purchase' | 'order_deduction' | 'wastage' | 'adjustment';
  quantity: number; // positive or negative
  unitCost?: number;
  reason?: string;
  referenceId?: string; // Order ID or Invoice ID
  createdAt: number;
  performedBy: string;
}

export type AuditAction =
  | 'login_success'
  | 'login_failed'
  | 'pin_login'
  | 'session_locked'
  | 'user_created'
  | 'user_updated'
  | 'pin_changed'
  | 'permissions_updated'
  | 'initial_setup_completed'
  | 'discount_applied'
  | 'order_cancelled'
  | 'payment_refunded'
  | 'price_changed'
  | 'stock_adjusted'
  | 'bill_settled'
  | 'backup_exported'
  | 'backup_restored';

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  role: UserRole;
  action: AuditAction;
  details: string;
  deviceInfo?: string;
}

export interface PrinterSettings {
  printerName: string;
  paperWidth: '58mm' | '80mm';
  connectionType: 'bluetooth' | 'network' | 'usb';
  ipAddress?: string;
  autoPrintReceiptOnSettle: boolean;
  printKitchenTicket: boolean;
  headerNote?: string;
  footerNote?: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  restaurantNameNepali?: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
  panVatNumber: string; // Nepal PAN or VAT registration #
  currencySymbol: string; // "Rs." or "NPR" or "रु"
  enableServiceCharge: boolean;
  serviceChargeRate: number; // e.g. 0.10 for 10%
  enableVat: boolean;
  vatRate: number; // e.g. 0.13 for 13%
  autoDeductInventoryOnServe: boolean;
  kotAutoPrint: boolean;
  isInitialSetupCompleted: boolean;
  autoLockTimeoutMinutes: number; // 0 = disabled, 5, 10, etc.
  permissions: RolePermissionsMap;
  printer: PrinterSettings;
}
