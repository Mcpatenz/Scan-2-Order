import React, { useState } from 'react';
import { Order } from '../../types';
import {
  Printer,
  X,
  CheckCircle2,
  FileText,
  ListChecks,
  Download,
  QrCode,
  Smartphone,
  Copy,
  Check,
  CreditCard,
  LogOut,
  Clock,
  Receipt,
  Star,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import { useOrderContext } from '../../context/OrderContext';
import { formatTime12Hour } from '../Admin/AdminSettingsManager';

export interface ProcessedPaymentDetails {
  orderId: string;
  methodUsed: string;
  amountTendered: number;
  changeDue: number;
  processedAt: string;
  receiptRef: string;
}

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  cashierName?: string;
  defaultView?: 'summary' | 'detailed';
  paymentDetails?: ProcessedPaymentDetails | null;
  isPostPayment?: boolean;
  onContinueToTracker?: () => void;
  onExitTable?: () => void;
}

type QrPaymentGateway = 'qrph_instapay' | 'gcash_qr' | 'maya_pay' | 'pos_counter';

const QR_GATEWAYS: { id: QrPaymentGateway; label: string; provider: string; color: string }[] = [
  { id: 'qrph_instapay', label: 'QR Ph / InstaPay', provider: 'Universal Bank & Wallet QR', color: '#0f172a' },
  { id: 'gcash_qr', label: 'GCash Express QR', provider: 'GCash Instant Scan-to-Pay', color: '#1d4ed8' },
  { id: 'maya_pay', label: 'Maya QR Pay', provider: 'Maya Digital Checkout', color: '#047857' },
  { id: 'pos_counter', label: 'Cashier POS Scan', provider: 'Present QR at Cashier Counter', color: '#4338ca' },
];

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  cashierName,
  defaultView = 'detailed',
  paymentDetails,
  isPostPayment = false,
  onContinueToTracker,
  onExitTable,
}) => {
  const { orders, updateOrderPaymentStatus, setPendingFeedbackOrder, showToast, businessSettings } = useOrderContext();
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>(defaultView);
  const [paperFormat, setPaperFormat] = useState<'thermal' | 'standard'>('thermal');
  const [selectedGateway, setSelectedGateway] = useState<QrPaymentGateway>('qrph_instapay');
  const [copiedQrLink, setCopiedQrLink] = useState(false);
  const [justPaidViaQr, setJustPaidViaQr] = useState(false);

  if (!isOpen || !order) return null;

  // Always read fresh order state from context so if paymentStatus updates, the modal reflects it immediately
  const liveOrder = orders.find(o => o.id === order.id) || order;

  const displayCashier = liveOrder.cashierName || cashierName || 'Sarah Jenkins (Cashier)';
  const totalQuantity = liveOrder.items.reduce((sum, item) => sum + item.quantity, 0);
  const receiptRef =
    paymentDetails?.receiptRef ||
    `RCP-${liveOrder.id.replace('ORD-', '')}-${new Date(liveOrder.createdAt).getTime().toString().slice(-4)}`;
  const rawMethod = paymentDetails?.methodUsed || liveOrder.paymentMethod;
  const paymentMethodLabel =
    rawMethod === 'cash_on_hand' || rawMethod === 'cash'
      ? 'CASH ON HAND'
      : rawMethod === 'paymaya'
      ? 'PAYMAYA'
      : rawMethod === 'gcash'
      ? 'GCASH'
      : rawMethod.replace(/_/g, ' ').toUpperCase();
  const tendered = paymentDetails?.amountTendered ?? liveOrder.total;
  const change = paymentDetails?.changeDue ?? 0;

  const activeGatewayInfo = QR_GATEWAYS.find(g => g.id === selectedGateway) || QR_GATEWAYS[0];

  // Build Quick Payment / Verification Scan QR Payload URL
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://order.qrbistro.com';
  const qrPaymentPayload = `${originUrl}/?action=quick_pay&orderId=${encodeURIComponent(
    liveOrder.id
  )}&ref=${encodeURIComponent(receiptRef)}&table=${encodeURIComponent(
    liveOrder.tableNumber
  )}&amount=${liveOrder.total.toFixed(2)}&currency=PHP&gateway=${selectedGateway}&status=${
    liveOrder.paymentStatus
  }`;

  const handleCopyPaymentQrLink = async () => {
    try {
      await navigator.clipboard.writeText(qrPaymentPayload);
      setCopiedQrLink(true);
      showToast(`Copied Digital Receipt reference link for Order #${liveOrder.id}`);
      setTimeout(() => setCopiedQrLink(false), 2000);
    } catch {
      showToast(`Receipt Ref: ${receiptRef}`);
    }
  };

  const handleSimulateQrPayScan = () => {
    updateOrderPaymentStatus(liveOrder.id, 'paid');
    setJustPaidViaQr(true);
    setTimeout(() => setJustPaidViaQr(false), 4000);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 190] });
    let y = 10;

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.text((businessSettings.businessName || 'DINEFLOW QR BISTRO').toUpperCase(), 40, y, { align: 'center' });
    y += 5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text('OFFICIAL DIGITAL RECEIPT', 40, y, { align: 'center' });
    y += 4;
    doc.text(`Ref: ${receiptRef} | Order: ${liveOrder.id}`, 40, y, { align: 'center' });
    y += 4;
    doc.text(new Date(liveOrder.updatedAt || liveOrder.createdAt).toLocaleString(), 40, y, {
      align: 'center',
    });
    y += 5;

    doc.text('----------------------------------', 40, y, { align: 'center' });
    y += 4;
    doc.text(
      `Table: #${liveOrder.tableNumber} (${liveOrder.diningOption === 'dine_in' ? 'Dine In' : 'Takeout'})`,
      6,
      y
    );
    y += 4;
    doc.text(`Customer: ${liveOrder.customerName}`, 6, y);
    y += 4;
    doc.text(`Cashier: ${displayCashier}`, 6, y);
    y += 4;
    doc.text(`Payment: ${paymentMethodLabel} (${liveOrder.paymentStatus.toUpperCase()})`, 6, y);
    y += 4;
    doc.text('----------------------------------', 40, y, { align: 'center' });
    y += 4;

    doc.setFont('courier', 'bold');
    doc.text(`ITEMS (${totalQuantity} Total Qty)`, 6, y);
    y += 4;
    doc.setFont('courier', 'normal');

    liveOrder.items.forEach(item => {
      const label = `${item.quantity}x ${item.productName}`.slice(0, 22);
      const amt = `PHP ${item.itemTotal.toFixed(2)}`;
      doc.text(label, 6, y);
      doc.text(amt, 74, y, { align: 'right' });
      y += 4;
      if (item.modifiers && item.modifiers.length > 0) {
        const modText = `  + ${item.modifiers.map(m => m.optionName).join(', ')}`.slice(0, 32);
        doc.setFontSize(7);
        doc.text(modText, 6, y);
        doc.setFontSize(8);
        y += 3.5;
      }
    });

    doc.text('----------------------------------', 40, y, { align: 'center' });
    y += 4;
    doc.text('Subtotal:', 6, y);
    doc.text(`PHP ${liveOrder.subtotal.toFixed(2)}`, 74, y, { align: 'right' });
    y += 4;

    if (liveOrder.discount > 0) {
      doc.text('Discount:', 6, y);
      doc.text(`-PHP ${liveOrder.discount.toFixed(2)}`, 74, y, { align: 'right' });
      y += 4;
    }

    doc.text('Tax (10%):', 6, y);
    doc.text(`PHP ${liveOrder.tax.toFixed(2)}`, 74, y, { align: 'right' });
    y += 5;

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text(liveOrder.paymentStatus === 'paid' ? 'TOTAL PAID:' : 'TOTAL DUE:', 6, y);
    doc.text(`PHP ${liveOrder.total.toFixed(2)}`, 74, y, { align: 'right' });
    y += 5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Receipt Ref: ${receiptRef}`, 40, y, { align: 'center' });
    y += 4;
    doc.text('Thank you for dining with us!', 40, y, { align: 'center' });

    doc.save(`Digital-Receipt-${liveOrder.id}.pdf`);
    showToast(`Downloaded PDF Digital Receipt for Order #${liveOrder.id}`);
  };

  return (
    <div
      id="print-friendly-digital-receipt"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fadeIn print:static print:bg-white print:p-0 print:block"
    >
      <div
        className={`w-full ${
          paperFormat === 'standard' ? 'max-w-lg' : 'max-w-md'
        } rounded-3xl bg-white p-4 sm:p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-6 print:my-0 print:max-w-none print:shadow-none print:border-none print:bg-white print:text-black`}
      >
        {/* Top Bar (Hidden when printing) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Receipt className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white">
                Print-Friendly Digital Receipt
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Order #{liveOrder.id} · Table #{liveOrder.tableNumber} · Ref: {receiptRef}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            title="Close Receipt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Payment Confirmed Banner (shown post-payment or when payment succeeds) */}
        {(isPostPayment || paymentDetails || justPaidViaQr || liveOrder.paymentStatus === 'paid') && (
          <div className="mt-3 flex items-center justify-between gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-800 dark:text-emerald-300 print:hidden">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              <div className="text-xs">
                <p className="font-black">
                  {isPostPayment
                    ? 'Payment Confirmed — Digital Receipt Ready!'
                    : justPaidViaQr
                    ? 'QR Payment Scan Confirmed!'
                    : 'Official Paid Digital Receipt'}
                </p>
                <p className="text-[11px] opacity-90">
                  Paid ₱{liveOrder.total.toFixed(2)} via {paymentMethodLabel} · Table #{liveOrder.tableNumber} reserved
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="shrink-0 flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white shadow-xs hover:bg-emerald-500 active:scale-95 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
          </div>
        )}

        {/* Controls Bar: Detail Level & Print Layout Format (Hidden when printing) */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex flex-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 px-2 transition ${
                viewMode === 'detailed'
                  ? 'bg-white text-emerald-600 shadow-2xs dark:bg-slate-800 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ListChecks className="h-3.5 w-3.5" /> Itemized Receipt
            </button>
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 px-2 transition ${
                viewMode === 'summary'
                  ? 'bg-white text-emerald-600 shadow-2xs dark:bg-slate-800 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> Summary
            </button>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setPaperFormat('thermal')}
              className={`rounded-lg py-1.5 px-2.5 transition ${
                paperFormat === 'thermal'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title="80mm Thermal Print Format"
            >
              80mm Thermal
            </button>
            <button
              type="button"
              onClick={() => setPaperFormat('standard')}
              className={`rounded-lg py-1.5 px-2.5 transition ${
                paperFormat === 'standard'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title="Full Print-Friendly Invoice Format"
            >
              Full Page
            </button>
          </div>
        </div>

        {/* PRINT-FRIENDLY PAPER RECEIPT SHEET (Always crisp high-contrast paper surface for print clarity) */}
        <div
          className={`my-4 rounded-2xl bg-white text-slate-900 p-5 sm:p-6 shadow-inner border-2 border-dashed border-slate-300 print:border-none print:shadow-none print:p-2 ${
            paperFormat === 'thermal' ? 'font-mono text-xs' : 'font-sans text-xs sm:text-sm'
          }`}
        >
          {/* Merchant Header */}
          <div className="text-center pb-3.5 border-b-2 border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-emerald-700 mb-1">
              <span>OFFICIAL CUSTOMER E-RECEIPT</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-slate-950 uppercase">
              {businessSettings.businessName}
            </h2>
            <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
              {businessSettings.address}
            </p>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">
              Tel: {businessSettings.contactNumber} · Hours: {formatTime12Hour(businessSettings.timeOpen)} – {formatTime12Hour(businessSettings.timeClosed)}
            </p>
            <p className="text-[11px] font-bold text-slate-800 mt-1">
              Table #{liveOrder.tableNumber} ·{' '}
              {liveOrder.diningOption === 'dine_in' ? 'Dine-In Service' : 'Takeout Package'}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 tabular-nums">
              <span>Receipt #{receiptRef}</span>
              <span>·</span>
              <span>Order #{liveOrder.id}</span>
            </div>
            <p className="text-[10px] text-slate-500 tabular-nums mt-0.5">
              {new Date(
                paymentDetails?.processedAt || liveOrder.updatedAt || liveOrder.createdAt
              ).toLocaleString()}
            </p>
          </div>

          {/* Customer & Payment Confirmation Metadata */}
          <div className="py-3 border-b-2 border-dashed border-slate-300 space-y-1.5 text-[11px] tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer Name:</span>
              <span className="font-bold text-slate-900">{liveOrder.customerName}</span>
            </div>
            {liveOrder.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Phone:</span>
                <span className="font-semibold text-slate-800">{liveOrder.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Served / Processed By:</span>
              <span className="font-semibold text-slate-800">{displayCashier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-black text-slate-900 uppercase">{paymentMethodLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Payment Status:</span>
              <span
                className={`font-black uppercase ${
                  liveOrder.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {liveOrder.paymentStatus === 'paid'
                  ? '✓ PAID & CONFIRMED'
                  : '⏳ PENDING PAYMENT'}
              </span>
            </div>
          </div>

          {/* Order Items Breakdown */}
          {viewMode === 'summary' ? (
            <div className="py-3.5 border-b-2 border-dashed border-slate-300 space-y-2 tabular-nums">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[11px] font-black text-slate-900 uppercase">
                <span>Item Summary ({liveOrder.items.length} Dishes)</span>
                <span>{totalQuantity} Qty · Amount</span>
              </div>

              <div className="space-y-1.5 pt-1">
                {liveOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] text-slate-800">
                    <span className="truncate pr-2 font-medium">
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="font-bold shrink-0">₱{item.itemTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-3.5 border-b-2 border-dashed border-slate-300 space-y-2.5 tabular-nums">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <span>Qty &amp; Item Description</span>
                <span>Line Total</span>
              </div>
              {liveOrder.items.map((item, idx) => {
                const unitPrice =
                  item.quantity > 0 ? item.itemTotal / item.quantity : item.price;
                return (
                  <div key={idx} className="space-y-0.5 text-slate-900">
                    <div className="flex justify-between font-bold text-xs">
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                      <span>₱{item.itemTotal.toFixed(2)}</span>
                    </div>
                    <div className="pl-3 text-[10px] text-slate-500">
                      Unit Price: ₱{unitPrice.toFixed(2)} each
                    </div>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="pl-3 text-[10px] text-slate-600">
                        {item.modifiers.map(m => `+ ${m.groupName}: ${m.optionName}`).join(' · ')}
                      </div>
                    )}
                    {item.notes && (
                      <div className="pl-3 text-[10px] italic text-slate-600">
                        Note: &ldquo;{item.notes}&rdquo;
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals & Tax Breakdown */}
          <div className="py-3.5 border-b-2 border-dashed border-slate-300 space-y-1.5 text-slate-700 tabular-nums">
            <div className="flex justify-between text-[11px]">
              <span>Subtotal ({totalQuantity} items):</span>
              <span className="font-semibold text-slate-900">₱{liveOrder.subtotal.toFixed(2)}</span>
            </div>
            {liveOrder.discount > 0 && (
              <div className="flex justify-between text-[11px] text-emerald-700 font-semibold">
                <span>Discount / Promo Applied:</span>
                <span>-₱{liveOrder.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px]">
              <span>VAT / Tax (10%):</span>
              <span className="font-semibold text-slate-900">₱{liveOrder.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-300 text-sm font-black text-slate-950">
              <span>{liveOrder.paymentStatus === 'paid' ? 'TOTAL PAID:' : 'AMOUNT DUE:'}</span>
              <span className="text-emerald-700">₱{liveOrder.total.toFixed(2)}</span>
            </div>

            {liveOrder.paymentStatus === 'paid' && (
              <div className="pt-1.5 space-y-0.5 text-[11px] border-t border-dashed border-slate-200">
                <div className="flex justify-between">
                  <span>Amount Tendered ({paymentMethodLabel}):</span>
                  <span className="font-bold text-slate-900">₱{tendered.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change Due:</span>
                  <span className="font-bold text-emerald-700">₱{change.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Digital Verification QR Code */}
          <div className="pt-3.5 flex flex-col items-center text-center font-sans">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-900 mb-1">
              <QrCode className="h-3.5 w-3.5 text-emerald-700" />
              <span>
                {liveOrder.paymentStatus === 'paid'
                  ? 'Verified Digital Receipt QR'
                  : 'Scan QR Code for Quick Payment'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 max-w-xs mb-2.5">
              {liveOrder.paymentStatus === 'paid'
                ? 'Present or scan this QR code at the counter to verify your paid order and table receipt.'
                : `Scan with GCash, PayMaya, or present at the counter to pay ₱${liveOrder.total.toFixed(2)}.`}
            </p>

            {/* Gateway Selector Buttons (Hidden on print) */}
            {liveOrder.paymentStatus !== 'paid' && (
              <div className="flex flex-wrap justify-center gap-1 mb-3 print:hidden">
                {QR_GATEWAYS.map(gw => (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setSelectedGateway(gw.id)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                      selectedGateway === gw.id
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {gw.label}
                  </button>
                ))}
              </div>
            )}

            {/* Scannable QR Code Frame */}
            <div className="rounded-2xl bg-white p-3 border border-slate-300 flex flex-col items-center">
              <QRCodeSVG
                value={qrPaymentPayload}
                size={132}
                level="H"
                fgColor="#0f172a"
                bgColor="#ffffff"
                includeMargin={false}
              />
              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-700">
                <Smartphone className="h-3 w-3 text-emerald-700" />
                <span>Ref: {receiptRef}</span>
              </div>
              <span className="mt-0.5 font-mono text-[10px] font-black text-slate-900 tabular-nums">
                Table #{liveOrder.tableNumber} · ₱{liveOrder.total.toFixed(2)}
              </span>
            </div>

            {/* Interactive Actions for Unpaid QR or Copy Link (Hidden on print) */}
            <div className="mt-2.5 w-full space-y-2 print:hidden">
              {liveOrder.paymentStatus !== 'paid' && liveOrder.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={handleSimulateQrPayScan}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 transition"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Confirm QR Payment (₱{liveOrder.total.toFixed(2)})</span>
                </button>
              )}

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleCopyPaymentQrLink}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-950 transition"
                >
                  {copiedQrLink ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-700">Receipt Reference Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Digital Receipt Reference</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Verification */}
          <div className="mt-3 text-center pt-2.5 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
            <p className="font-bold text-slate-700">Thank you for dining at DineFlow QR Bistro!</p>
            <p>Official Print-Friendly Customer Receipt · Keep for your records</p>
          </div>
        </div>

        {/* Primary Print & Download Action Buttons (Hidden when printing) */}
        <div className="space-y-2 print:hidden">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 px-4 text-xs font-black text-white transition hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-600/20"
            >
              <Printer className="h-4 w-4" />
              <span>Print Digital Receipt</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 px-4 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Download className="h-4 w-4" />
              <span>Save PDF</span>
            </button>

            {liveOrder.paymentStatus === 'paid' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setPendingFeedbackOrder(liveOrder);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 py-3 px-3.5 text-xs font-black text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition"
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                <span>
                  {liveOrder.feedback
                    ? `Rated ${liveOrder.feedback.rating}/5 ★`
                    : 'Rate Experience'}
                </span>
              </button>
            )}

            {!isPostPayment && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            )}
          </div>

          {/* Post-Payment Navigation Actions (Track Order or Exit to Landing Page) */}
          {isPostPayment && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onContinueToTracker) onContinueToTracker();
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2.5 px-3 text-xs font-black text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>View Live Order Tracker</span>
              </button>

              {onExitTable && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExitTable();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 px-3 text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Exit to Landing Page</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
