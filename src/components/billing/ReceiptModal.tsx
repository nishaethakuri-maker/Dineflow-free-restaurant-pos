import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Order, Payment } from '../../types/pos';
import {
  Printer,
  Download,
  Share2,
  X,
  CheckCircle2,
  Bluetooth,
  FileText,
  Copy,
} from 'lucide-react';

interface ReceiptModalProps {
  order: Order;
  payment?: Payment;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, payment, onClose }) => {
  const { settings, showToast } = usePOS();
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(settings.printer.paperWidth);
  const [isConnectingBt, setIsConnectingBt] = useState<boolean>(false);

  const billNumber = payment?.billNumber || 'INV-DRAFT';
  const billDate = payment
    ? new Date(payment.createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const handlePrint = () => {
    window.print();
    showToast('Sent receipt to printer spooler', 'success');
  };

  const handleConnectBluetooth = async () => {
    setIsConnectingBt(true);
    try {
      if ('bluetooth' in navigator) {
        // Request ESC/POS Bluetooth thermal printer service
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
          optionalServices: ['generic_access'],
        });
        showToast(`Connected to ${device.name || 'Thermal Printer'} via Bluetooth!`, 'success');
      } else {
        // Web Bluetooth not supported in this browser environment, fall back to standard Print
        showToast('Web Bluetooth simulated: standard ESC/POS printer print spooler ready', 'info');
        window.print();
      }
    } catch (err: any) {
      console.log('Bluetooth pairing fallback:', err);
      // Fallback to standard print
      window.print();
    } finally {
      setIsConnectingBt(false);
    }
  };

  const handleDownloadCopy = () => {
    const receiptText = `
========================================
       ${settings.restaurantName}
       ${settings.slogan}
       ${settings.address}
       Tel: ${settings.phone}
       ${settings.panVatNumber}
========================================
TAX INVOICE
Bill No: ${billNumber}
Date: ${billDate}
Order No: ${order.orderNumber}
Type: ${order.orderType.toUpperCase()} ${order.tableName ? `(Table: ${order.tableName})` : ''}
Server: ${order.waiterName}
Cashier: ${payment?.cashierName || 'Cashier'}
----------------------------------------
ITEM              QTY    RATE    AMOUNT
----------------------------------------
${order.items
  .map(
    (it) =>
      `${it.name.slice(0, 16).padEnd(16)} ${String(it.quantity).padStart(3)}  ${String(
        it.unitPrice
      ).padStart(6)}  ${String(it.unitPrice * it.quantity).padStart(7)}`
  )
  .join('\n')}
----------------------------------------
Subtotal:                    Rs. ${order.subtotal}
${order.discountAmount > 0 ? `Discount:                   -Rs. ${order.discountAmount}\n` : ''}${
      order.serviceChargeAmount > 0
        ? `Service Charge (10%):        Rs. ${order.serviceChargeAmount}\n`
        : ''
    }${order.taxAmount > 0 ? `VAT (13%):                   Rs. ${order.taxAmount}\n` : ''}----------------------------------------
GRAND TOTAL:                 Rs. ${order.grandTotal}
----------------------------------------
Payment Method: ${payment?.method.toUpperCase() || 'CASH'}
${payment?.tenderedCash ? `Tendered:                    Rs. ${payment.tenderedCash}\n` : ''}${
      payment?.changeDue ? `Change:                      Rs. ${payment.changeDue}\n` : ''
    }${payment?.transactionRef ? `Ref No: ${payment.transactionRef}\n` : ''}========================================
    ${settings.printer.footerNote || 'Thank you! Visit Again!'}
========================================
`;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${billNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Receipt saved to device', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg text-white shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Printable Tax Receipt Preview</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Size Width Toggle */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Paper Format:</span>
          <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
                paperWidth === '58mm'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              58 mm (Handheld)
            </button>
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition ${
                paperWidth === '80mm'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              80 mm (Counter POS)
            </button>
          </div>
        </div>

        {/* The Printable Authentic Thermal Paper Receipt */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-950/60">
          <div
            id="thermal-receipt-printable"
            style={{ width: paperWidth === '58mm' ? '280px' : '360px' }}
            className="bg-white text-black p-5 rounded-sm shadow-2xl font-mono text-xs leading-relaxed select-text border-t-8 border-dashed border-slate-300"
          >
            {/* Restaurant Branding Header */}
            <div className="text-center pb-2 border-b border-dashed border-neutral-400">
              <h1 className="text-base font-black tracking-tight uppercase">
                {settings.restaurantName}
              </h1>
              <p className="text-[10px] text-neutral-600 font-sans italic">{settings.slogan}</p>
              <p className="text-[10px] mt-1">{settings.address}</p>
              <p className="text-[10px]">Tel: {settings.phone}</p>
              <p className="text-[10px] font-bold mt-0.5">{settings.panVatNumber}</p>
            </div>

            {/* Bill Details */}
            <div className="py-2 border-b border-dashed border-neutral-400 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>INVOICE:</span>
                <span>{billNumber}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Date:</span>
                <span>{billDate}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Order No:</span>
                <span>{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Type:</span>
                <span>
                  {order.orderType.toUpperCase()}{' '}
                  {order.tableName ? `[${order.tableName}]` : ''}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>Server / Cashier:</span>
                <span>{order.waiterName}</span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-2 border-b border-dashed border-neutral-400 text-[11px]">
              <div className="flex justify-between font-bold border-b border-neutral-300 pb-1 text-[10px]">
                <span className="w-1/2">ITEM</span>
                <span className="w-12 text-center">QTY</span>
                <span className="w-14 text-right">RATE</span>
                <span className="w-16 text-right">TOTAL</span>
              </div>

              <div className="space-y-1 pt-1">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[10px]">
                    <span className="w-1/2 truncate font-sans font-medium">{it.name}</span>
                    <span className="w-12 text-center">{it.quantity}</span>
                    <span className="w-14 text-right">{it.unitPrice}</span>
                    <span className="w-16 text-right font-bold">
                      {it.unitPrice * it.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="py-2 border-b border-dashed border-neutral-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {order.subtotal}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-neutral-700">
                  <span>Discount:</span>
                  <span>-Rs. {order.discountAmount}</span>
                </div>
              )}
              {order.serviceChargeAmount > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge (10%):</span>
                  <span>Rs. {order.serviceChargeAmount}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>VAT (13%):</span>
                  <span>Rs. {order.taxAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-neutral-300">
                <span>GRAND TOTAL:</span>
                <span>Rs. {order.grandTotal}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-neutral-400 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold uppercase">
                  {payment?.method || 'CASH'}
                </span>
              </div>
              {payment?.tenderedCash && (
                <div className="flex justify-between">
                  <span>Tendered Cash:</span>
                  <span>Rs. {payment.tenderedCash}</span>
                </div>
              )}
              {payment?.changeDue !== undefined && payment.changeDue > 0 && (
                <div className="flex justify-between font-bold">
                  <span>Change Given:</span>
                  <span>Rs. {payment.changeDue}</span>
                </div>
              )}
              {payment?.transactionRef && (
                <div className="flex justify-between text-[9px]">
                  <span>Ref / Trx ID:</span>
                  <span>{payment.transactionRef}</span>
                </div>
              )}
            </div>

            {/* Footer Notes & Barcode Simulation */}
            <div className="pt-3 text-center space-y-1">
              <p className="text-[10px] font-sans font-medium">
                {settings.printer.footerNote || 'Thank you for your visit!'}
              </p>
              <div className="h-6 flex items-center justify-center gap-0.5 opacity-70 my-1">
                {[4, 2, 6, 1, 3, 5, 2, 4, 1, 3, 6, 2, 1, 4, 5, 2, 3].map((w, i) => (
                  <div key={i} style={{ width: `${w}px` }} className="h-full bg-black" />
                ))}
              </div>
              <p className="text-[9px] text-neutral-500">
                Software: DineFlow POS for Android
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Print Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleConnectBluetooth}
              disabled={isConnectingBt}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
              title="Pair ESC/POS Bluetooth Thermal Printer"
            >
              <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
              <span>{isConnectingBt ? 'Pairing...' : 'Bluetooth Printer'}</span>
            </button>
            <button
              onClick={handleDownloadCopy}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
              title="Save text copy of receipt"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Text</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
