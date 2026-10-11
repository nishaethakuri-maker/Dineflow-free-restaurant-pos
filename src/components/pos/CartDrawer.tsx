import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { ManagerAuthorizationModal } from '../auth/ManagerAuthorizationModal';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Percent,
  Clock,
  Send,
  CreditCard,
  X,
  FileEdit,
  UtensilsCrossed,
  User,
  Phone,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

interface CartDrawerProps {
  onOpenPayment: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenPayment }) => {
  const {
    cartItems,
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
    activeOrderType,
    setActiveOrderType,
    selectedTable,
    setSelectedTable,
    tables,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    createOrUpdateOrder,
    holdCurrentOrder,
    cancelOrder,
    activeEditingOrderId,
    orders,
    settings,
    checkPermission,
  } = usePOS();

  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [authModalDetails, setAuthModalDetails] = useState<{
    title: string;
    description: string;
    onAuthorized: () => void;
  } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [managerPin, setManagerPin] = useState<string>('');
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [tempNote, setTempNote] = useState<string>('');

  const activeOrder = orders.find((o) => o.id === activeEditingOrderId);

  // Available tables for Dine-in dropdown
  const availableTables = tables.filter((t) => t.status === 'available' || t.id === selectedTable?.id);

  const handleSaveKitchen = () => {
    createOrUpdateOrder();
  };

  const handlePayNow = () => {
    // If not yet saved as order, save it first, then open payment
    if (!activeEditingOrderId) {
      const saved = createOrUpdateOrder();
      if (!saved) return;
    }
    onOpenPayment();
  };

  const handleConfirmCancel = () => {
    if (!activeEditingOrderId) return;
    const ok = cancelOrder(activeEditingOrderId, cancelReason || 'Customer left', managerPin);
    if (ok) {
      setShowCancelModal(false);
      setCancelReason('');
      setManagerPin('');
      clearCart();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 shadow-2xl select-none">
      {/* Top Header: Order Type Tabs & Table Selector */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              {activeOrder ? `Order #${activeOrder.orderNumber}` : 'Current Order Cart'}
            </h2>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
              title="Clear Cart"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Order Type Segmented Controls */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveOrderType('dine-in')}
            className={`py-1.5 rounded-lg transition-all ${
              activeOrderType === 'dine-in'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dine-In
          </button>
          <button
            onClick={() => {
              setActiveOrderType('takeaway');
              setSelectedTable(null);
            }}
            className={`py-1.5 rounded-lg transition-all ${
              activeOrderType === 'takeaway'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Takeaway
          </button>
          <button
            onClick={() => {
              setActiveOrderType('delivery');
              setSelectedTable(null);
            }}
            className={`py-1.5 rounded-lg transition-all ${
              activeOrderType === 'delivery'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Delivery
          </button>
        </div>

        {/* Conditional Table Selector for Dine-in */}
        {activeOrderType === 'dine-in' ? (
          <div className="mt-3">
            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
              Assigned Table:
            </label>
            <div className="grid grid-cols-4 gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
              {tables.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                const isOccupied = t.status === 'occupied' && !isSelected;
                return (
                  <button
                    key={t.id}
                    disabled={isOccupied}
                    onClick={() => setSelectedTable(t)}
                    className={`py-1 px-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                        : isOccupied
                        ? 'bg-amber-950/40 border-amber-800/40 text-amber-500/60 cursor-not-allowed'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {t.tableNumber}
                  </button>
                );
              })}
            </div>
            {selectedTable && (
              <p className="text-[10px] text-emerald-400 mt-1">
                Selected: {selectedTable.tableNumber} ({selectedTable.section}, Cap: {selectedTable.capacity})
              </p>
            )}
          </div>
        ) : (
          /* Customer Info for Takeaway/Delivery */
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Phone (98...)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6">
            <UtensilsCrossed className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
            <p className="text-xs font-medium">Cart is empty</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-[200px]">
              Tap menu items from the left to start building an order
            </p>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div
              key={index}
              className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-2.5 flex flex-col gap-1.5 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white leading-snug">{item.name}</h4>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {settings.currencySymbol} {item.unitPrice} each
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-emerald-400">
                    {settings.currencySymbol} {item.unitPrice * item.quantity}
                  </div>
                  <button
                    onClick={() => removeCartItem(index)}
                    className="text-slate-500 hover:text-rose-400 transition p-0.5 ml-auto mt-0.5"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cooking note tag or add note */}
              {item.notes ? (
                <div
                  onClick={() => {
                    setEditingNoteIndex(index);
                    setTempNote(item.notes || '');
                  }}
                  className="bg-amber-950/40 border border-amber-900/40 text-amber-300 text-[10px] px-2 py-0.5 rounded-md flex items-center justify-between cursor-pointer hover:bg-amber-950/60 transition"
                >
                  <span className="truncate italic">Note: "{item.notes}"</span>
                  <FileEdit className="w-2.5 h-2.5 ml-1 shrink-0" />
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingNoteIndex(index);
                    setTempNote('');
                  }}
                  className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 w-fit transition"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Add cooking note</span>
                </button>
              )}

              {/* Quantity Selector Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-500 font-mono">Qty</span>
                <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => updateCartItemQty(index, -1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition active:scale-90"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-xs text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartItemQty(index, 1)}
                    className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition active:scale-90"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Financial Calculations Footer */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-2">
        {/* Subtotal */}
        <div className="flex justify-between text-xs text-slate-400">
          <span>Subtotal</span>
          <span className="font-mono text-slate-200">
            {settings.currencySymbol} {cartSubtotal.toLocaleString()}
          </span>
        </div>

        {/* Discount Row */}
        <div className="flex items-center justify-between text-xs">
          <button
            onClick={() => {
              if (checkPermission('canApplyDiscount')) {
                setShowDiscountModal(true);
              } else {
                setAuthModalDetails({
                  title: 'Apply Discount Authorization',
                  description: 'Applying manual discounts requires Manager or Owner approval',
                  onAuthorized: () => setShowDiscountModal(true),
                });
              }
            }}
            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
          >
            <Percent className="w-3 h-3" />
            <span>
              {cartDiscountAmount > 0
                ? `Discount (${cartDiscountType === 'percentage' ? `${cartDiscountValue}%` : 'Fixed'})`
                : 'Apply Discount'}
            </span>
          </button>
          <span className="font-mono text-rose-400 font-medium">
            {cartDiscountAmount > 0
              ? `-${settings.currencySymbol} ${cartDiscountAmount.toLocaleString()}`
              : 'Rs. 0'}
          </span>
        </div>

        {/* Service Charge (if configured) */}
        {settings.enableServiceCharge && settings.serviceChargeRate > 0 && (
          <div className="flex justify-between text-xs text-slate-400">
            <span>Service Charge ({(settings.serviceChargeRate * 100).toFixed(0)}%)</span>
            <span className="font-mono text-slate-200">
              {settings.currencySymbol} {cartServiceChargeAmount.toLocaleString()}
            </span>
          </div>
        )}

        {/* VAT (if configured) */}
        {settings.enableVat && settings.vatRate > 0 && (
          <div className="flex justify-between text-xs text-slate-400">
            <span>VAT ({(settings.vatRate * 100).toFixed(0)}%)</span>
            <span className="font-mono text-slate-200">
              {settings.currencySymbol} {cartTaxAmount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Grand Total */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
          <span className="text-sm font-bold text-white uppercase tracking-wider">Grand Total</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            {settings.currencySymbol} {cartGrandTotal.toLocaleString()}
          </span>
        </div>

        {/* POS Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          {/* Hold / Park Order */}
          <button
            onClick={holdCurrentOrder}
            disabled={cartItems.length === 0}
            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Hold Order</span>
          </button>

          {/* Send to Kitchen (KOT) */}
          <button
            onClick={handleSaveKitchen}
            disabled={cartItems.length === 0}
            className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-blue-950/40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to KOT</span>
          </button>
        </div>

        {/* Pay & Settle / Bill Button (Primary Action) */}
        <button
          onClick={handlePayNow}
          disabled={cartItems.length === 0}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] shadow-lg shadow-emerald-950/50"
        >
          <CreditCard className="w-4 h-4" />
          <span>Pay & Settle Bill</span>
        </button>

        {/* Cancel Order option if modifying an existing order */}
        {activeEditingOrderId && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full py-1.5 text-[11px] text-rose-400 hover:text-rose-300 font-medium transition"
          >
            Cancel Order #{activeOrder?.orderNumber} &rarr;
          </button>
        )}
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm text-white shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                Apply Authorized Discount
              </h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setCartDiscountType('percentage')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border ${
                    cartDiscountType === 'percentage'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => setCartDiscountType('fixed')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border ${
                    cartDiscountType === 'fixed'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  Fixed (NPR)
                </button>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Discount Value ({cartDiscountType === 'percentage' ? '%' : 'NPR'})
                </label>
                <input
                  type="number"
                  min="0"
                  max={cartDiscountType === 'percentage' ? '100' : cartSubtotal}
                  value={cartDiscountValue || ''}
                  onChange={(e) => setCartDiscountValue(Number(e.target.value))}
                  placeholder="e.g. 10"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Discount Reason / Authorization
                </label>
                <input
                  type="text"
                  value={cartDiscountReason}
                  onChange={(e) => setCartDiscountReason(e.target.value)}
                  placeholder="e.g. Regular VIP Customer / Staff Meal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setCartDiscountValue(0);
                    setCartDiscountReason('');
                    setShowDiscountModal(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Remove
                </button>
                <button
                  onClick={() => setShowDiscountModal(false)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cooking Note Edit Modal */}
      {editingNoteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-sm text-white shadow-2xl">
            <h4 className="text-xs font-bold mb-2">Cooking Instructions</h4>
            <textarea
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              placeholder="e.g., Extra spicy jhol, separate achar, no onions"
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 mb-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditingNoteIndex(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateCartItemNotes(editingNoteIndex, tempNote);
                  setEditingNoteIndex(null);
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-white shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 mb-3">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-sm font-bold">Cancel Order #{activeOrder?.orderNumber}</h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Cancelling an active order requires manager PIN authorization and a recorded reason.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cancellation Reason:</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer cancelled / Wait time too long"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Manager PIN (Owner/Manager):
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (e.g. 5678)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-center tracking-widest font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Manager Inline Authorization Modal */}
      {authModalDetails && (
        <ManagerAuthorizationModal
          actionTitle={authModalDetails.title}
          actionDescription={authModalDetails.description}
          onAuthorized={() => {
            const cb = authModalDetails.onAuthorized;
            setAuthModalDetails(null);
            cb();
          }}
          onCancel={() => setAuthModalDetails(null)}
        />
      )}
    </div>
  );
};
