import React, { useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Percent,
  Banknote,
  UtensilsCrossed,
  ChefHat,
  LayoutGrid,
  FileText,
  AlertTriangle,
  ArrowRight,
  Flame,
  PlusCircle,
} from 'lucide-react';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const { orders, payments, menuItems, inventory, settings } = usePOS();

  // Metrics calculation
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayOrders = useMemo(() => {
    return orders.filter((o) => o.createdAt >= todayStart);
  }, [orders, todayStart]);

  const todayCompletedOrders = useMemo(() => {
    return todayOrders.filter((o) => o.status === 'completed');
  }, [todayOrders]);

  const todayPendingOrders = useMemo(() => {
    return todayOrders.filter(
      (o) => o.status === 'active' || o.status === 'preparing' || o.status === 'ready' || o.status === 'held'
    );
  }, [todayOrders]);

  const todayTotalSales = useMemo(() => {
    return todayCompletedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  }, [todayCompletedOrders]);

  const todayTotalDiscounts = useMemo(() => {
    return todayCompletedOrders.reduce((sum, o) => sum + o.discountAmount, 0);
  }, [todayCompletedOrders]);

  // Estimated profit: Revenue minus cost of goods sold (COGS)
  const todayEstimatedProfit = useMemo(() => {
    let totalCogs = 0;
    for (const order of todayCompletedOrders) {
      for (const item of order.items) {
        totalCogs += (item.costPrice || 0) * item.quantity;
      }
    }
    const netRevenue = todayCompletedOrders.reduce((sum, o) => sum + o.subtotal - o.discountAmount, 0);
    return Math.max(0, netRevenue - totalCogs);
  }, [todayCompletedOrders]);

  // Popular Menu Items (Top 5)
  const topItems = useMemo(() => {
    const itemMap = new Map<string, { name: string; count: number; revenue: number; foodType: string }>();

    for (const order of orders.filter((o) => o.status === 'completed')) {
      for (const it of order.items) {
        const prev = itemMap.get(it.name) || {
          name: it.name,
          count: 0,
          revenue: 0,
          foodType: it.foodType,
        };
        prev.count += it.quantity;
        prev.revenue += it.unitPrice * it.quantity;
        itemMap.set(it.name, prev);
      }
    }

    return Array.from(itemMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  // Low stock inventory items
  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.currentStock <= item.minThreshold);
  }, [inventory]);

  // Weekly Sales Trend (Last 7 days data)
  const weeklyData = useMemo(() => {
    const days: { label: string; amount: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
      const endOfDay = startOfDay + 86400000;

      const dayTotal = payments
        .filter((p) => !p.isRefunded && p.createdAt >= startOfDay && p.createdAt < endOfDay)
        .reduce((sum, p) => sum + p.amount, 0);

      days.push({
        label: i === 0 ? 'Today' : dayNames[targetDate.getDay()],
        amount: dayTotal,
      });
    }
    return days;
  }, [payments]);

  const maxWeekly = Math.max(...weeklyData.map((d) => d.amount), 2000);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-full pb-20">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{settings.restaurantName}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Operations & Financial Overview | Currency: {settings.currencySymbol}
          </p>
        </div>

        {/* Quick Action Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/40 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Order</span>
          </button>
          <button
            onClick={() => onNavigate('tables')}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
          >
            <LayoutGrid className="w-4 h-4 text-emerald-400" />
            <span>Tables</span>
          </button>
          <button
            onClick={() => onNavigate('kitchen')}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
          >
            <ChefHat className="w-4 h-4 text-amber-400" />
            <span>Kitchen (KDS)</span>
          </button>
          <button
            onClick={() => onNavigate('menu')}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
          >
            <UtensilsCrossed className="w-4 h-4 text-blue-400" />
            <span>Menu</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between text-amber-300">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Low stock alert on <strong>{lowStockItems.length} ingredients</strong>:{' '}
              {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
            </span>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-200 underline whitespace-nowrap ml-3"
          >
            Restock Now &rarr;
          </button>
        </div>
      )}

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Today's Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
              {settings.currencySymbol} {todayTotalSales.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Real settled revenue</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {todayOrders.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Placed today</p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Orders</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">
              {todayPendingOrders.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">In kitchen / unpaid</p>
          </div>
        </div>

        {/* Completed Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">
              {todayCompletedOrders.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Settled & served</p>
          </div>
        </div>

        {/* Total Discounts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Discounts Given</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
              {settings.currencySymbol} {todayTotalDiscounts.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Authorized reductions</p>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Estimated Profit</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400">
              {settings.currencySymbol} {todayEstimatedProfit.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Based on recipe costs</p>
          </div>
        </div>
      </div>

      {/* Middle Row: Sales Chart & Popular Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Sales Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                7-Day Sales Performance
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated daily revenue from settled payments
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
              Peak: {settings.currencySymbol} {maxWeekly.toLocaleString()}
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-48 flex items-end gap-3 sm:gap-6 pt-4 border-b border-slate-800 pb-2">
            {weeklyData.map((d, idx) => {
              const heightPercent = maxWeekly > 0 ? Math.max(12, (d.amount / maxWeekly) * 100) : 10;
              const isToday = idx === weeklyData.length - 1;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-400 group-hover:text-emerald-400 transition">
                    {d.amount > 0 ? `${settings.currencySymbol}${d.amount}` : '-'}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      isToday
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                        : 'bg-slate-700 group-hover:bg-slate-600'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium ${
                      isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Menu Items Leaderboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Popular Menu Items
              </h2>
              <button
                onClick={() => onNavigate('menu')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                View all &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.count} orders
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-emerald-400">
                      {settings.currencySymbol} {item.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {topItems.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-6">
                  Complete orders to view popular dishes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Live Kitchen & Pending Orders Quick Glance */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Active Floor Orders</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-semibold">
              {todayPendingOrders.length} In Progress
            </span>
          </div>
          <button
            onClick={() => onNavigate('kitchen')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Open Kitchen Display (KDS) &rarr;
          </button>
        </div>

        {todayPendingOrders.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No active pending orders right now. Ready for new customers!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayPendingOrders.slice(0, 6).map((ord) => (
              <div
                key={ord.id}
                onClick={() => onNavigate('pos')}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {ord.orderNumber}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-800 text-slate-300">
                      {ord.orderType === 'dine-in' ? ord.tableName || 'Dine-In' : ord.orderType}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      ord.status === 'preparing'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : ord.status === 'ready'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1 mb-2">
                  {ord.items.slice(0, 3).map((it, i) => (
                    <div key={i} className="flex justify-between text-[11px]">
                      <span>
                        {it.quantity}x {it.name}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {settings.currencySymbol} {it.unitPrice * it.quantity}
                      </span>
                    </div>
                  ))}
                  {ord.items.length > 3 && (
                    <p className="text-[10px] text-slate-500 italic">
                      +{ord.items.length - 3} more items...
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">Total:</span>
                  <span className="font-mono font-bold text-white">
                    {settings.currencySymbol} {ord.grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
