import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Percent,
  Banknote,
  DollarSign,
  PieChart,
  ShoppingBag,
  Printer,
  ChevronDown,
} from 'lucide-react';

export const ReportsScreen: React.FC = () => {
  const { orders, payments, menuItems, settings, showToast } = usePOS();

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  // Filter timestamps
  const filterStart = useMemo(() => {
    const now = new Date();
    if (dateRange === 'today') {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d.getTime();
    }
    if (dateRange === 'week') {
      return now.getTime() - 7 * 86400000;
    }
    if (dateRange === 'month') {
      return now.getTime() - 30 * 86400000;
    }
    return 0; // All time
  }, [dateRange]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => o.createdAt >= filterStart);
  }, [orders, filterStart]);

  const completedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'completed');
  }, [filteredOrders]);

  const cancelledOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status === 'cancelled');
  }, [filteredOrders]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => p.createdAt >= filterStart);
  }, [payments, filterStart]);

  // Aggregated KPIs
  const totalRevenue = useMemo(() => {
    return completedOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  }, [completedOrders]);

  const totalDiscounts = useMemo(() => {
    return completedOrders.reduce((acc, o) => acc + o.discountAmount, 0);
  }, [completedOrders]);

  const totalServiceCharge = useMemo(() => {
    return completedOrders.reduce((acc, o) => acc + o.serviceChargeAmount, 0);
  }, [completedOrders]);

  const totalVat = useMemo(() => {
    return completedOrders.reduce((acc, o) => acc + o.taxAmount, 0);
  }, [completedOrders]);

  const totalProfit = useMemo(() => {
    let cogs = 0;
    for (const order of completedOrders) {
      for (const item of order.items) {
        cogs += (item.costPrice || 0) * item.quantity;
      }
    }
    const netSubtotal = completedOrders.reduce(
      (acc, o) => acc + o.subtotal - o.discountAmount,
      0
    );
    return Math.max(0, netSubtotal - cogs);
  }, [completedOrders]);

  // Payment methods breakdown
  const paymentMethodSummary = useMemo(() => {
    const map = {
      cash: 0,
      esewa: 0,
      khalti: 0,
      card: 0,
      split: 0,
    };
    for (const p of filteredPayments) {
      if (!p.isRefunded) {
        map[p.method] = (map[p.method] || 0) + p.amount;
      }
    }
    return map;
  }, [filteredPayments]);

  // Sales by Category
  const categorySales = useMemo(() => {
    const catMap = new Map<string, { count: number; total: number }>();
    for (const o of completedOrders) {
      for (const it of o.items) {
        const menuItem = menuItems.find((m) => m.id === it.menuItemId);
        const catName = menuItem?.categoryId || 'General';
        const prev = catMap.get(catName) || { count: 0, total: 0 };
        prev.count += it.quantity;
        prev.total += it.unitPrice * it.quantity;
        catMap.set(catName, prev);
      }
    }
    return Array.from(catMap.entries());
  }, [completedOrders, menuItems]);

  // Export CSV function
  const handleExportCSV = () => {
    const headers = [
      'Order Number',
      'Date',
      'Type',
      'Table',
      'Subtotal',
      'Discount',
      'Service Charge',
      'VAT',
      'Grand Total',
      'Status',
    ];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toISOString(),
      o.orderType,
      o.tableName || 'N/A',
      o.subtotal,
      o.discountAmount,
      o.serviceChargeAmount,
      o.taxAmount,
      o.grandTotal,
      o.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DineFlow_Sales_Report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sales report exported to CSV', 'success');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-full pb-20 select-none">
      {/* Title & Date Range Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            <span>Financial Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-grade sales summaries, VAT & service charge ledger, and profit margins
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range filters */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['today', 'week', 'month', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  dateRange === r ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
                }`}
              >
                {r === 'week' ? 'Last 7 Days' : r === 'month' ? 'This Month' : r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-800 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">Gross Revenue</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">
            {settings.currencySymbol} {totalRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            {completedOrders.length} completed orders
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">Estimated Profit</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-indigo-400 mt-1">
            {settings.currencySymbol} {totalProfit.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Gross margin approx. {totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0}%
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">VAT (13%) Collected</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-200 mt-1">
            {settings.currencySymbol} {Math.round(totalVat).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            IRD tax liability
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">Service Charge (10%)</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-200 mt-1">
            {settings.currencySymbol} {Math.round(totalServiceCharge).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Staff pool reserve
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-xs text-slate-400 font-medium">Total Discounts</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-400 mt-1">
            {settings.currencySymbol} {Math.round(totalDiscounts).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            Authorized reductions
          </span>
        </div>
      </div>

      {/* Payment Methods Breakdown & Cancelled Orders Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>Payment Channels Breakdown</span>
          </h2>

          <div className="space-y-3">
            {Object.entries(paymentMethodSummary).map(([method, amount]) => {
              const share = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
              return (
                <div key={method} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="uppercase text-slate-300 font-mono">{method}</span>
                    <span className="text-white font-mono">
                      {settings.currencySymbol} {amount.toLocaleString()} ({share.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, share)}%` }}
                      className={`h-full rounded-full ${
                        method === 'cash'
                          ? 'bg-emerald-500'
                          : method === 'esewa'
                          ? 'bg-green-400'
                          : method === 'khalti'
                          ? 'bg-purple-500'
                          : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cancelled & Voided Audit Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <span>Cancelled Orders & Wastage Control</span>
            </h2>

            {cancelledOrders.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                0 cancelled orders in selected period. Excellent floor efficiency!
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cancelledOrders.map((cord) => (
                  <div
                    key={cord.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-mono font-bold text-rose-400">
                        {cord.orderNumber}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Reason: {cord.cancellationReason || 'No reason specified'}
                      </p>
                    </div>
                    <span className="font-mono text-slate-400">
                      {settings.currencySymbol} {cord.grandTotal}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Manager PIN authorization required for every order cancellation.
          </div>
        </div>
      </div>

      {/* Orders Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <h3 className="text-sm font-bold text-white">Itemized Transactions Ledger</h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredOrders.length} records found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Order #</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Type / Table</th>
                <th className="p-3.5">Items</th>
                <th className="p-3.5 text-right">Subtotal</th>
                <th className="p-3.5 text-right">Discount</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300 font-sans">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-850/40 transition">
                  <td className="p-3.5 font-mono font-bold text-emerald-400">{o.orderNumber}</td>
                  <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                    {new Date(o.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-white">
                      {o.orderType === 'dine-in' ? o.tableName || 'Dine-In' : o.orderType}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400 truncate max-w-xs">
                    {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </td>
                  <td className="p-3.5 text-right font-mono">
                    {settings.currencySymbol} {o.subtotal}
                  </td>
                  <td className="p-3.5 text-right font-mono text-rose-400">
                    {o.discountAmount > 0 ? `-${settings.currencySymbol}${o.discountAmount}` : '-'}
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-white">
                    {settings.currencySymbol} {o.grandTotal}
                  </td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        o.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : o.status === 'cancelled'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
