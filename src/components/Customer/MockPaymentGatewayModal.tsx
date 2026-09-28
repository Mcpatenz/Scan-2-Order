import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '../../types';
import { useOrderContext } from '../../context/OrderContext';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { playChime } from '../../utils/audio';
import {
  QrCode,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  Copy,
  Receipt,
  Clock,
  Check,
  Zap,
  LogOut,
} from 'lucide-react';

interface MockPaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  tableNumber: number | string;
  initialMethod?: PaymentMethod;
  onPaymentSuccess: (details: {
    refNumber: string;
    method: PaymentMethod;
    timestamp: string;
    exitToLanding?: boolean;
  }) => void;
}

export const MockPaymentGatewayModal: React.FC<MockPaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  amount,
  tableNumber,
  initialMethod = 'gcash',
  onPaymentSuccess,
}) => {
  const { businessSettings } = useOrderContext();
  const [selectedWallet, setSelectedWallet] = useState<'gcash' | 'paymaya'>('gcash');
  const [payMode, setPayMode] = useState<'qr' | 'mobile'>('qr');

  // Form states
  const [walletPhone, setWalletPhone] = useState('0917 888 9912');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState(false);

  // Transaction processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [isPaid, setIsPaid] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [transactionTime, setTransactionTime] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedMerchantNum, setCopiedMerchantNum] = useState(false);

  // Session timer (5 mins)
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (isOpen) {
      setIsPaid(false);
      setIsProcessing(false);
      setProcessingStage(0);
      setTimeLeft(300);
      if (initialMethod === 'paymaya') {
        setSelectedWallet('paymaya');
      } else {
        setSelectedWallet('gcash');
      }
    }
  }, [initialMethod, isOpen]);

  // Session Countdown timer
  useEffect(() => {
    if (!isOpen || isPaid) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isPaid]);

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyRef = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const startPaymentProcessing = () => {
    setIsProcessing(true);
    setProcessingStage(1);

    const generatedRef = `${selectedWallet === 'gcash' ? 'GCASH' : 'MAYA'}-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setRefNumber(generatedRef);
    setTransactionTime(nowStr);

    setTimeout(() => {
      setProcessingStage(2);
    }, 700);

    setTimeout(() => {
      setProcessingStage(3);
    }, 1400);

    setTimeout(() => {
      setProcessingStage(4);
      setIsProcessing(false);
      setIsPaid(true);

      playChime('success');
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {
        console.warn(e);
      }
    }, 2100);
  };

  const handleConfirmOrder = (exitToLanding?: boolean) => {
    onPaymentSuccess({
      refNumber,
      method: selectedWallet,
      timestamp: transactionTime,
      exitToLanding,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-950 rounded-3xl border border-slate-800 p-6 sm:p-7 text-white shadow-2xl space-y-5 my-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black shadow-md shadow-emerald-500/10">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  {selectedWallet === 'gcash' ? 'GCash Secure Checkout' : 'PayMaya Secure Checkout'}
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  <Lock className="h-3 w-3" /> 256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {businessSettings.businessName} • Table #{tableNumber}
              </p>
            </div>
          </div>

          {!isPaid ? (
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => handleConfirmOrder(true)}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 border border-slate-700 transition"
              title="Exit to Landing Page"
            >
              <LogOut className="h-3.5 w-3.5 text-emerald-400" />
              <span>Exit</span>
            </button>
          )}
        </div>

        {/* Amount & Session Timer Banner */}
        {!isPaid && (
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-900/90 p-4 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Amount Due
              </span>
              <span className="text-2xl font-black text-emerald-400 tracking-tight">
                ₱{amount.toFixed(2)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-end gap-1">
                <Clock className="h-3 w-3 text-amber-400" /> Session Expiry
              </span>
              <span className="text-sm font-mono font-black text-amber-400">
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>
        )}

        {/* SUCCESS RECEIPT VIEW */}
        {isPaid ? (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center space-y-2 py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-slate-950 font-black shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-white">Payment Authorized!</h2>
              <p className="text-xs text-emerald-400 font-bold">
                Table #{tableNumber} is now reserved for your order and sent to the Kitchen Dashboard
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Merchant:</span>
                <span className="font-bold text-white">{businessSettings.businessName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Transaction Ref:</span>
                <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                  <span>{refNumber}</span>
                  <button
                    onClick={() => handleCopyRef(refNumber)}
                    className="p-1 hover:text-white transition"
                    title="Copy Reference"
                  >
                    {copiedRef ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-300">{transactionTime}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-bold text-sky-400 uppercase">
                  {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm font-black text-emerald-400">
                <span>Amount Paid:</span>
                <span>₱{amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleConfirmOrder(false)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Receipt className="h-4 w-4" /> View &amp; Print Digital Receipt
              </button>

              <button
                onClick={() => handleConfirmOrder(true)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-black text-xs py-3.5 px-4 rounded-2xl transition active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4 text-emerald-400" /> Exit to Landing Page
              </button>
            </div>
          </div>
        ) : isProcessing ? (
          /* PROCESSING STAGE ANIMATION */
          <div className="py-8 space-y-6 text-center animate-fadeIn">
            <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <ShieldCheck className="h-10 w-10 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-white">
                Verifying {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'} Transaction...
              </h4>
              <p className="text-xs text-slate-400">Please do not close or refresh this page</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 text-left text-xs font-bold">
              <div className={`flex items-center gap-2 transition ${processingStage >= 1 ? 'text-emerald-400' : 'text-slate-600'}`}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${processingStage >= 1 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>1. 256-Bit SSL Handshake Established</span>
              </div>

              <div className={`flex items-center gap-2 transition ${processingStage >= 2 ? 'text-emerald-400' : 'text-slate-600'}`}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${processingStage >= 2 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>2. Authenticating {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'} Credentials</span>
              </div>

              <div className={`flex items-center gap-2 transition ${processingStage >= 3 ? 'text-emerald-400' : 'text-slate-600'}`}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${processingStage >= 3 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>3. Authorizing Funds Transfer (₱{amount.toFixed(2)})</span>
              </div>

              <div className={`flex items-center gap-2 transition ${processingStage >= 4 ? 'text-emerald-400' : 'text-slate-600'}`}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${processingStage >= 4 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>4. Digital Receipt &amp; Kitchen Order Dispatch</span>
              </div>
            </div>
          </div>
        ) : (
          /* GCASH & PAYMAYA PAYMENT VIEW */
          <div className="space-y-4">
            {/* Wallet Provider Switcher: GCash vs PayMaya */}
            <div>
              <label className="block text-slate-400 font-extrabold mb-1.5 uppercase text-[10px] tracking-wider">
                Select Payment Wallet
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedWallet('gcash')}
                  className={`p-3 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition ${
                    selectedWallet === 'gcash'
                      ? 'border-sky-500 bg-sky-500/15 text-sky-400 ring-2 ring-sky-500/20'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-4 w-4 text-sky-400" />
                  <span>GCash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWallet('paymaya')}
                  className={`p-3 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition ${
                    selectedWallet === 'paymaya'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/20'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <span>PayMaya</span>
                </button>
              </div>
            </div>

            {/* Mode Selector: Scan QR vs Mobile Number */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPayMode('qr')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                  payMode === 'qr' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="h-4 w-4" /> Scan {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'} QR
              </button>

              <button
                type="button"
                onClick={() => setPayMode('mobile')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition ${
                  payMode === 'mobile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-4 w-4" /> Mobile Account
              </button>
            </div>

            {payMode === 'qr' ? (
              <div className="space-y-4 text-center">
                <div
                  className={`p-4 bg-white rounded-2xl border-4 inline-block shadow-xl my-1 ${
                    selectedWallet === 'gcash' ? 'border-sky-500/50' : 'border-emerald-500/50'
                  }`}
                >
                  {selectedWallet === 'gcash' && businessSettings.gcashQrCode ? (
                    <img
                      src={businessSettings.gcashQrCode}
                      alt="Merchant GCash QR Code"
                      className="h-44 w-44 object-contain rounded-lg mx-auto"
                    />
                  ) : selectedWallet === 'paymaya' && businessSettings.paymayaQrCode ? (
                    <img
                      src={businessSettings.paymayaQrCode}
                      alt="Merchant PayMaya QR Code"
                      className="h-44 w-44 object-contain rounded-lg mx-auto"
                    />
                  ) : (
                    <QRCodeSVG
                      value={`${selectedWallet.toUpperCase()}|${businessSettings.businessName}|${
                        selectedWallet === 'gcash'
                          ? businessSettings.gcashNumber
                          : businessSettings.paymayaNumber
                      }|TABLE-${tableNumber}|PHP-${amount.toFixed(2)}`}
                      size={165}
                      level="H"
                      includeMargin={false}
                    />
                  )}
                </div>

                {/* Official Merchant Account Number Banner */}
                <div className="mx-auto max-w-xs rounded-2xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 flex items-center justify-between gap-2 text-left">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">
                      {selectedWallet === 'gcash' ? 'Merchant GCash Number' : 'Merchant PayMaya Number'}
                    </span>
                    <span
                      className={`font-mono text-xs font-black ${
                        selectedWallet === 'gcash' ? 'text-sky-400' : 'text-emerald-400'
                      }`}
                    >
                      {selectedWallet === 'gcash'
                        ? businessSettings.gcashNumber || '0917 888 9912'
                        : businessSettings.paymayaNumber || '0918 777 6654'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const num =
                        selectedWallet === 'gcash'
                          ? businessSettings.gcashNumber
                          : businessSettings.paymayaNumber;
                      navigator.clipboard.writeText(num);
                      setCopiedMerchantNum(true);
                      setTimeout(() => setCopiedMerchantNum(false), 2000);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 transition"
                  >
                    {copiedMerchantNum ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black text-white">
                    Scan with {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'} App
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Open your {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'} app scanner and point at this QR code to pay ₱{amount.toFixed(2)}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startPaymentProcessing}
                  className={`w-full font-black text-xs py-3.5 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${
                    selectedWallet === 'gcash'
                      ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  <Zap className="h-4 w-4" /> Authorize {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'} Payment (₱{amount.toFixed(2)})
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      Send {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'} Payment To ({businessSettings.businessName}):
                    </span>
                    <span
                      className={`font-mono text-sm font-black ${
                        selectedWallet === 'gcash' ? 'text-sky-400' : 'text-emerald-400'
                      }`}
                    >
                      {selectedWallet === 'gcash'
                        ? businessSettings.gcashNumber || '0917 888 9912'
                        : businessSettings.paymayaNumber || '0918 777 6654'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const num =
                        selectedWallet === 'gcash'
                          ? businessSettings.gcashNumber
                          : businessSettings.paymayaNumber;
                      navigator.clipboard.writeText(num);
                      setCopiedMerchantNum(true);
                      setTimeout(() => setCopiedMerchantNum(false), 2000);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 transition"
                  >
                    {copiedMerchantNum ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-slate-400 font-extrabold mb-1">
                    Your Registered {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'} Mobile Number
                  </label>
                  <input
                    type="text"
                    value={walletPhone}
                    onChange={e => setWalletPhone(e.target.value)}
                    placeholder="e.g. 0917 123 4567"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                {otpStep ? (
                  <div className="space-y-2 p-3 bg-slate-900 rounded-2xl border border-slate-800">
                    <label className="block text-amber-400 font-black">
                      Enter 6-Digit SMS Security OTP:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg font-mono font-bold text-white tracking-widest focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setOtpCode('123456')}
                        className="px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-[11px] rounded-xl border border-amber-500/30"
                      >
                        Auto-fill 123456
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOtpStep(true)}
                    className="text-xs text-sky-400 font-extrabold underline hover:text-sky-300"
                  >
                    + Require SMS OTP Verification
                  </button>
                )}

                <button
                  type="button"
                  onClick={startPaymentProcessing}
                  className={`w-full font-black text-xs py-3.5 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 ${
                    selectedWallet === 'gcash'
                      ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" /> Pay ₱{amount.toFixed(2)} via {selectedWallet === 'gcash' ? 'GCash' : 'PayMaya'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
