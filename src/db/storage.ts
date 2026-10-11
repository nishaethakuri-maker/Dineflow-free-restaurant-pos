/**
 * DineFlow POS - Offline Storage Engine
 * Room Database equivalent for Android / Web runtime
 * Provides atomic operations, integer minor-unit money handling,
 * and reliable offline data persistence.
 */

import {
  AuditLog,
  Category,
  InventoryItem,
  MenuItem,
  Order,
  OrderStatus,
  Payment,
  Recipe,
  RestaurantSettings,
  RestaurantTable,
  StockMovement,
  User,
} from '../types/pos';
import {
  INITIAL_CATEGORIES,
  INITIAL_INVENTORY,
  INITIAL_MENU_ITEMS,
  INITIAL_RECIPES,
  INITIAL_SETTINGS,
  INITIAL_TABLES,
  INITIAL_USERS,
  SEED_AUDIT_LOGS,
  SEED_COMPLETED_ORDERS,
  SEED_PAYMENTS,
} from './sampleData';

const DB_KEYS = {
  USERS: 'dineflow_users_v1',
  CATEGORIES: 'dineflow_categories_v1',
  MENU_ITEMS: 'dineflow_menu_items_v1',
  TABLES: 'dineflow_tables_v1',
  ORDERS: 'dineflow_orders_v1',
  PAYMENTS: 'dineflow_payments_v1',
  INVENTORY: 'dineflow_inventory_v1',
  RECIPES: 'dineflow_recipes_v1',
  STOCK_MOVEMENTS: 'dineflow_stock_movements_v1',
  AUDIT_LOGS: 'dineflow_audit_logs_v1',
  SETTINGS: 'dineflow_settings_v1',
  NEXT_ORDER_NUM: 'dineflow_next_ord_num',
  NEXT_BILL_NUM: 'dineflow_next_bill_num',
};

// Safe load from storage with seed fallback
function safeLoad<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load key: ${key}`, e);
    return fallback;
  }
}

// Safe save to storage
function safeSave<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save key: ${key}`, e);
  }
}

