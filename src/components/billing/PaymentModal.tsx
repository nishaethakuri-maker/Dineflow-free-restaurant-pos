import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Order, PaymentMethod, PaymentSplitDetail } from '../../types/pos';
import {
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  Printer,
  ArrowRight,
} from 'lucide-react';

interface PaymentModalProps {
  order: Order;
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  onClose,
  onPaymentSuccess,
}) => {
  const { settlePayment, settings } = usePOS();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderedCash, setTenderedCash] = useState<number>(order.grandTotal);
  const [qrProvider, setQrProvider] = useState<'esewa' | 'khalti' | 'fonepay'>('esewa');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [cardTerminalRef, setCardTerminalRef] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Split payment state
  const [splitCashAmount, setSplitCashAmount] = useState<number>(
    Math.round(order.grandTotal / 2)
  );
  const [splitOnlineAmount, setSplitOnlineAmount] = useState<number>(
    order.grandTotal - Math.round(order.grandTotal / 2)
  );
  const [splitOnlineRef, setSplitOnlineRef] = useState<string>('');

  // Quick tender buttons for Cash in Nepal (Rs. 100, 500, 1000, 2000 notes)
  const quickTenders = [
    order.grandTotal,
    Math.ceil(order.grandTotal / 100) * 100,
    Math.ceil(order.grandTotal / 500) * 500,
    Math.ceil(order.grandTotal / 1000) * 1000,
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && v >= order.grandTotal);

  const changeDue = Math.max(0, (tenderedCash || 0) - order.grandTotal);

  const handleSettle = () => {
    setErrorMsg('');

    if (paymentMethod === 'cash') {
      if (tenderedCash < order.grandTotal) {
        setErrorMsg(
          `Tendered amount (${settings.currencySymbol} ${tenderedCash}) cannot be less than Grand Total (${settings.currencySymbol} ${order.grandTotal}).`
        );
        return;
      }
      const res = settlePayment({
        orderId: order.id,
        method: 'cash',
        tenderedCash,
      });
      if (res.success && res.payment) {
        onPaymentSuccess(res.payment.id);
      } else {
        setErrorMsg(res.message || 'Payment settlement failed.');
      }
    } else if (paymentMethod === 'esewa' || paymentMethod === 'khalti') {
      // STRICT VERIFICATION CHECK: Prompt requirement
      if (!transactionRef || transactionRef.trim().length < 4) {
        setErrorMsg(
          `A verified Transaction / Reference ID is required to confirm ${paymentMethod.toUpperCase()} payment.`
        );
        return;
      }
      const res = settlePayment({
        orderId: order.id,
        method: paymentMethod,
        transactionRef: transactionRef.trim(),
      });
      if (res.success && res.payment) {
        onPaymentSuccess(res.payment.id);
      } else {
        setErrorMsg(res.message || 'Payment settlement failed.');
      }
    } else if (paymentMethod === 'card') {
      if (!cardTerminalRef) {
        setErrorMsg('Please enter POS terminal approval / reference code.');
        return;
      }
      const res = settlePayment({
        orderId: order.id,
        method: 'card',
        transactionRef: cardTerminalRef.trim(),
      });
      if (res.success && res.payment) {
        onPaymentSuccess(res.payment.id);
      } else {
        setErrorMsg(res.message || 'Payment settlement failed.');
      }
    } else if (paymentMethod === 'split') {
      if (splitCashAmount + splitOnlineAmount !== order.grandTotal) {
        setErrorMsg('Split amounts must sum exactly to the Grand Total.');
        return;
      }
      if (!splitOnlineRef) {
        setErrorMsg('Transaction Ref required for the digital split portion.');
        return;
      }
      const splitDetails: PaymentSplitDetail[] = [
        { method: 'cash', amount: splitCashAmount },
        { method: 'esewa', amount: splitOnlineAmount, referenceNumber: splitOnlineRef },
      ];
      const res = settlePayment({
        orderId: order.id,
        method: 'split',
        tenderedCash: splitCashAmount,
        splitDetails,
      });
      if (res.success && res.payment) {
        onPaymentSuccess(res.payment.id);
      } else {
        setErrorMsg(res.message || 'Split payment settlement failed.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl text-white shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Billing & Settlement</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {order.orderNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {order.orderType === 'dine-in' ? `Table: ${order.tableName}` : order.orderType.toUpperCase()} &bull;{' '}
              {order.items.length} items
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount to Pay Banner */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider block">
              Total Amount Payable
            </span>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {settings.currencySymbol} {order.grandTotal.toLocaleString()}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono space-y-0.5">
            <div>Subtotal: Rs. {order.subtotal}</div>
            {order.discountAmount > 0 && (
              <div className="text-rose-400">Disc: -Rs. {order.discountAmount}</div>
            )}
            {order.serviceChargeAmount > 0 && <div>SC (10%): Rs. {order.serviceChargeAmount}</div>}
            {order.taxAmount > 0 && <div>VAT (13%): Rs. {order.taxAmount}</div>}
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => {
                setPaymentMethod('cash');
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Banknote className="w-5 h-5 text-emerald-400" />
              <span className="text-xs">Cash</span>
            </button>

            <button
              onClick={() => {
                setPaymentMethod('esewa');
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition ${
                paymentMethod === 'esewa'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <QrCode className="w-5 h-5 text-green-400" />
              <span className="text-xs">eSewa QR</span>
            </button>

            <button
              onClick={() => {
                setPaymentMethod('khalti');
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition ${
                paymentMethod === 'khalti'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-bold'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <QrCode className="w-5 h-5 text-purple-400" />
              <span className="text-xs">Khalti QR</span>
            </button>

            <button
              onClick={() => {
                setPaymentMethod('split');
                setErrorMsg('');
              }}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition ${
                paymentMethod === 'split'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-5 h-5 text-blue-400" />
              <span className="text-xs">Split Pay</span>
            </button>
          </div>

          {/* Payment Details Body */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
            {/* CASH FLOW */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">Tendered Cash:</label>
                  <div className="flex gap-1.5">
                    {quickTenders.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setTenderedCash(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                          tenderedCash === preset
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        Rs. {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={tenderedCash || ''}
                    onChange={(e) => setTenderedCash(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-lg font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Enter tendered amount"
                  />
                </div>

                {/* Change Due Display */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-semibold">Change to Return:</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {settings.currencySymbol} {changeDue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* QR PAYMENT (eSewa / Khalti) FLOW */}
            {(paymentMethod === 'esewa' || paymentMethod === 'khalti') && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900 p-3 rounded-xl border border-slate-800">
                  {/* Generated QR Code SVG */}
                  <div className="w-28 h-28 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-black">
                      {/* Stylized QR Matrix Pattern */}
                      <rect x="0" y="0" width="30" height="30" fill="black" />
                      <rect x="5" y="5" width="20" height="20" fill="white" />
                      <rect x="10" y="10" width="10" height="10" fill="black" />

                      <rect x="70" y="0" width="30" height="30" fill="black" />
                      <rect x="75" y="5" width="20" height="20" fill="white" />
                      <rect x="80" y="10" width="10" height="10" fill="black" />

                      <rect x="0" y="70" width="30" height="30" fill="black" />
                      <rect x="5" y="75" width="20" height="20" fill="white" />
                      <rect x="10" y="80" width="10" height="10" fill="black" />

                      <rect x="40" y="10" width="10" height="10" fill="black" />
                      <rect x="55" y="25" width="15" height="15" fill="black" />
                      <rect x="35" y="45" width="30" height="15" fill="black" />
                      <rect x="75" y="55" width="15" height="25" fill="black" />
                      <rect x="45" y="75" width="15" height="15" fill="black" />
                    </svg>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        paymentMethod === 'esewa'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}
                    >
                      {paymentMethod.toUpperCase()} Merchant QR
                    </span>
                    <p className="text-xs text-slate-300 font-semibold mt-1">
                      Merchant ID: 9841002233 ({settings.restaurantName})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Scan to pay exact amount: <strong>Rs. {order.grandTotal}</strong>
                    </p>
                  </div>
                </div>

                {/* Strict Manual Verification Warning & Ref ID Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <label className="font-semibold">
                      Required Transaction Reference ID (from customer screen):
                    </label>
                  </div>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. ESEWA-9841882910 or KHALTI-55421"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 uppercase"
                  />
                  <p className="text-[10px] text-slate-500">
                    Payment is NOT recorded until the cashier verifies the transaction code.
                  </p>
                </div>
              </div>
            )}

            {/* SPLIT PAYMENT FLOW */}
            {paymentMethod === 'split' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Cash Part (NPR):</label>
                    <input
                      type="number"
                      value={splitCashAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSplitCashAmount(val);
                        setSplitOnlineAmount(Math.max(0, order.grandTotal - val));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Digital QR Part (NPR):
                    </label>
                    <input
                      type="number"
                      value={splitOnlineAmount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSplitOnlineAmount(val);
                        setSplitCashAmount(Math.max(0, order.grandTotal - val));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Digital Portion Ref ID:
                  </label>
                  <input
                    type="text"
                    value={splitOnlineRef}
                    onChange={(e) => setSplitOnlineRef(e.target.value)}
                    placeholder="e.g. TXN-7738192"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Settle Action Button */}
          <button
            onClick={handleSettle}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 active:scale-[0.99] transition"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirm Settlement & Generate Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
