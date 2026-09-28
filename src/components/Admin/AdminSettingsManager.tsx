import React, { useState, useEffect, useRef } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Smartphone,
  QrCode,
  Upload,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Eye,
  Zap,
  Image as ImageIcon,
  Save,
  Copy,
  Check,
} from 'lucide-react';

export const formatTime12Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

export const AdminSettingsManager: React.FC = () => {
  const { businessSettings, updateBusinessSettings, resetBusinessSettings, showToast } =
    useOrderContext();

  // Local form state synced with businessSettings
  const [businessName, setBusinessName] = useState(businessSettings.businessName);
  const [address, setAddress] = useState(businessSettings.address);
  const [contactNumber, setContactNumber] = useState(businessSettings.contactNumber);
  const [timeOpen, setTimeOpen] = useState(businessSettings.timeOpen);
  const [timeClosed, setTimeClosed] = useState(businessSettings.timeClosed);
  const [gcashNumber, setGcashNumber] = useState(businessSettings.gcashNumber);
  const [gcashQrCode, setGcashQrCode] = useState(businessSettings.gcashQrCode);
  const [paymayaNumber, setPaymayaNumber] = useState(businessSettings.paymayaNumber);
  const [paymayaQrCode, setPaymayaQrCode] = useState(businessSettings.paymayaQrCode);

  const [previewWallet, setPreviewWallet] = useState<'gcash' | 'paymaya'>('gcash');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const gcashFileInputRef = useRef<HTMLInputElement | null>(null);
  const paymayaFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setBusinessName(businessSettings.businessName);
    setAddress(businessSettings.address);
    setContactNumber(businessSettings.contactNumber);
    setTimeOpen(businessSettings.timeOpen);
    setTimeClosed(businessSettings.timeClosed);
    setGcashNumber(businessSettings.gcashNumber);
    setGcashQrCode(businessSettings.gcashQrCode);
    setPaymayaNumber(businessSettings.paymayaNumber);
    setPaymayaQrCode(businessSettings.paymayaQrCode);
  }, [businessSettings]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    wallet: 'gcash' | 'paymaya'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (wallet === 'gcash') {
        setGcashQrCode(result);
        updateBusinessSettings({ gcashQrCode: result });
        setPreviewWallet('gcash');
        showToast('✓ GCash QR Code image uploaded & saved!');
      } else {
        setPaymayaQrCode(result);
        updateBusinessSettings({ paymayaQrCode: result });
        setPreviewWallet('paymaya');
        showToast('✓ PayMaya QR Code image uploaded & saved!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessSettings({
      businessName: businessName.trim() || 'DineFlow QR Bistro',
      address: address.trim(),
      contactNumber: contactNumber.trim(),
      timeOpen: timeOpen || '08:00',
      timeClosed: timeClosed || '22:00',
      gcashNumber: gcashNumber.trim(),
      gcashQrCode: gcashQrCode.trim(),
      paymayaNumber: paymayaNumber.trim(),
      paymayaQrCode: paymayaQrCode.trim(),
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white tracking-tight">
              Business Profile &amp; Customer Payment Settings
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure your store details, operating hours, and upload official GCash &amp; PayMaya QR codes and account numbers for customer payments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetBusinessSettings}
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-300 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Business Details + Payment QR Upload Forms */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Business Information Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-indigo-400" />
                <div>
                  <h4 className="text-sm font-black text-white">
                    01. Business Information &amp; Store Hours
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Shown on the Customer Menu, Landing Page, Digital Receipts, and QR Flyers
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Business Name */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Business / Restaurant Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. DineFlow QR Bistro"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-white font-bold placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Business Address */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Business Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. 128 Gourmet Avenue, Bonifacio Global City, Taguig"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-white font-medium placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Contact Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    placeholder="e.g. +63 917 555 0199"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-white font-mono font-bold placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Time Open & Time Closed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
                  <label className="flex items-center justify-between font-bold text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      Time Open
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                      {formatTime12Hour(timeOpen)}
                    </span>
                  </label>
                  <input
                    type="time"
                    value={timeOpen}
                    onChange={e => setTimeOpen(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5">
                  <label className="flex items-center justify-between font-bold text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      Time Closed
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {formatTime12Hour(timeClosed)}
                    </span>
                  </label>
                  <input
                    type="time"
                    value={timeClosed}
                    onChange={e => setTimeClosed(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. GCash & PayMaya Payment Settings Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <QrCode className="h-5 w-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-black text-white">
                    02. Customer Digital Payment Settings (GCash &amp; PayMaya)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Upload your official merchant QR code images and mobile numbers for customer checkout
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* GCASH CONFIGURATION */}
              <div className="rounded-2xl border border-sky-500/30 bg-sky-950/15 p-4 space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500 text-slate-950 font-black">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-white">GCash Payment</h5>
                        <p className="text-[10px] text-sky-300">Customer GCash Checkout</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-sky-400">
                      {gcashQrCode ? 'Custom QR Uploaded' : 'Auto QR Active'}
                    </span>
                  </div>

                  {/* GCash Number */}
                  <div className="text-xs">
                    <label className="block font-bold text-slate-300 mb-1">
                      GCash Mobile Number
                    </label>
                    <input
                      type="text"
                      value={gcashNumber}
                      onChange={e => setGcashNumber(e.target.value)}
                      placeholder="e.g. 0917 888 9912"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white font-mono font-bold placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  {/* GCash QR Code Upload */}
                  <div className="text-xs space-y-2">
                    <label className="block font-bold text-slate-300">
                      GCash QR Code Image
                    </label>

                    <input
                      ref={gcashFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'gcash')}
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => gcashFileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 px-3 py-2 text-xs font-black text-slate-950 transition"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload GCash QR</span>
                      </button>

                      {gcashQrCode && (
                        <button
                          type="button"
                          onClick={() => {
                            setGcashQrCode('');
                            updateBusinessSettings({ gcashQrCode: '' });
                          }}
                          className="rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 px-2.5 py-2 text-xs font-bold text-rose-300 transition"
                          title="Remove Uploaded GCash QR"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Or paste GCash QR Image URL:
                      </label>
                      <input
                        type="text"
                        value={gcashQrCode.startsWith('data:') ? '' : gcashQrCode}
                        onChange={e => setGcashQrCode(e.target.value)}
                        placeholder={
                          gcashQrCode.startsWith('data:')
                            ? 'Uploaded image file active (clear to use URL)'
                            : 'https://example.com/gcash-qr.png'
                        }
                        disabled={gcashQrCode.startsWith('data:')}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* Mini Thumbnail Preview */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-14 w-14 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden shrink-0 border border-sky-500/40">
                      {gcashQrCode ? (
                        <img
                          src={gcashQrCode}
                          alt="GCash QR Preview"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <QRCodeSVG
                          value={`GCASH|${businessName}|${gcashNumber}`}
                          size={44}
                          level="M"
                        />
                      )}
                    </div>
                    <div className="text-[11px]">
                      <div className="font-bold text-white">
                        {gcashQrCode ? 'Uploaded QR Image' : 'Dynamic QR Active'}
                      </div>
                      <div className="font-mono text-sky-400">{gcashNumber || 'No number set'}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewWallet('gcash')}
                    className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 transition"
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* PAYMAYA CONFIGURATION */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-white">PayMaya Payment</h5>
                        <p className="text-[10px] text-emerald-300">Customer PayMaya Checkout</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      {paymayaQrCode ? 'Custom QR Uploaded' : 'Auto QR Active'}
                    </span>
                  </div>

                  {/* PayMaya Number */}
                  <div className="text-xs">
                    <label className="block font-bold text-slate-300 mb-1">
                      PayMaya Mobile Number
                    </label>
                    <input
                      type="text"
                      value={paymayaNumber}
                      onChange={e => setPaymayaNumber(e.target.value)}
                      placeholder="e.g. 0918 777 6654"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white font-mono font-bold placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* PayMaya QR Code Upload */}
                  <div className="text-xs space-y-2">
                    <label className="block font-bold text-slate-300">
                      PayMaya QR Code Image
                    </label>

                    <input
                      ref={paymayaFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'paymaya')}
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => paymayaFileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 transition"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload PayMaya QR</span>
                      </button>

                      {paymayaQrCode && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymayaQrCode('');
                            updateBusinessSettings({ paymayaQrCode: '' });
                          }}
                          className="rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 px-2.5 py-2 text-xs font-bold text-rose-300 transition"
                          title="Remove Uploaded PayMaya QR"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Or paste PayMaya QR Image URL:
                      </label>
                      <input
                        type="text"
                        value={paymayaQrCode.startsWith('data:') ? '' : paymayaQrCode}
                        onChange={e => setPaymayaQrCode(e.target.value)}
                        placeholder={
                          paymayaQrCode.startsWith('data:')
                            ? 'Uploaded image file active (clear to use URL)'
                            : 'https://example.com/paymaya-qr.png'
                        }
                        disabled={paymayaQrCode.startsWith('data:')}
                        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* Mini Thumbnail Preview */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-14 w-14 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden shrink-0 border border-emerald-500/40">
                      {paymayaQrCode ? (
                        <img
                          src={paymayaQrCode}
                          alt="PayMaya QR Preview"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <QRCodeSVG
                          value={`PAYMAYA|${businessName}|${paymayaNumber}`}
                          size={44}
                          level="M"
                        />
                      )}
                    </div>
                    <div className="text-[11px]">
                      <div className="font-bold text-white">
                        {paymayaQrCode ? 'Uploaded QR Image' : 'Dynamic QR Active'}
                      </div>
                      <div className="font-mono text-emerald-400">
                        {paymayaNumber || 'No number set'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewWallet('paymaya')}
                    className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[10px] font-bold text-slate-200 transition"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-xs font-black text-white shadow-lg shadow-indigo-600/25 transition active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Business &amp; Payment Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Customer-Facing Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-xl space-y-5 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-400" />
                <h4 className="text-sm font-black text-white">
                  Live Customer Checkout &amp; Storefront Preview
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Real-Time Sync</span>
            </div>

            {/* Storefront Profile Card Preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Storefront Header &amp; Receipt Identity
              </div>
              <h3 className="text-base font-black text-white">
                {businessName || 'DineFlow QR Bistro'}
              </h3>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{address || 'Address not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{contactNumber || 'Contact not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Store Hours:{' '}
                    <strong className="text-white font-mono">
                      {formatTime12Hour(timeOpen)} – {formatTime12Hour(timeClosed)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Payment Modal Preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  Customer Payment QR &amp; Number
                </span>
                <div className="flex gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewWallet('gcash')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      previewWallet === 'gcash'
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    GCash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewWallet('paymaya')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      previewWallet === 'paymaya'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PayMaya
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 py-2">
                <div
                  className={`p-3.5 bg-white rounded-2xl border-4 shadow-xl flex items-center justify-center ${
                    previewWallet === 'gcash' ? 'border-sky-500/60' : 'border-emerald-500/60'
                  }`}
                >
                  {previewWallet === 'gcash' ? (
                    gcashQrCode ? (
                      <img
                        src={gcashQrCode}
                        alt="Customer GCash QR Code"
                        className="h-44 w-44 object-contain rounded-lg"
                      />
                    ) : (
                      <QRCodeSVG
                        value={`GCASH|${businessName}|${gcashNumber}`}
                        size={168}
                        level="H"
                      />
                    )
                  ) : paymayaQrCode ? (
                    <img
                      src={paymayaQrCode}
                      alt="Customer PayMaya QR Code"
                      className="h-44 w-44 object-contain rounded-lg"
                    />
                  ) : (
                    <QRCodeSVG
                      value={`PAYMAYA|${businessName}|${paymayaNumber}`}
                      size={168}
                      level="H"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-black text-white">
                    {businessName || 'DineFlow QR Bistro'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Scan {previewWallet === 'gcash' ? 'GCash' : 'PayMaya'} QR Code or send payment to:
                  </div>
                </div>

                {/* Account Number Pill with Copy */}
                <div className="w-full flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">
                      {previewWallet === 'gcash' ? 'GCash Account Number' : 'PayMaya Account Number'}
                    </span>
                    <span
                      className={`font-mono text-sm font-black ${
                        previewWallet === 'gcash' ? 'text-sky-400' : 'text-emerald-400'
                      }`}
                    >
                      {previewWallet === 'gcash'
                        ? gcashNumber || 'Not configured'
                        : paymayaNumber || 'Not configured'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        previewWallet === 'gcash' ? gcashNumber : paymayaNumber,
                        previewWallet === 'gcash' ? 'GCash Number' : 'PayMaya Number'
                      )
                    }
                    className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition"
                  >
                    {copiedField ===
                    (previewWallet === 'gcash' ? 'GCash Number' : 'PayMaya Number') ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