class PosStorage {
  // Initialize default data if fresh install
  public init(): void {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      this.resetToDefaults();
    }
  }

  public resetToDefaults(): void {
    safeSave(DB_KEYS.USERS, INITIAL_USERS);
    safeSave(DB_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    safeSave(DB_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
    safeSave(DB_KEYS.TABLES, INITIAL_TABLES);
    safeSave(DB_KEYS.ORDERS, SEED_COMPLETED_ORDERS);
    safeSave(DB_KEYS.PAYMENTS, SEED_PAYMENTS);
    safeSave(DB_KEYS.INVENTORY, INITIAL_INVENTORY);
    safeSave(DB_KEYS.RECIPES, INITIAL_RECIPES);
    safeSave(DB_KEYS.STOCK_MOVEMENTS, []);
    safeSave(DB_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
    safeSave(DB_KEYS.SETTINGS, INITIAL_SETTINGS);
    safeSave(DB_KEYS.NEXT_ORDER_NUM, 1004);
    safeSave(DB_KEYS.NEXT_BILL_NUM, 4);
  }

  // --- Users ---
  public getUsers(): User[] {
    return safeLoad(DB_KEYS.USERS, INITIAL_USERS);
  }
  public saveUsers(users: User[]): void {
    safeSave(DB_KEYS.USERS, users);
  }

  // --- Categories ---
  public getCategories(): Category[] {
    return safeLoad(DB_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }
  public saveCategories(cats: Category[]): void {
    safeSave(DB_KEYS.CATEGORIES, cats);
  }

  // --- Menu Items ---
  public getMenuItems(): MenuItem[] {
    return safeLoad(DB_KEYS.MENU_ITEMS, INITIAL_MENU_ITEMS);
  }
  public saveMenuItems(items: MenuItem[]): void {
    safeSave(DB_KEYS.MENU_ITEMS, items);
  }

  // --- Tables ---
  public getTables(): RestaurantTable[] {
    return safeLoad(DB_KEYS.TABLES, INITIAL_TABLES);
  }
  public saveTables(tables: RestaurantTable[]): void {
    safeSave(DB_KEYS.TABLES, tables);
  }

  // --- Orders ---
  public getOrders(): Order[] {
    return safeLoad(DB_KEYS.ORDERS, SEED_COMPLETED_ORDERS);
  }
  public saveOrders(orders: Order[]): void {
    safeSave(DB_KEYS.ORDERS, orders);
  }

  public getNextOrderNumber(): string {
    const current = safeLoad<number>(DB_KEYS.NEXT_ORDER_NUM, 1004);
    safeSave(DB_KEYS.NEXT_ORDER_NUM, current + 1);
    return `ORD-${current}`;
  }

  public getNextBillNumber(): string {
    const current = safeLoad<number>(DB_KEYS.NEXT_BILL_NUM, 4);
    safeSave(DB_KEYS.NEXT_BILL_NUM, current + 1);
    const padded = String(current).padStart(4, '0');
    return `INV-2026-${padded}`;
  }

  // --- Payments ---
  public getPayments(): Payment[] {
    return safeLoad(DB_KEYS.PAYMENTS, SEED_PAYMENTS);
  }
  public savePayments(payments: Payment[]): void {
    safeSave(DB_KEYS.PAYMENTS, payments);
  }

  // --- Inventory ---
  public getInventory(): InventoryItem[] {
    return safeLoad(DB_KEYS.INVENTORY, INITIAL_INVENTORY);
  }
  public saveInventory(inv: InventoryItem[]): void {
    safeSave(DB_KEYS.INVENTORY, inv);
  }

  // --- Recipes ---
  public getRecipes(): Recipe[] {
    return safeLoad(DB_KEYS.RECIPES, INITIAL_RECIPES);
  }
  public saveRecipes(recipes: Recipe[]): void {
    safeSave(DB_KEYS.RECIPES, recipes);
  }

  // --- Stock Movements ---
  public getStockMovements(): StockMovement[] {
    return safeLoad(DB_KEYS.STOCK_MOVEMENTS, []);
  }
  public saveStockMovements(movements: StockMovement[]): void {
    safeSave(DB_KEYS.STOCK_MOVEMENTS, movements);
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return safeLoad(DB_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  }
  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
    };
    logs.unshift(newLog);
    // Keep last 500 audit logs
    safeSave(DB_KEYS.AUDIT_LOGS, logs.slice(0, 500));
  }

  // --- Settings ---
  public getSettings(): RestaurantSettings {
    const loaded = safeLoad<RestaurantSettings>(DB_KEYS.SETTINGS, INITIAL_SETTINGS);
    return {
      ...INITIAL_SETTINGS,
      ...loaded,
      permissions: {
        ...INITIAL_SETTINGS.permissions,
        ...(loaded.permissions || {}),
      },
    };
  }
  public saveSettings(settings: RestaurantSettings): void {
    safeSave(DB_KEYS.SETTINGS, settings);
  }

  // --- Deduct Recipe Inventory (Idempotent to prevent duplicate deductions) ---
  public deductInventoryForOrder(order: Order, performedBy: string): void {
    const inventory = this.getInventory();
    const recipes = this.getRecipes();
    const movements = this.getStockMovements();

    // Check if this order has already had ingredients deducted
    const alreadyDeducted = movements.some(
      (m) => m.referenceId === order.id && m.type === 'order_deduction'
    );
    if (alreadyDeducted) {
      return; // Prevent duplicate deductions
    }

    const invMap = new Map(inventory.map((item) => [item.id, item]));
    const newMovements: StockMovement[] = [];

    for (const item of order.items) {
      const recipe = recipes.find((r) => r.menuItemId === item.menuItemId);
      if (!recipe) continue;

      for (const ing of recipe.ingredients) {
        const invItem = invMap.get(ing.inventoryItemId);
        if (invItem) {
          const totalQty = Number((ing.quantityRequired * item.quantity).toFixed(3));
          invItem.currentStock = Math.max(0, Number((invItem.currentStock - totalQty).toFixed(3)));
          invItem.lastUpdated = Date.now();

          newMovements.push({
            id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            inventoryItemId: invItem.id,
            type: 'order_deduction',
            quantity: -totalQty,
            unitCost: invItem.costPerUnit,
            reason: `Served in Order #${order.orderNumber} (${item.quantity}x ${item.name})`,
            referenceId: order.id,
            createdAt: Date.now(),
            performedBy,
          });
        }
      }
    }

    if (newMovements.length > 0) {
      this.saveInventory(Array.from(invMap.values()));
      this.saveStockMovements([...newMovements, ...movements].slice(0, 1000));
    }
  }

  // --- Export Full Backup JSON ---
  public exportBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      users: this.getUsers(),
      categories: this.getCategories(),
      menuItems: this.getMenuItems(),
      tables: this.getTables(),
      orders: this.getOrders(),
      payments: this.getPayments(),
      inventory: this.getInventory(),
      recipes: this.getRecipes(),
      stockMovements: this.getStockMovements(),
      auditLogs: this.getAuditLogs(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  }

  // --- Restore Backup JSON ---
  public restoreBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data.users || !data.menuItems || !data.tables) {
        throw new Error('Invalid backup schema');
      }
      if (data.users) safeSave(DB_KEYS.USERS, data.users);
      if (data.categories) safeSave(DB_KEYS.CATEGORIES, data.categories);
      if (data.menuItems) safeSave(DB_KEYS.MENU_ITEMS, data.menuItems);
      if (data.tables) safeSave(DB_KEYS.TABLES, data.tables);
      if (data.orders) safeSave(DB_KEYS.ORDERS, data.orders);
      if (data.payments) safeSave(DB_KEYS.PAYMENTS, data.payments);
      if (data.inventory) safeSave(DB_KEYS.INVENTORY, data.inventory);
      if (data.recipes) safeSave(DB_KEYS.RECIPES, data.recipes);
      if (data.stockMovements) safeSave(DB_KEYS.STOCK_MOVEMENTS, data.stockMovements);
      if (data.auditLogs) safeSave(DB_KEYS.AUDIT_LOGS, data.auditLogs);
      if (data.settings) safeSave(DB_KEYS.SETTINGS, data.settings);
      return true;
    } catch (e) {
      console.error('Backup restore failed:', e);
      return false;
    }
  }
}

export const posDb = new PosStorage();
posDb.init();
