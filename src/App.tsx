import React, { useState } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { AndroidSystemBar, AndroidSoftNav } from './components/android/AndroidSystemBar';
import { PinLoginModal } from './components/auth/PinLoginModal';
import { InitialSetupModal } from './components/auth/InitialSetupModal';
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { PosBillingScreen } from './components/pos/PosBillingScreen';
import { TableManagementScreen } from './components/tables/TableManagementScreen';
import { KitchenDisplayScreen } from './components/kitchen/KitchenDisplayScreen';
import { OrderHistoryScreen } from './components/orders/OrderHistoryScreen';
import { MenuManagementScreen } from './components/menu/MenuManagementScreen';
import { InventoryScreen } from './components/inventory/InventoryScreen';
import { StaffManagementScreen } from './components/staff/StaffManagementScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { PaymentModal } from './components/billing/PaymentModal';
import { ReceiptModal } from './components/billing/ReceiptModal';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { Order, Payment, RolePermissions } from './types/pos';
import {
  LayoutDashboard,
  UtensilsCrossed,
  LayoutGrid,
  ChefHat,
  History,
  Boxes,
  Users,
  FileText,
  Settings,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  CreditCard,
  Tablet,
  Smartphone,
  Lock,
  ShieldAlert,
} from 'lucide-react';

type ScreenTab =
  | 'dashboard'
  | 'pos'
  | 'tables'
  | 'kitchen'
  | 'history'
  | 'menu'
  | 'inventory'
  | 'staff'
  | 'reports'
  | 'settings';

