/**
 * DineFlow POS - Central Application State Context (MVVM Architecture)
 * Provides reactive data, business logic, offline transactions, and role enforcement.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  AuditLog,
  Category,
  FoodType,
  InventoryItem,
  KitchenStatus,
  MenuItem,
  MenuItemVariant,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  Payment,
  PaymentMethod,
  PaymentSplitDetail,
  Recipe,
  RestaurantSettings,
  RestaurantTable,
  User,
  UserRole,
  RolePermissions,
  RolePermissionsMap,
  AuditAction,
} from '../types/pos';
import { posDb } from '../db/storage';
import { DEFAULT_PERMISSIONS } from '../db/sampleData';

export type DeviceMode = 'tablet' | 'phone' | 'fullscreen';

interface CartItemDraft {
  menuItemId: string;
  name: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  foodType: FoodType;
  selectedVariant?: MenuItemVariant;
  notes?: string;
}

interface POSContextType {
  // Device & Form factor
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;

  // Authentication & Staff
  currentUser: User | null;
  users: User[];
  isLocked: boolean;
  loginWithPin: (pin: string, userId?: string) => { success: boolean; message?: string };
  loginWithPassword: (emailOrName: string, password: string) => { success: boolean; message?: string };
  logoutOrLock: () => void;
  unlockTerminal: () => void;
  switchUser: (userId: string, pin: string) => boolean;
  updateStaff: (user: User) => void;
  addStaff: (user: Omit<User, 'id'>) => void;
  checkPermission: (permission: keyof RolePermissions, userToCheck?: User) => boolean;
  updateRolePermissions: (role: UserRole, permissions: Partial<RolePermissions>) => void;
  completeInitialSetup: (
    ownerData: { name: string; email: string; password: string; pin: string },
    managerData: { name: string; email?: string; password?: string; pin: string }
  ) => void;
  verifyManagerPin: (pin: string, actionName: string) => { success: boolean; user?: User; message?: string };
  isSetupWizardOpen: boolean;
  setIsSetupWizardOpen: (open: boolean) => void;

  // Core Data
  categories: Category[];
  menuItems: MenuItem[];
  tables: RestaurantTable[];
  orders: Order[];
  payments: Payment[];
  inventory: InventoryItem[];
  recipes: Recipe[];
  settings: RestaurantSettings;
  auditLogs: AuditLog[];

  // Cart / POS Active Draft State
  activeOrderType: OrderType;
  setActiveOrderType: (type: OrderType) => void;
  selectedTable: RestaurantTable | null;
  setSelectedTable: (table: RestaurantTable | null) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  cartItems: CartItemDraft[];
  addToCart: (item: MenuItem, variant?: MenuItemVariant) => void;
  updateCartItemQty: (index: number, delta: number) => void;
  updateCartItemNotes: (index: number, notes: string) => void;
  removeCartItem: (index: number) => void;
  clearCart: () => void;

  // Cart Calculations
  cartSubtotal: number;
  cartDiscountType: 'percentage' | 'fixed';
  setCartDiscountType: (type: 'percentage' | 'fixed') => void;
  cartDiscountValue: number;
  setCartDiscountValue: (val: number) => void;
  cartDiscountReason: string;
  setCartDiscountReason: (reason: string) => void;
  cartDiscountAmount: number;
  cartServiceChargeAmount: number;
  cartTaxAmount: number;
  cartGrandTotal: number;

  // Order Actions
  createOrUpdateOrder: () => Order | null;
  loadOrderIntoCart: (orderId: string) => void;
  holdCurrentOrder: () => void;
  cancelOrder: (orderId: string, reason: string, managerPin: string) => boolean;
  activeEditingOrderId: string | null;

  // Table Management
  moveTableOrder: (fromTableId: string, toTableId: string) => boolean;
  mergeTableOrders: (primaryTableId: string, secondaryTableId: string) => boolean;

  // Kitchen Display (KDS)
  updateItemKitchenStatus: (orderId: string, itemId: string, status: KitchenStatus) => void;
  updateOrderKitchenStatus: (orderId: string, status: KitchenStatus) => void;

  // Billing & Payments
  settlePayment: (params: {
    orderId: string;
    method: PaymentMethod;
    tenderedCash?: number;
    transactionRef?: string;
    splitDetails?: PaymentSplitDetail[];
  }) => { success: boolean; payment?: Payment; message?: string };
  refundPayment: (paymentId: string, reason: string, managerPin: string) => boolean;

  // Inventory & Recipes
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  updateInventoryStock: (id: string, delta: number, type: 'purchase' | 'wastage' | 'adjustment', reason?: string) => void;
  saveRecipe: (recipe: Recipe) => void;

  // Settings & System
  updateSettings: (newSettings: RestaurantSettings) => void;
  resetDatabase: () => void;
  importDatabase: (json: string) => boolean;
  exportDatabase: () => string;

  // UI Toast notification
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Device mode
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('tablet');

  // Load from persistent DB
  const [users, setUsers] = useState<User[]>(() => posDb.getUsers());
  const [currentUser, setCurrentUser] = useState<User | null>(() => users[0] || null);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [categories, setCategories] = useState<Category[]>(() => posDb.getCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => posDb.getMenuItems());
  const [tables, setTables] = useState<RestaurantTable[]>(() => posDb.getTables());
  const [orders, setOrders] = useState<Order[]>(() => posDb.getOrders());
  const [payments, setPayments] = useState<Payment[]>(() => posDb.getPayments());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => posDb.getInventory());
  const [recipes, setRecipes] = useState<Recipe[]>(() => posDb.getRecipes());
  const [settings, setSettings] = useState<RestaurantSettings>(() => posDb.getSettings());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => posDb.getAuditLogs());

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Draft Cart State
  const [activeOrderType, setActiveOrderType] = useState<OrderType>('dine-in');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [cartItems, setCartItems] = useState<CartItemDraft[]>([]);
  const [cartDiscountType, setCartDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [cartDiscountValue, setCartDiscountValue] = useState<number>(0);
  const [cartDiscountReason, setCartDiscountReason] = useState<string>('');
  const [activeEditingOrderId, setActiveEditingOrderId] = useState<string | null>(null);

  // Setup Wizard & Inactivity Lock state
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(() => !settings.isInitialSetupCompleted);

  // Synchronize storage whenever critical models change
  const refreshFromDb = () => {
    setUsers(posDb.getUsers());
    setCategories(posDb.getCategories());
    setMenuItems(posDb.getMenuItems());
    setTables(posDb.getTables());
    setOrders(posDb.getOrders());
    setPayments(posDb.getPayments());
    setInventory(posDb.getInventory());
    setRecipes(posDb.getRecipes());
    setSettings(posDb.getSettings());
    setAuditLogs(posDb.getAuditLogs());
  };

  // Check permission for active or custom user
  const checkPermission = (permission: keyof RolePermissions, userToCheck?: User): boolean => {
    const user = userToCheck || currentUser;
    if (!user) return false;
    // Owner always has full access
    if (user.role === 'owner') return true;

    // Check custom permissions override first
    if (user.customPermissions && user.customPermissions[permission] !== undefined) {
      return !!user.customPermissions[permission];
    }

    // Check role permissions in settings
    const rolePerms = settings.permissions?.[user.role] || DEFAULT_PERMISSIONS[user.role];
    if (rolePerms && rolePerms[permission] !== undefined) {
      return !!rolePerms[permission];
    }

    return false;
  };

  // Secure Password Login (Prioritized for Owner / Manager)
  const loginWithPassword = (
    emailOrName: string,
    password: string
  ): { success: boolean; message?: string } => {
    const trimmedInput = emailOrName.trim().toLowerCase();
    const targetUser = users.find(
      (u) =>
        u.isActive &&
        (u.email?.toLowerCase() === trimmedInput || u.name.toLowerCase() === trimmedInput)
    );

    if (!targetUser) {
      posDb.logAudit({
        userId: 'unknown',
        userName: emailOrName,
        role: 'cashier',
        action: 'login_failed',
        details: `Password login attempt for non-existent account: ${emailOrName}`,
        deviceInfo: deviceMode,
      });
      setAuditLogs(posDb.getAuditLogs());
      return { success: false, message: 'Account not found. Verify email or username.' };
    }

    if (targetUser.password && targetUser.password === password) {
      targetUser.failedPinAttempts = 0;
      targetUser.lockoutUntil = undefined;
      const updatedUsers = users.map((u) => (u.id === targetUser.id ? targetUser : u));
      setUsers(updatedUsers);
      posDb.saveUsers(updatedUsers);

      setCurrentUser(targetUser);
      setIsLocked(false);

      posDb.logAudit({
        userId: targetUser.id,
        userName: targetUser.name,
        role: targetUser.role,
        action: 'login_success',
        details: `Secure password login by ${targetUser.name} (${targetUser.role.toUpperCase()})`,
        deviceInfo: deviceMode,
      });
      setAuditLogs(posDb.getAuditLogs());
      showToast(`Welcome, ${targetUser.name}! (${targetUser.role.toUpperCase()})`, 'success');
      return { success: true };
    }

    posDb.logAudit({
      userId: targetUser.id,
      userName: targetUser.name,
      role: targetUser.role,
      action: 'login_failed',
      details: `Incorrect password entered for ${targetUser.name}`,
      deviceInfo: deviceMode,
    });
    setAuditLogs(posDb.getAuditLogs());
    return { success: false, message: 'Incorrect password.' };
  };

  // Rapid PIN Authentication with lockout tracking
  const loginWithPin = (
    pin: string,
    targetUserId?: string
  ): { success: boolean; message?: string } => {
    let targetUser: User | undefined;
    if (targetUserId) {
      targetUser = users.find((u) => u.id === targetUserId && u.isActive);
    } else {
      targetUser = users.find((u) => u.pin === pin && u.isActive);
    }

    if (!targetUser) {
      posDb.logAudit({
        userId: 'unknown',
        userName: 'Unknown PIN Attempt',
        role: 'cashier',
        action: 'login_failed',
        details: `Failed PIN attempt entered`,
        deviceInfo: deviceMode,
      });
      setAuditLogs(posDb.getAuditLogs());
      return { success: false, message: 'Invalid PIN. No matching active staff account found.' };
    }

    // Check lockout
    if (targetUser.lockoutUntil && Date.now() < targetUser.lockoutUntil) {
      const waitSeconds = Math.ceil((targetUser.lockoutUntil - Date.now()) / 1000);
      return {
        success: false,
        message: `Account temporarily locked due to failed attempts. Try again in ${waitSeconds}s.`,
      };
    }

    if (targetUser.pin === pin) {
      targetUser.failedPinAttempts = 0;
      targetUser.lockoutUntil = undefined;
      const updatedUsers = users.map((u) => (u.id === targetUser!.id ? targetUser! : u));
      setUsers(updatedUsers);
      posDb.saveUsers(updatedUsers);

      setCurrentUser(targetUser);
      setIsLocked(false);

      posDb.logAudit({
        userId: targetUser.id,
        userName: targetUser.name,
        role: targetUser.role,
        action: 'pin_login',
        details: `Quick PIN terminal unlock by ${targetUser.name} (${targetUser.role.toUpperCase()})`,
        deviceInfo: deviceMode,
      });
      setAuditLogs(posDb.getAuditLogs());
      showToast(`Welcome, ${targetUser.name}!`, 'success');
      return { success: true };
    } else {
      const attempts = (targetUser.failedPinAttempts || 0) + 1;
      targetUser.failedPinAttempts = attempts;
      let lockoutMsg = '';
      if (attempts >= 5) {
        targetUser.lockoutUntil = Date.now() + 60000; // 1 min lockout
        lockoutMsg = ' Too many attempts. Account locked for 60 seconds.';
      }
      const updatedUsers = users.map((u) => (u.id === targetUser!.id ? targetUser! : u));
      setUsers(updatedUsers);
      posDb.saveUsers(updatedUsers);

      posDb.logAudit({
        userId: targetUser.id,
        userName: targetUser.name,
        role: targetUser.role,
        action: 'login_failed',
        details: `Incorrect PIN entered for ${targetUser.name} (Attempt ${attempts})${lockoutMsg}`,
        deviceInfo: deviceMode,
      });
      setAuditLogs(posDb.getAuditLogs());

      return {
        success: false,
        message: `Incorrect PIN.${lockoutMsg ? lockoutMsg : ` (${5 - attempts} attempts left)`}`,
      };
    }
  };

  const logoutOrLock = () => {
    setIsLocked(true);
    if (currentUser) {
      posDb.logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        role: currentUser.role,
        action: 'session_locked',
        details: `Session locked manually by ${currentUser.name}`,
        deviceInfo: deviceMode,
      });
      setAuditLogs(posDb.getAuditLogs());
    }
  };

  const unlockTerminal = () => {
    setIsLocked(false);
  };

  const switchUser = (userId: string, pin: string): boolean => {
    const res = loginWithPin(pin, userId);
    return res.success;
  };

  const verifyManagerPin = (
    pin: string,
    actionName: string
  ): { success: boolean; user?: User; message?: string } => {
    const authorizer = users.find(
      (u) => u.pin === pin && u.isActive && (u.role === 'owner' || u.role === 'manager')
    );
    if (!authorizer) {
      posDb.logAudit({
        userId: currentUser?.id || 'unknown',
        userName: currentUser?.name || 'Staff',
        role: currentUser?.role || 'cashier',
        action: 'login_failed',
        details: `Failed authorization attempt for action: ${actionName}`,
        deviceInfo: deviceMode,
      });
      setAuditLogs(posDb.getAuditLogs());
      return { success: false, message: 'Invalid Manager PIN. Owner or Manager authorization required.' };
    }

    posDb.logAudit({
      userId: authorizer.id,
      userName: authorizer.name,
      role: authorizer.role,
      action: 'pin_login',
      details: `Approved action: ${actionName} for ${currentUser?.name || 'Staff'}`,
      deviceInfo: deviceMode,
    });
    setAuditLogs(posDb.getAuditLogs());
    return { success: true, user: authorizer };
  };

  const updateRolePermissions = (role: UserRole, permissionsToUpdate: Partial<RolePermissions>) => {
    const currentPerms = settings.permissions || DEFAULT_PERMISSIONS;
    const updatedRolePerms = {
      ...currentPerms[role],
      ...permissionsToUpdate,
    };
    const newPermissions = {
      ...currentPerms,
      [role]: updatedRolePerms,
    };
    const updatedSettings: RestaurantSettings = {
      ...settings,
      permissions: newPermissions,
    };
    setSettings(updatedSettings);
    posDb.saveSettings(updatedSettings);

    posDb.logAudit({
      userId: currentUser?.id || 'u-1',
      userName: currentUser?.name || 'Owner',
      role: currentUser?.role || 'owner',
      action: 'permissions_updated',
      details: `Updated permissions configuration for role: ${role.toUpperCase()}`,
      deviceInfo: deviceMode,
    });
    setAuditLogs(posDb.getAuditLogs());
    showToast(`Permissions for ${role.toUpperCase()} updated.`, 'success');
  };

  const completeInitialSetup = (
    ownerData: { name: string; email: string; password: string; pin: string },
    managerData: { name: string; email?: string; password?: string; pin: string }
  ) => {
    const updatedUsers = [...users];

    // Update or create owner
    const ownerIdx = updatedUsers.findIndex((u) => u.role === 'owner');
    const newOwner: User = {
      id: ownerIdx >= 0 ? updatedUsers[ownerIdx].id : `u-owner-${Date.now()}`,
      name: ownerData.name,
      role: 'owner',
      pin: ownerData.pin,
      email: ownerData.email,
      password: ownerData.password,
      isActive: true,
      createdAt: Date.now(),
    };
    if (ownerIdx >= 0) {
      updatedUsers[ownerIdx] = newOwner;
    } else {
      updatedUsers.unshift(newOwner);
    }

    // Update or create manager
    const managerIdx = updatedUsers.findIndex((u) => u.role === 'manager');
    const newManager: User = {
      id: managerIdx >= 0 ? updatedUsers[managerIdx].id : `u-mgr-${Date.now()}`,
      name: managerData.name,
      role: 'manager',
      pin: managerData.pin,
      email: managerData.email || 'manager@dineflow.com',
      password: managerData.password || 'Manager@123',
      isActive: true,
      createdAt: Date.now(),
    };
    if (managerIdx >= 0) {
      updatedUsers[managerIdx] = newManager;
    } else {
      updatedUsers.splice(1, 0, newManager);
    }

    setUsers(updatedUsers);
    posDb.saveUsers(updatedUsers);
    setCurrentUser(newOwner);

    const updatedSettings: RestaurantSettings = {
      ...settings,
      isInitialSetupCompleted: true,
    };
    setSettings(updatedSettings);
    posDb.saveSettings(updatedSettings);

    posDb.logAudit({
      userId: newOwner.id,
      userName: newOwner.name,
      role: 'owner',
      action: 'initial_setup_completed',
      details: `Initial setup completed. Configured Owner (${newOwner.name}) and Manager (${newManager.name})`,
      deviceInfo: deviceMode,
    });
    setAuditLogs(posDb.getAuditLogs());

    setIsSetupWizardOpen(false);
    showToast('Initial Owner & Manager setup completed successfully!', 'success');
  };

  const updateStaff = (user: User) => {
    const updated = users.map((u) => (u.id === user.id ? user : u));
    setUsers(updated);
    posDb.saveUsers(updated);

    posDb.logAudit({
      userId: currentUser?.id || 'u-1',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'owner',
      action: 'user_updated',
      details: `Updated staff profile for ${user.name} (${user.role.toUpperCase()})`,
      deviceInfo: deviceMode,
    });
    setAuditLogs(posDb.getAuditLogs());
    showToast('Staff member updated.', 'success');
  };

  const addStaff = (user: Omit<User, 'id'>) => {
    const newUser: User = {
      ...user,
      id: `u-${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    posDb.saveUsers(updated);

    posDb.logAudit({
      userId: currentUser?.id || 'u-1',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'owner',
      action: 'user_created',
      details: `Registered new staff member ${newUser.name} as ${newUser.role.toUpperCase()}`,
      deviceInfo: deviceMode,
    });
    setAuditLogs(posDb.getAuditLogs());
    showToast(`Staff ${newUser.name} added.`, 'success');
  };

  // Auto-lock session timer on idle
  useEffect(() => {
    if (!settings.autoLockTimeoutMinutes || settings.autoLockTimeoutMinutes <= 0) return;

    let lastActivity = Date.now();
    const handleActivity = () => {
      lastActivity = Date.now();
    };

    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const interval = setInterval(() => {
      if (!isLocked && currentUser) {
        const timeoutMs = settings.autoLockTimeoutMinutes * 60 * 1000;
        if (Date.now() - lastActivity > timeoutMs) {
          setIsLocked(true);
          posDb.logAudit({
            userId: currentUser.id,
            userName: currentUser.name,
            role: currentUser.role,
            action: 'session_locked',
            details: `Terminal auto-locked after ${settings.autoLockTimeoutMinutes} minutes of inactivity`,
            deviceInfo: deviceMode,
          });
          setAuditLogs(posDb.getAuditLogs());
        }
      }
    }, 15000);

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(interval);
    };
  }, [settings.autoLockTimeoutMinutes, isLocked, currentUser, deviceMode]);

  // Cart Management
  const addToCart = (item: MenuItem, variant?: MenuItemVariant) => {
    setCartItems((prev) => {
      // Find matching item with identical variant
      const existingIdx = prev.findIndex(
        (ci) => ci.menuItemId === item.id && ci.selectedVariant?.id === variant?.id
      );
      const unitPrice = item.price + (variant ? variant.priceDifference : 0);

      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + 1,
        };
        return next;
      } else {
        return [
          ...prev,
          {
            menuItemId: item.id,
            name: variant ? `${item.name} (${variant.name})` : item.name,
            unitPrice,
            costPrice: item.costPrice,
            quantity: 1,
            foodType: item.foodType,
            selectedVariant: variant,
            notes: '',
          },
        ];
      }
    });
  };

  const updateCartItemQty = (index: number, delta: number) => {
    setCartItems((prev) => {
      const next = [...prev];
      if (index >= 0 && index < next.length) {
        const newQty = next[index].quantity + delta;
        if (newQty <= 0) {
          return next.filter((_, i) => i !== index);
        } else {
          next[index] = { ...next[index], quantity: newQty };
          return next;
        }
      }
      return prev;
    });
  };

  const updateCartItemNotes = (index: number, notes: string) => {
    setCartItems((prev) => {
      const next = [...prev];
      if (index >= 0 && index < next.length) {
        next[index] = { ...next[index], notes };
      }
      return next;
    });
  };

  const removeCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedTable(null);
    setCustomerName('');
    setCustomerPhone('');
    setCartDiscountValue(0);
    setCartDiscountReason('');
    setActiveEditingOrderId(null);
    setActiveOrderType('dine-in');
  };

  // Cart Totals Calculation
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cartItems]);

  const cartDiscountAmount = useMemo(() => {
    if (cartDiscountValue <= 0 || cartSubtotal <= 0) return 0;
    if (cartDiscountType === 'percentage') {
      return Number(((cartSubtotal * cartDiscountValue) / 100).toFixed(2));
    }
    return Math.min(cartSubtotal, cartDiscountValue);
  }, [cartSubtotal, cartDiscountType, cartDiscountValue]);

  const taxableSubtotal = Math.max(0, cartSubtotal - cartDiscountAmount);

  const cartServiceChargeAmount = useMemo(() => {
    if (!settings.enableServiceCharge || settings.serviceChargeRate <= 0) return 0;
    return Number((taxableSubtotal * settings.serviceChargeRate).toFixed(2));
  }, [taxableSubtotal, settings.enableServiceCharge, settings.serviceChargeRate]);

  const cartTaxAmount = useMemo(() => {
    if (!settings.enableVat || settings.vatRate <= 0) return 0;
    // In Nepal, VAT is applied on (Taxable Subtotal + Service Charge)
    const vatBase = taxableSubtotal + cartServiceChargeAmount;
    return Number((vatBase * settings.vatRate).toFixed(2));
  }, [taxableSubtotal, cartServiceChargeAmount, settings.enableVat, settings.vatRate]);

  const cartGrandTotal = useMemo(() => {
    return Math.round(taxableSubtotal + cartServiceChargeAmount + cartTaxAmount);
  }, [taxableSubtotal, cartServiceChargeAmount, cartTaxAmount]);

  // Create or Update Order
  const createOrUpdateOrder = (): Order | null => {
    if (cartItems.length === 0) {
      showToast('Cart is empty. Add items first.', 'error');
      return null;
    }

    if (activeOrderType === 'dine-in' && !selectedTable) {
      showToast('Please select a table for Dine-in orders.', 'error');
      return null;
    }

    const orderItems: OrderItem[] = cartItems.map((ci, i) => ({
      id: `oi-${Date.now()}-${i}`,
      menuItemId: ci.menuItemId,
      name: ci.name,
      unitPrice: ci.unitPrice,
      costPrice: ci.costPrice,
      quantity: ci.quantity,
      foodType: ci.foodType,
      selectedVariant: ci.selectedVariant,
      notes: ci.notes,
      kitchenStatus: 'new',
    }));

    let updatedOrder: Order;

    if (activeEditingOrderId) {
      // Update existing order
      const existing = orders.find((o) => o.id === activeEditingOrderId);
      if (!existing) {
        showToast('Existing order not found.', 'error');
        return null;
      }
      updatedOrder = {
        ...existing,
        items: orderItems,
        subtotal: cartSubtotal,
        discountType: cartDiscountType,
        discountValue: cartDiscountValue,
        discountAmount: cartDiscountAmount,
        discountReason: cartDiscountReason || undefined,
        serviceChargeAmount: cartServiceChargeAmount,
        taxAmount: cartTaxAmount,
        grandTotal: cartGrandTotal,
        updatedAt: Date.now(),
      };

      const updatedOrders = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
      setOrders(updatedOrders);
      posDb.saveOrders(updatedOrders);
      showToast(`Order #${updatedOrder.orderNumber} updated!`, 'success');
    } else {
      // Prevent duplicate active orders on the same table
      if (activeOrderType === 'dine-in' && selectedTable) {
        const hasExisting = orders.find(
          (o) =>
            o.tableId === selectedTable.id &&
            (o.status === 'active' || o.status === 'preparing' || o.status === 'ready')
        );
        if (hasExisting) {
          showToast(
            `Table ${selectedTable.tableNumber} already has an active order #${hasExisting.orderNumber}. Load it to modify.`,
            'error'
          );
          return null;
        }
      }

      const orderNumber = posDb.getNextOrderNumber();
      updatedOrder = {
        id: `ord-${Date.now()}`,
        orderNumber,
        orderType: activeOrderType,
        tableId: selectedTable?.id,
        tableName: selectedTable?.tableNumber,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        items: orderItems,
        subtotal: cartSubtotal,
        discountType: cartDiscountType,
        discountValue: cartDiscountValue,
        discountAmount: cartDiscountAmount,
        discountReason: cartDiscountReason || undefined,
        serviceChargeRate: settings.serviceChargeRate,
        serviceChargeAmount: cartServiceChargeAmount,
        taxRate: settings.vatRate,
        taxAmount: cartTaxAmount,
        grandTotal: cartGrandTotal,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        waiterId: currentUser?.id || 'u-1',
        waiterName: currentUser?.name || 'Staff',
      };

      const updatedOrders = [updatedOrder, ...orders];
      setOrders(updatedOrders);
      posDb.saveOrders(updatedOrders);

      // If dine-in, mark table as occupied
      if (selectedTable) {
        const updatedTables = tables.map((t) =>
          t.id === selectedTable.id
            ? {
                ...t,
                status: 'occupied' as const,
                currentOrderId: updatedOrder.id,
                currentOrderTotal: updatedOrder.grandTotal,
                occupiedSince: Date.now(),
              }
            : t
        );
        setTables(updatedTables);
        posDb.saveTables(updatedTables);
      }

      showToast(`Order #${updatedOrder.orderNumber} placed & sent to kitchen!`, 'success');
    }

    clearCart();
    return updatedOrder;
  };

  const loadOrderIntoCart = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setActiveOrderType(order.orderType);
    if (order.tableId) {
      const tbl = tables.find((t) => t.id === order.tableId) || null;
      setSelectedTable(tbl);
    } else {
      setSelectedTable(null);
    }

    setCustomerName(order.customerName || '');
    setCustomerPhone(order.customerPhone || '');
    setCartDiscountType(order.discountType);
    setCartDiscountValue(order.discountValue);
    setCartDiscountReason(order.discountReason || '');
    setActiveEditingOrderId(order.id);

    setCartItems(
      order.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        unitPrice: item.unitPrice,
        costPrice: item.costPrice,
        quantity: item.quantity,
        foodType: item.foodType,
        selectedVariant: item.selectedVariant,
        notes: item.notes,
      }))
    );
    showToast(`Loaded order #${order.orderNumber} to cart`, 'info');
  };

  const holdCurrentOrder = () => {
    if (cartItems.length === 0) return;
    const order = createOrUpdateOrder();
    if (order) {
      const updatedOrders = orders.map((o) =>
        o.id === order.id ? { ...o, status: 'held' as const } : o
      );
      setOrders(updatedOrders);
      posDb.saveOrders(updatedOrders);
      showToast(`Order #${order.orderNumber} put on hold`, 'info');
    }
  };

  const cancelOrder = (orderId: string, reason: string, managerPin: string): boolean => {
    // Require manager or owner PIN
    const authStaff = users.find(
      (u) => u.pin === managerPin && (u.role === 'manager' || u.role === 'owner')
    );
    if (!authStaff) {
      showToast('Manager authorization PIN required to cancel orders.', 'error');
      return false;
    }

    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    const updatedOrders = orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'cancelled' as const,
            cancellationReason: reason,
            updatedAt: Date.now(),
          }
        : o
    );
    setOrders(updatedOrders);
    posDb.saveOrders(updatedOrders);

    // Free up table if dine-in
    if (order.tableId) {
      const updatedTables = tables.map((t) =>
        t.id === order.tableId
          ? {
              ...t,
              status: 'available' as const,
              currentOrderId: undefined,
              currentOrderTotal: undefined,
              occupiedSince: undefined,
            }
          : t
      );
      setTables(updatedTables);
      posDb.saveTables(updatedTables);
    }

    posDb.logAudit({
      userId: authStaff.id,
      userName: authStaff.name,
      role: authStaff.role,
      action: 'order_cancelled',
      details: `Cancelled Order #${order.orderNumber}. Reason: ${reason}`,
    });
    setAuditLogs(posDb.getAuditLogs());

    showToast(`Order #${order.orderNumber} cancelled.`, 'info');
    return true;
  };

  // Table Move & Merge
  const moveTableOrder = (fromTableId: string, toTableId: string): boolean => {
    const fromTable = tables.find((t) => t.id === fromTableId);
    const toTable = tables.find((t) => t.id === toTableId);

    if (!fromTable || !toTable) return false;
    if (toTable.status === 'occupied') {
      showToast(`Target Table ${toTable.tableNumber} is occupied!`, 'error');
      return false;
    }

    const activeOrder = orders.find((o) => o.id === fromTable.currentOrderId);
    if (!activeOrder) {
      showToast('No active order to move.', 'error');
      return false;
    }

    // Update order
    const updatedOrders = orders.map((o) =>
      o.id === activeOrder.id
        ? { ...o, tableId: toTable.id, tableName: toTable.tableNumber, updatedAt: Date.now() }
        : o
    );
    setOrders(updatedOrders);
    posDb.saveOrders(updatedOrders);

    // Update tables
    const updatedTables = tables.map((t) => {
      if (t.id === fromTable.id) {
        return {
          ...t,
          status: 'available' as const,
          currentOrderId: undefined,
          currentOrderTotal: undefined,
          occupiedSince: undefined,
        };
      }
      if (t.id === toTable.id) {
        return {
          ...t,
          status: 'occupied' as const,
          currentOrderId: activeOrder.id,
          currentOrderTotal: activeOrder.grandTotal,
          occupiedSince: fromTable.occupiedSince || Date.now(),
        };
      }
      return t;
    });
    setTables(updatedTables);
    posDb.saveTables(updatedTables);

    showToast(`Order moved from ${fromTable.tableNumber} to ${toTable.tableNumber}`, 'success');
    return true;
  };

  const mergeTableOrders = (primaryTableId: string, secondaryTableId: string): boolean => {
    const primTable = tables.find((t) => t.id === primaryTableId);
    const secTable = tables.find((t) => t.id === secondaryTableId);

    if (!primTable || !secTable) return false;
    const primOrder = orders.find((o) => o.id === primTable.currentOrderId);
    const secOrder = orders.find((o) => o.id === secTable.currentOrderId);

    if (!primOrder || !secOrder) {
      showToast('Both tables must have active orders to merge.', 'error');
      return false;
    }

    // Combine items
    const combinedItems = [...primOrder.items, ...secOrder.items];
    const newSubtotal = combinedItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    const newService = Number((newSubtotal * primOrder.serviceChargeRate).toFixed(2));
    const newTax = Number(((newSubtotal + newService) * primOrder.taxRate).toFixed(2));
    const newTotal = Math.round(newSubtotal + newService + newTax);

    // Update primary order
    const updatedPrimOrder: Order = {
      ...primOrder,
      items: combinedItems,
      subtotal: newSubtotal,
      serviceChargeAmount: newService,
      taxAmount: newTax,
      grandTotal: newTotal,
      updatedAt: Date.now(),
    };

    // Cancel secondary order with merged reason
    const updatedSecOrder: Order = {
      ...secOrder,
      status: 'cancelled',
      cancellationReason: `Merged into Table ${primTable.tableNumber} (#${primOrder.orderNumber})`,
      updatedAt: Date.now(),
    };

    const updatedOrders = orders.map((o) => {
      if (o.id === primOrder.id) return updatedPrimOrder;
      if (o.id === secOrder.id) return updatedSecOrder;
      return o;
    });
    setOrders(updatedOrders);
    posDb.saveOrders(updatedOrders);

    // Free secondary table
    const updatedTables = tables.map((t) => {
      if (t.id === secTable.id) {
        return {
          ...t,
          status: 'available' as const,
          currentOrderId: undefined,
          currentOrderTotal: undefined,
          occupiedSince: undefined,
        };
      }
      if (t.id === primTable.id) {
        return {
          ...t,
          currentOrderTotal: newTotal,
        };
      }
      return t;
    });
    setTables(updatedTables);
    posDb.saveTables(updatedTables);

    showToast(`Merged ${secTable.tableNumber} into ${primTable.tableNumber}`, 'success');
    return true;
  };

  // KDS Actions
  const updateItemKitchenStatus = (orderId: string, itemId: string, status: KitchenStatus) => {
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        const updatedItems = o.items.map((it) =>
          it.id === itemId ? { ...it, kitchenStatus: status } : it
        );
        return { ...o, items: updatedItems, updatedAt: Date.now() };
      }
      return o;
    });
    setOrders(updatedOrders);
    posDb.saveOrders(updatedOrders);
  };

  const updateOrderKitchenStatus = (orderId: string, status: KitchenStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    let newOrderStatus: OrderStatus = targetOrder.status;
    if (status === 'preparing') newOrderStatus = 'preparing';
    if (status === 'ready') newOrderStatus = 'ready';
    if (status === 'served') {
      newOrderStatus = 'ready'; // Still needs payment before 'completed'
      // Deduct inventory if configured
      if (settings.autoDeductInventoryOnServe) {
        posDb.deductInventoryForOrder(targetOrder, currentUser?.name || 'Kitchen Staff');
        setInventory(posDb.getInventory());
      }
    }

    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newOrderStatus,
          items: o.items.map((it) => ({ ...it, kitchenStatus: status })),
          updatedAt: Date.now(),
        };
      }
      return o;
    });
    setOrders(updatedOrders);
    posDb.saveOrders(updatedOrders);
    showToast(`Order #${targetOrder.orderNumber} marked as ${status.toUpperCase()}`, 'info');
  };

  // Billing and Payment Settlement
  const settlePayment = (params: {
    orderId: string;
    method: PaymentMethod;
    tenderedCash?: number;
    transactionRef?: string;
    splitDetails?: PaymentSplitDetail[];
  }): { success: boolean; payment?: Payment; message?: string } => {
    const order = orders.find((o) => o.id === params.orderId);
    if (!order) {
      return { success: false, message: 'Order not found.' };
    }

    // Check duplicate payment
    const existingPayment = payments.find((p) => p.orderId === order.id && !p.isRefunded);
    if (existingPayment) {
      return {
        success: false,
        message: `Order #${order.orderNumber} has already been paid (Bill #${existingPayment.billNumber}).`,
      };
    }

    // For QR (eSewa / Khalti) require manual verification reference
    if (
      (params.method === 'esewa' || params.method === 'khalti') &&
      (!params.transactionRef || params.transactionRef.trim().length < 4)
    ) {
      return {
        success: false,
        message: 'A valid Transaction / Reference ID is required to verify digital QR payment.',
      };
    }

    // Cash check
    let changeDue = 0;
    if (params.method === 'cash') {
      if (!params.tenderedCash || params.tenderedCash < order.grandTotal) {
        return {
          success: false,
          message: `Tendered amount (Rs. ${params.tenderedCash || 0}) is less than grand total (Rs. ${order.grandTotal}).`,
        };
      }
      changeDue = params.tenderedCash - order.grandTotal;
    }

    const billNumber = posDb.getNextBillNumber();
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      orderId: order.id,
      billNumber,
      amount: order.grandTotal,
      method: params.method,
      tenderedCash: params.tenderedCash,
      changeDue,
      transactionRef: params.transactionRef,
      splitDetails: params.splitDetails,
      createdAt: Date.now(),
      cashierId: currentUser?.id || 'u-3',
      cashierName: currentUser?.name || 'Cashier',
    };

    // Save payment
    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    posDb.savePayments(updatedPayments);

    // Finalize order
    const updatedOrders = orders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            status: 'completed' as const,
            closedAt: Date.now(),
            paymentId: newPayment.id,
            cashierId: newPayment.cashierId,
            cashierName: newPayment.cashierName,
          }
        : o
    );
    setOrders(updatedOrders);
    posDb.saveOrders(updatedOrders);

    // Free table if dine-in
    if (order.tableId) {
      const updatedTables = tables.map((t) =>
        t.id === order.tableId
          ? {
              ...t,
              status: 'available' as const,
              currentOrderId: undefined,
              currentOrderTotal: undefined,
              occupiedSince: undefined,
            }
          : t
      );
      setTables(updatedTables);
      posDb.saveTables(updatedTables);
    }

    // Auto deduct inventory if not already deducted at kitchen stage
    posDb.deductInventoryForOrder(order, newPayment.cashierName);
    setInventory(posDb.getInventory());

    // Audit log
    posDb.logAudit({
      userId: newPayment.cashierId,
      userName: newPayment.cashierName,
      role: currentUser?.role || 'cashier',
      action: 'bill_settled',
      details: `Settled Bill ${billNumber} for Order #${order.orderNumber} (Rs. ${order.grandTotal}) via ${params.method.toUpperCase()}`,
    });
    setAuditLogs(posDb.getAuditLogs());

    showToast(`Bill #${billNumber} settled successfully!`, 'success');
    return { success: true, payment: newPayment };
  };

  const refundPayment = (paymentId: string, reason: string, managerPin: string): boolean => {
    const authStaff = users.find(
      (u) => u.pin === managerPin && (u.role === 'manager' || u.role === 'owner')
    );
    if (!authStaff) {
      showToast('Manager PIN authorization required to refund.', 'error');
      return false;
    }

    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return false;

    const updatedPayments = payments.map((p) =>
      p.id === paymentId
        ? {
            ...p,
            isRefunded: true,
            refundReason: reason,
            refundedBy: authStaff.name,
            refundedAt: Date.now(),
          }
        : p
    );
    setPayments(updatedPayments);
    posDb.savePayments(updatedPayments);

    posDb.logAudit({
      userId: authStaff.id,
      userName: authStaff.name,
      role: authStaff.role,
      action: 'payment_refunded',
      details: `Refunded Bill ${payment.billNumber} (Rs. ${payment.amount}). Reason: ${reason}`,
    });
    setAuditLogs(posDb.getAuditLogs());

    showToast(`Bill #${payment.billNumber} refunded.`, 'info');
    return true;
  };

  // Inventory & Recipes
  const addInventoryItem = (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      lastUpdated: Date.now(),
    };
    const updated = [...inventory, newItem];
    setInventory(updated);
    posDb.saveInventory(updated);
    showToast(`Added ${newItem.name} to inventory`, 'success');
  };

  const updateInventoryStock = (
    id: string,
    delta: number,
    type: 'purchase' | 'wastage' | 'adjustment',
    reason?: string
  ) => {
    const updated = inventory.map((item) => {
      if (item.id === id) {
        const nextStock = Math.max(0, Number((item.currentStock + delta).toFixed(3)));
        return { ...item, currentStock: nextStock, lastUpdated: Date.now() };
      }
      return item;
    });
    setInventory(updated);
    posDb.saveInventory(updated);

    const targetItem = inventory.find((i) => i.id === id);
    if (targetItem) {
      const movements = posDb.getStockMovements();
      const newMov = {
        id: `mov-${Date.now()}`,
        inventoryItemId: id,
        type,
        quantity: delta,
        unitCost: targetItem.costPerUnit,
        reason: reason || `${type.toUpperCase()} recorded`,
        createdAt: Date.now(),
        performedBy: currentUser?.name || 'Staff',
      };
      posDb.saveStockMovements([newMov, ...movements]);

      posDb.logAudit({
        userId: currentUser?.id || 'u-1',
        userName: currentUser?.name || 'Staff',
        role: currentUser?.role || 'owner',
        action: 'stock_adjusted',
        details: `${type.toUpperCase()} of ${Math.abs(delta)} ${targetItem.unit} for ${targetItem.name}. Reason: ${reason || 'N/A'}`,
      });
      setAuditLogs(posDb.getAuditLogs());
    }

    showToast(`Stock updated (${delta > 0 ? '+' : ''}${delta})`, 'success');
  };

  const saveRecipe = (recipe: Recipe) => {
    const existingIdx = recipes.findIndex((r) => r.menuItemId === recipe.menuItemId);
    let updated: Recipe[];
    if (existingIdx >= 0) {
      updated = [...recipes];
      updated[existingIdx] = recipe;
    } else {
      updated = [...recipes, recipe];
    }
    setRecipes(updated);
    posDb.saveRecipes(updated);
    showToast('Recipe recipe saved successfully', 'success');
  };

  // Settings
  const updateSettings = (newSettings: RestaurantSettings) => {
    setSettings(newSettings);
    posDb.saveSettings(newSettings);
    showToast('Restaurant settings saved.', 'success');
  };

  const resetDatabase = () => {
    posDb.resetToDefaults();
    refreshFromDb();
    clearCart();
    showToast('Database reset to authentic sample data.', 'info');
  };

  const importDatabase = (json: string): boolean => {
    const success = posDb.restoreBackup(json);
    if (success) {
      refreshFromDb();
      showToast('Database restored successfully from backup!', 'success');
      return true;
    }
    showToast('Failed to parse backup JSON.', 'error');
    return false;
  };

  const exportDatabase = (): string => {
    return posDb.exportBackup();
  };

  return (
    <POSContext.Provider
      value={{
        deviceMode,
        setDeviceMode,
        currentUser,
        users,
        isLocked,
        loginWithPin,
        loginWithPassword,
        logoutOrLock,
        unlockTerminal,
        switchUser,
        updateStaff,
        addStaff,
        checkPermission,
        updateRolePermissions,
        completeInitialSetup,
        verifyManagerPin,
        isSetupWizardOpen,
        setIsSetupWizardOpen,
        categories,
        menuItems,
        tables,
        orders,
        payments,
        inventory,
        recipes,
        settings,
        auditLogs,
        activeOrderType,
        setActiveOrderType,
        selectedTable,
        setSelectedTable,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        cartItems,
        addToCart,
        updateCartItemQty,
        updateCartItemNotes,
        removeCartItem,
        clearCart,
        cartSubtotal,
        cartDiscountType,
        setCartDiscountType,
        cartDiscountValue,
        setCartDiscountValue,
        cartDiscountReason,
        setCartDiscountReason,
        cartDiscountAmount,
        cartServiceChargeAmount,
        cartTaxAmount,
        cartGrandTotal,
        createOrUpdateOrder,
        loadOrderIntoCart,
        holdCurrentOrder,
        cancelOrder,
        activeEditingOrderId,
        moveTableOrder,
        mergeTableOrders,
        updateItemKitchenStatus,
        updateOrderKitchenStatus,
        settlePayment,
        refundPayment,
        addInventoryItem,
        updateInventoryStock,
        saveRecipe,
        updateSettings,
        resetDatabase,
        importDatabase,
        exportDatabase,
        toast,
        showToast,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
