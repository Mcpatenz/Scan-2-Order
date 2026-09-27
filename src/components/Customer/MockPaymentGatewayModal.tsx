import React, { useState, useEffect, useRef } from 'react';
import { PaymentMethod } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { playChime } from '../../utils/audio';
import {
  QrCode,
  Smartphone,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  X,
  Lock,
  RefreshCw,
  Copy,
  Download,
  Sparkles,
  ArrowRight,
  Receipt,
  Clock,
  Building2,
  KeyRound,
  Check,
  Zap,
} from 'lucide-react';

interface MockPaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  tableNumber: number;
  initialMethod?: PaymentMethod;
  onPaymentSuccess: (details: { refNumber: string; method: PaymentMethod; timestamp: string }) => void;
}

export const MockPaymentGatewayModal: React.FC<MockPaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  amount,
  tableNumber,
  initialMethod = 'gcash',
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'wallet' | 'card'>('qr');
  const [selectedWallet, setSelectedWallet] = useState<'gcash' | 'maya' | 'applepay' | 'googlepay'>('gcash');

  // Form states
  const [walletPhone, setWalletPhone] = useState('0917 888 9912');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState(false);

  // Card states
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8829');
  const [cardHolder, setCardHolder] = useState('ALEX MERCER');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  // Transaction processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [isPaid, setIsPaid] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [transactionTime, setTransactionTime] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);

  // Session timer (5 mins)
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (initialMethod === 'card') {
      setActiveTab('card');
    } else if (initialMethod === 'gcash' || initialMethod === 'virtual_wallet') {
      setActiveTab('wallet');
    } else {
      setActiveTab('qr');
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

  const handleFillDemoCard = () => {
    setCardNumber('4532 9012 3456 8829');
    setCardHolder('ALEX MERCER');
    setCardExpiry('08/29');
    setCardCvc('314');
  };

  const startPaymentProcessing = () => {
    setIsProcessing(true);
    setProcessingStage(1);

    const generatedRef = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setRefNumber(generatedRef);
    setTransactionTime(nowStr);

    setTimeout(() => {
      setProcessingStage(2);
    }, 900);

    setTimeout(() => {
      setProcessingStage(3);
    }, 1800);

    setTimeout(() => {
      setProcessingStage(4);
      setIsProcessing(false);
      setIsPaid(true);

      // Play chime & confetti
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
    }, 2700);
  };

  const resolvePaymentMethod = (): PaymentMethod => {
    if (activeTab === 'card') return 'card';
    if (activeTab === 'wallet') return selectedWallet === 'gcash' ? 'gcash' : 'virtual_wallet';
    return 'qr_wallet';
  };

  const handleConfirmOrder = () => {
    onPaymentSuccess({
      refNumber,
      method: resolvePaymentMethod(),
      timestamp: transactionTime,
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
                <h3 className="text-base font-black text-white tracking-tight">Express Secure Checkout</h3>
                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  <Lock className="h-3 w-3" /> 256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gourmet Bistro • Table #{tableNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center justify-end gap-1">
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
                Funds successfully transferred and order queued in Kitchen system
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Merchant:</span>
                <span className="font-bold text-white">Gourmet QR Bistro</span>
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
                <span className="text-slate-400">Payment Gateway:</span>
                <span className="font-bold text-sky-400 uppercase">
                  {activeTab === 'card' ? 'Visa / Mastercard SSL' : selectedWallet.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm font-black text-emerald-400">
                <span>Amount Paid:</span>
                <span>₱{amount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmOrder}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-500/30 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Receipt className="h-4 w-4" /> Finish & View Live Order Tracker
            </button>
          </div>
        ) : isProcessing ? (
          /* PROCESSING STAGE ANIMATION */
          <div className="py-8 space-y-6 text-center animate-fadeIn">
            <div className="relative mx-auto h-20 w-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <ShieldCheck className="h-10 w-10 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-white">Verifying Transaction...</h4>
              <p className="text-xs text-slate-400">Please do not close or refresh this page</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3 text-left text-xs font-bold">
              <div className={`flex items-center gap-2 transition ${processingStage >= 1 ? 'text-emerald-400' : 'text-slate-600'}`}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${processingStage >= 1 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>1. 256-Bit SSL Handshake Established</span>
              </div>

              <div className={`flex items-center gap-2 transition ${processingStage >= 2 ? 'text-emerald-400' : 'text-slate-600'}`}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${processingStage >= 2 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>2. Authenticating Wallet Credentials</span>
              </div>

              <div className={`flex items-center gap-2 transition ${processingStage >= 3 ? 'text-emerald-400' : 'text-slate-600'}`}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${processingStage >= 3 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>3. Authorizing Funds Transfer (₱{amount.toFixed(2)})</span>
              </div>

              <div className={`flex items-center gap-2 transition ${processingStage >= 4 ? 'text-emerald-400' : 'text-slate-600'}`}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${processingStage >= 4 ? 'text-emerald-400' : 'text-slate-700'}`} />
                <span>4. Digital Receipt & Order Dispatch</span>
              </div>
            </div>
          </div>
        ) : (
          /* TABBED PAYMENT MODES */
          <div className="space-y-5">
            {/* Tab Selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setActiveTab('qr')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                  activeTab === 'qr' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="h-4 w-4" /> QR Code
              </button>

              <button
                onClick={() => setActiveTab('wallet')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                  activeTab === 'wallet' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-4 w-4" /> E-Wallet
              </button>

              <button
                onClick={() => setActiveTab('card')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition ${
                  activeTab === 'card' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="h-4 w-4" /> Card Pay
              </button>
            </div>

            {/* TAB 1: QR CODE PAY */}
            {activeTab === 'qr' && (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-white rounded-2xl border-4 border-indigo-500/40 inline-block shadow-xl my-1">
                  <QRCodeSVG
                    value={`GOURMET-BISTRO|TABLE-${tableNumber}|PHP-${amount.toFixed(2)}|REF-${Date.now().toString().slice(-6)}`}
                    size={170}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black text-white">Scan with GCash, Maya, or Mobile Banking App</p>
                  <p className="text-[11px] text-slate-400">
                    Open your payment app scanner and point at this QR code to complete checkout.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleCopyRef(`GOURMET-PAY-${tableNumber}-${amount.toFixed(2)}`)}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 font-extrabold hover:underline"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Payment Reference Code
                  </button>
                </div>

                <button
                  onClick={startPaymentProcessing}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Zap className="h-4 w-4" /> Simulate Instant QR Payment Approval
                </button>
              </div>
            )}

            {/* TAB 2: VIRTUAL WALLET */}
            {activeTab === 'wallet' && (
              <div className="space-y-4 text-xs">
                {/* Wallet Choices */}
                <div>
                  <label className="block text-slate-400 font-extrabold mb-1.5 uppercase text-[10px] tracking-wider">
                    Select Digital Wallet Provider
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedWallet('gcash')}
                      className={`p-2.5 rounded-2xl border font-black text-xs flex flex-col items-center gap-1 transition ${
                        selectedWallet === 'gcash'
                          ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Smartphone className="h-4 w-4 text-sky-400" /> GCash
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWallet('maya')}
                      className={`p-2.5 rounded-2xl border font-black text-xs flex flex-col items-center gap-1 transition ${
                        selectedWallet === 'maya'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <Zap className="h-4 w-4 text-emerald-400" /> Maya
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWallet('applepay')}
                      className={`p-2.5 rounded-2xl border font-black text-xs flex flex-col items-center gap-1 transition ${
                        selectedWallet === 'applepay'
                          ? 'border-slate-400 bg-slate-800 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <span> Pay</span> Apple
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWallet('googlepay')}
                      className={`p-2.5 rounded-2xl border font-black text-xs flex flex-col items-center gap-1 transition ${
                        selectedWallet === 'googlepay'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      <span>G Pay</span> Google
                    </button>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-400 font-extrabold mb-1">
                      Registered Mobile Number / Account Tag
                    </label>
                    <input
                      type="text"
                      value={walletPhone}
                      onChange={e => setWalletPhone(e.target.value)}
                      placeholder="e.g. 0917 123 4567"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="p-3 bg-sky-950/40 border border-sky-800/50 rounded-xl text-sky-300 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-extrabold text-sky-400">Available Wallet Balance</div>
                      <div className="text-sm font-black text-white">₱250.00</div>
                    </div>
                    <div className="text-[10px] text-sky-400 bg-sky-500/20 px-2 py-1 rounded-md font-bold">
                      Sufficient Funds
                    </div>
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
                </div>

                <button
                  onClick={startPaymentProcessing}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="h-4 w-4" /> Authorize Wallet Payment (₱{amount.toFixed(2)})
                </button>
              </div>
            )}

            {/* TAB 3: CREDIT / DEBIT CARD */}
            {activeTab === 'card' && (
              <div className="space-y-4 text-xs">
                {/* Visual Card Graphic */}
                <div className="relative p-5 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-slate-700 shadow-xl text-white space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-8 w-11 bg-amber-400/80 rounded-md border border-amber-200/50 flex items-center justify-center font-bold text-[9px] text-slate-950">
                      CHIP
                    </div>
                    <span className="text-sm font-black italic tracking-wider text-slate-300">VISA / MASTERCARD</span>
                  </div>

                  <div className="text-lg font-mono font-bold tracking-widest text-slate-100">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div className="flex justify-between items-end text-[10px] uppercase text-slate-400">
                    <div>
                      <div className="text-[8px] text-slate-500">CARDHOLDER</div>
                      <div className="font-bold text-white text-xs">{cardHolder || 'NAME'}</div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-500">EXPIRES</div>
                      <div className="font-bold text-white text-xs">{cardExpiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                      Card Details
                    </span>
                    <button
                      type="button"
                      onClick={handleFillDemoCard}
                      className="text-[11px] font-extrabold text-indigo-400 hover:underline"
                    >
                      ⚡ Auto-fill Test Card
                    </button>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-extrabold mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-extrabold mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-extrabold mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvc}
                        onChange={e => setCardCvc(e.target.value)}
                        placeholder="123"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={startPaymentProcessing}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" /> Pay ₱{amount.toFixed(2)} with 3D Secure
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