function MainApp() {
  const {
    deviceMode,
    orders,
    payments,
    activeEditingOrderId,
    toast,
    settings,
    currentUser,
    checkPermission,
    logoutOrLock,
  } = usePOS();

  const [currentTab, setCurrentTab] = useState<ScreenTab>('pos');
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<Payment | undefined>(undefined);

  // Active tickets count for KDS badge
  const activeKitchenCount = orders.filter(
    (o) => o.status === 'active' || o.status === 'preparing'
  ).length;

  const handleOpenPayment = () => {
    // Determine target order to pay
    const targetOrder = orders.find((o) => o.id === activeEditingOrderId) || orders[0];
    if (targetOrder) {
      setActivePaymentOrder(targetOrder);
    }
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setActivePaymentOrder(null);
    const payment = payments.find((p) => p.id === paymentId);
    if (payment) {
      const order = orders.find((o) => o.id === payment.orderId);
      if (order) {
        setActiveReceiptOrder(order);
        setActiveReceiptPayment(payment);
      }
    }
  };

  const handleOpenReceipt = (order: Order, payment?: Payment) => {
    setActiveReceiptOrder(order);
    setActiveReceiptPayment(payment);
  };

  const navItems: {
    id: ScreenTab;
    label: string;
    icon: any;
    badge?: number;
    permission: keyof RolePermissions;
  }[] = [
    { id: 'pos', label: 'POS Billing', icon: UtensilsCrossed, permission: 'canAccessPOS' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'canAccessDashboard' },
    { id: 'tables', label: 'Tables', icon: LayoutGrid, permission: 'canAccessTables' },
    {
      id: 'kitchen',
      label: 'Kitchen (KDS)',
      icon: ChefHat,
      badge: activeKitchenCount > 0 ? activeKitchenCount : undefined,
      permission: 'canAccessKDS',
    },
    { id: 'history', label: 'Orders Ledger', icon: History, permission: 'canAccessPOS' },
    { id: 'menu', label: 'Menu Dishes', icon: UtensilsCrossed, permission: 'canAccessMenu' },
    { id: 'inventory', label: 'Inventory', icon: Boxes, permission: 'canAccessInventory' },
    { id: 'reports', label: 'Reports', icon: FileText, permission: 'canAccessReports' },
    { id: 'staff', label: 'Staff & Roles', icon: Users, permission: 'canAccessStaff' },
    { id: 'settings', label: 'Settings', icon: Settings, permission: 'canAccessSettings' },
  ];

  const currentItem = navItems.find((n) => n.id === currentTab);
  const isTabAllowed = currentItem ? checkPermission(currentItem.permission) : true;

  return (
    <div
      className={`h-screen w-screen bg-slate-950 flex flex-col justify-center items-center overflow-hidden transition-all ${
        deviceMode === 'tablet'
          ? 'p-2 sm:p-4 bg-slate-900/40'
          : deviceMode === 'phone'
          ? 'p-2 sm:p-4 bg-slate-900/40'
          : 'p-0'
      }`}
    >
      {/* Device Frame Simulation */}
      <div
        className={`w-full h-full flex flex-col bg-slate-950 overflow-hidden relative shadow-2xl transition-all duration-300 ${
          deviceMode === 'tablet'
            ? 'max-w-[1400px] max-h-[920px] rounded-3xl border-4 border-slate-800'
            : deviceMode === 'phone'
            ? 'max-w-[440px] max-h-[880px] rounded-[40px] border-8 border-slate-800'
            : 'rounded-none border-0'
        }`}
      >
        {/* Android Top System Bar */}
        <AndroidSystemBar />

        {/* Global Toast Notification */}
        {toast && (
          <div
            className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md animate-in slide-in-from-top-3 duration-200 select-none ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-300 shadow-rose-950/50'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Main POS Application Body (Sidebar Navigation + Screen Content) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tablet / Desktop Left Navigation Drawer */}
          <nav
            className={`bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between py-3 shrink-0 select-none z-20 ${
              deviceMode === 'phone' ? 'hidden' : 'w-16 xl:w-56 px-2'
            }`}
          >
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const hasPermission = checkPermission(item.permission);

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all relative group ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 font-bold'
                        : hasPermission
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        : 'text-slate-600 hover:text-slate-400 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="hidden xl:inline truncate">{item.label}</span>

                    {/* Lock indicator if restricted */}
                    {!hasPermission && (
                      <Lock className="w-3 h-3 text-slate-500 ml-auto hidden xl:block" />
                    )}

                    {/* Notification badge */}
                    {item.badge !== undefined && (
                      <span className="ml-auto hidden xl:flex h-5 w-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black items-center justify-center font-mono">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for collapsed view */}
                    <span className="xl:hidden absolute left-full ml-2 px-2 py-1 rounded-md bg-slate-800 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition shadow">
                      {item.label} {!hasPermission && '(Locked)'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom PWA Install trigger */}
            <div className="pt-2 border-t border-slate-800/80 hidden xl:block">
              <PWAInstallButton />
            </div>
          </nav>

          {/* Active Screen Area with Permission Guard */}
          <main className="flex-1 overflow-hidden bg-slate-950 flex flex-col">
            {!isTabAllowed ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-white">Access Restricted</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  The <strong>{currentItem?.label}</strong> screen requires higher administrative
                  privileges. Current active user is <strong>{currentUser?.name}</strong> (
                  <span className="uppercase font-mono text-emerald-400 font-bold">
                    {currentUser?.role}
                  </span>
                  ).
                </p>
                <button
                  onClick={logoutOrLock}
                  className="mt-5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  <span>Switch Staff or Unlock with Manager PIN</span>
                </button>
              </div>
            ) : (
              <>
                {currentTab === 'dashboard' && (
                  <DashboardScreen onNavigate={(screen) => setCurrentTab(screen as ScreenTab)} />
                )}
                {currentTab === 'pos' && <PosBillingScreen onOpenPayment={handleOpenPayment} />}
                {currentTab === 'tables' && (
                  <TableManagementScreen
                    onNavigateToPOS={() => setCurrentTab('pos')}
                    onOpenPaymentForOrder={(orderId) => {
                      const target = orders.find((o) => o.id === orderId);
                      if (target) setActivePaymentOrder(target);
                    }}
                  />
                )}
                {currentTab === 'kitchen' && <KitchenDisplayScreen />}
                {currentTab === 'history' && (
                  <OrderHistoryScreen onOpenReceipt={handleOpenReceipt} />
                )}
                {currentTab === 'menu' && <MenuManagementScreen />}
                {currentTab === 'inventory' && <InventoryScreen />}
                {currentTab === 'staff' && <StaffManagementScreen />}
                {currentTab === 'reports' && <ReportsScreen />}
                {currentTab === 'settings' && <SettingsScreen />}
              </>
            )}
          </main>
        </div>

        {/* Mobile Phone Bottom Navigation Bar */}
        {deviceMode === 'phone' && (
          <div className="bg-slate-900 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around text-[10px] select-none z-20">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition ${
                    isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate max-w-[50px]">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Android Bottom Soft Navigation Bar (Back, Home, Overview) */}
        <AndroidSoftNav
          onBack={() => {
            if (currentTab !== 'pos') setCurrentTab('pos');
          }}
          onHome={() => setCurrentTab('dashboard')}
        />
      </div>

      {/* Security PIN Login & Lock Modal */}
      <PinLoginModal />

      {/* Initial Admin & Security Setup Modal */}
      <InitialSetupModal />

      {/* Payment Settlement Modal */}
      {activePaymentOrder && (
        <PaymentModal
          order={activePaymentOrder}
          onClose={() => setActivePaymentOrder(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Thermal Receipt Preview & Printing Modal */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          payment={activeReceiptPayment}
          onClose={() => {
            setActiveReceiptOrder(null);
            setActiveReceiptPayment(undefined);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <POSProvider>
      <MainApp />
    </POSProvider>
  );
}
