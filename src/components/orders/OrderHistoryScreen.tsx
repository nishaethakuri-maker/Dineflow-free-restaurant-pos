import React, { useState, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { Order, Payment } from '../../types/pos';
import {
  History,
  Search,
  Filter,
  Printer,
  RotateCcw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  ShieldAlert,
} from 'lucide-react';

interface OrderHistoryScreenProps {
  onOpenReceipt: (order: Order, payment?: Payment) => void;
}

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ onOpenReceipt }) => {
  const { orders, payments, refundPayment, settings, showToast } = usePOS();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'active' | 'cancelled'>('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Refund modal state
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [managerPin, setManagerPin] = useState<string>('');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) {
        if (statusFilter === 'active' && (o.status === 'preparing' || o.status === 'ready')) {
          // treat preparing/ready as active
        } else {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNum = o.orderNumber.toLowerCase().includes(q);
        const matchesCust = o.customerName?.toLowerCase().includes(q) || false;
        const matchesTable = o.tableName?.toLowerCase().includes(q) || false;
        return matchesNum || matchesCust || matchesTable;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const getOrderPayment = (order: Order) => {
    return payments.find((p) => p.orderId === order.id && !p.isRefunded) || undefined;
  };

  const handleExecuteRefund = () => {
    if (!refundOrderId) return;
    const payment = payments.find((p) => p.orderId === refundOrderId && !p.isRefunded);
    if (!payment) {
      showToast('No active payment found for this order.', 'error');
      return;
    }
    const ok = refundPayment(payment.id, refundReason || 'Customer requested refund', managerPin);
    if (ok) {
      setRefundOrderId(null);
      setRefundReason('');
      setManagerPin('');
      setViewingOrder(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-full pb-20 select-none">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            <span>Order History & Bills Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View completed and past transactions, reprint thermal receipts, and audit voids
          </p>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order number or customer..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(['all', 'completed', 'active', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition border ${
                statusFilter === st
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st} ({orders.filter((o) => (st === 'all' ? true : o.status === st)).length})
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Order #</th>
                <th className="p-4">Date / Time</th>
                <th className="p-4">Dining Type</th>
                <th className="p-4">Items Summary</th>
                <th className="p-4 text-right">Grand Total</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300 font-sans">
              {filteredOrders.map((order) => {
                const payment = getOrderPayment(order);

                return (
                  <tr key={order.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      {order.orderNumber}
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-white">
                        {order.orderType === 'dine-in' ? order.tableName || 'Dine-In' : order.orderType}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 max-w-xs truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-sm text-white">
                      {settings.currencySymbol} {order.grandTotal.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          order.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : order.status === 'cancelled'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenReceipt(order, payment)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                          title="Reprint Thermal Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-bold font-mono text-emerald-400">
                  {viewingOrder.orderNumber}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Placed {new Date(viewingOrder.createdAt).toLocaleString()} by{' '}
                  {viewingOrder.waiterName}
                </p>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  Itemized Order Breakdown:
                </span>
                {viewingOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <div>
                      <span className="font-medium text-white">
                        {it.quantity}x {it.name}
                      </span>
                      {it.notes && (
                        <p className="text-[10px] text-amber-300 italic">"{it.notes}"</p>
                      )}
                    </div>
                    <span className="font-mono text-slate-300">
                      {settings.currencySymbol} {it.unitPrice * it.quantity}
                    </span>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">Rs. {viewingOrder.subtotal}</span>
                  </div>
                  {viewingOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Discount ({viewingOrder.discountReason || 'Authorized'}):</span>
                      <span className="font-mono">-Rs. {viewingOrder.discountAmount}</span>
                    </div>
                  )}
                  {viewingOrder.serviceChargeAmount > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Service Charge (10%):</span>
                      <span className="font-mono">Rs. {viewingOrder.serviceChargeAmount}</span>
                    </div>
                  )}
                  {viewingOrder.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>VAT (13%):</span>
                      <span className="font-mono">Rs. {viewingOrder.taxAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-800 text-white">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-400">
                      Rs. {viewingOrder.grandTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const payment = getOrderPayment(viewingOrder);
                  onOpenReceipt(viewingOrder, payment);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Receipt</span>
              </button>

              {viewingOrder.status === 'completed' && (
                <button
                  onClick={() => {
                    setRefundOrderId(viewingOrder.id);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Refund / Void</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 mb-3">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-sm font-bold">Manager Authorized Refund</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Voiding and refunding a completed bill requires a recorded reason and Manager PIN.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Refund Reason:</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Wrong bill settled / Customer returned food"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Manager PIN (5678):</label>
                <input
                  type="password"
                  maxLength={4}
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  placeholder="Enter Manager PIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-center font-mono font-bold tracking-widest text-rose-400"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRefundOrderId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRefund}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
