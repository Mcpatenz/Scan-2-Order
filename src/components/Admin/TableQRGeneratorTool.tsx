import React, { useState, useMemo } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { useOrderContext } from '../../context/OrderContext';
import { Table } from '../../types';
import {
  QrCode,
  Link2,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Printer,
  ExternalLink,
  Sliders,
  Sparkles,
  FileDown,
  Tag,
  MapPin,
  Utensils,
  RefreshCw,
  Layers,
  Eye,
  Edit,
} from 'lucide-react';

interface CustomParam {
  id: string;
  key: string;
  value: string;
}

interface TableQRGeneratorToolProps {
  onOpenAddTableModal: () => void;
  onEditTable?: (table: Table) => void;
  onSelectPrintTable: (table: Table, customUrl?: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Classic Black', fg: '#0f172a', bg: '#ffffff' },
  { name: 'Bistro Emerald', fg: '#065f46', bg: '#ffffff' },
  { name: 'Royal Indigo', fg: '#312e81', bg: '#ffffff' },
  { name: 'Warm Espresso', fg: '#451a03', bg: '#fffbeb' },
  { name: 'Crimson Luxe', fg: '#881337', bg: '#fff1f2' },
];

export const TableQRGeneratorTool: React.FC<TableQRGeneratorToolProps> = ({
  onOpenAddTableModal,
  onEditTable,
  onSelectPrintTable,
}) => {
  const {
    tables,
    orders,
    deleteTable,
    setActiveTable,
    selectTableByNumber,
    applyDiscountCode,
    setViewMode,
    showToast,
  } = useOrderContext();

  // URL Parameter Generator State
  const [baseUrl, setBaseUrl] = useState<string>(() => window.location.origin);
  const [tableParamKey, setTableParamKey] = useState<string>('table');
  const [includeSectionParam, setIncludeSectionParam] = useState<boolean>(true);
  const [includeCapacityParam, setIncludeCapacityParam] = useState<boolean>(false);
  const [branchParam, setBranchParam] = useState<string>('central');
  const [diningModeParam, setDiningModeParam] = useState<'none' | 'dine_in' | 'takeout'>('dine_in');
  const [promoCodeParam, setPromoCodeParam] = useState<string>('');
  const [utmSourceParam, setUtmSourceParam] = useState<string>('table_qr');
  const [customParams, setCustomParams] = useState<CustomParam[]>([]);
  const [newParamKey, setNewParamKey] = useState<string>('');
  const [newParamValue, setNewParamValue] = useState<string>('');

  // QR Appearance & Encoding State
  const [qrSize, setQrSize] = useState<number>(220);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [fgColor, setFgColor] = useState<string>('#0f172a');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [includeLogo, setIncludeLogo] = useState<boolean>(true);
  const [includeMargin, setIncludeMargin] = useState<boolean>(true);

  // Selected Table for Live Inspector Preview
  const [previewTableId, setPreviewTableId] = useState<string>(() => tables[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');

  const previewTable = useMemo(
    () => tables.find(t => t.id === previewTableId) || tables[0] || null,
    [tables, previewTableId]
  );

  // Build parameterized URL for any given table
  const buildTableUrl = (table: Table): string => {
    const cleanBase = baseUrl.trim().replace(/\/+$/, '') || window.location.origin;
    const params = new URLSearchParams();

    const keyName = tableParamKey.trim() || 'table';
    params.set(keyName, table.tableNumber);

    if (includeSectionParam && table.section) {
      params.set('section', table.section.toLowerCase().replace(/\s+/g, '_'));
    }
    if (includeCapacityParam && table.capacity) {
      params.set('seats', String(table.capacity));
    }
    if (branchParam.trim()) {
      params.set('branch', branchParam.trim());
    }
    if (diningModeParam !== 'none') {
      params.set('mode', diningModeParam);
    }
    if (promoCodeParam.trim()) {
      params.set('promo', promoCodeParam.trim().toUpperCase());
    }
    if (utmSourceParam.trim()) {
      params.set('utm_source', utmSourceParam.trim());
    }

    customParams.forEach(cp => {
      if (cp.key.trim() && cp.value.trim()) {
        params.set(cp.key.trim(), cp.value.trim());
      }
    });

    return `${cleanBase}/?${params.toString()}`;
  };

  const handleAddCustomParam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParamKey.trim() || !newParamValue.trim()) return;
    setCustomParams(prev => [
      ...prev,
      {
        id: `cp-${Date.now()}`,
        key: newParamKey.trim().replace(/[^a-zA-Z0-9_-]/g, ''),
        value: newParamValue.trim(),
      },
    ]);
    setNewParamKey('');
    setNewParamValue('');
  };

  const handleRemoveCustomParam = (id: string) => {
    setCustomParams(prev => prev.filter(p => p.id !== id));
  };

  const handleCopyUrl = async (table: Table) => {
    const url = buildTableUrl(table);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(table.id);
      showToast(`✓ Copied unique QR URL for Table #${table.tableNumber}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast(`URL: ${url}`);
    }
  };

  // Download single Table QR as high-res PNG badge with Table label & URL
  const handleDownloadPng = (table: Table) => {
    const sourceCanvas = document.getElementById(`qr-canvas-${table.id}`) as HTMLCanvasElement | null;
    if (!sourceCanvas) {
      showToast('Could not locate QR canvas for export.');
      return;
    }

    const outCanvas = document.createElement('canvas');
    const pad = 40;
    const headerHeight = 90;
    const footerHeight = 75;
    const qrDim = 360;
    outCanvas.width = qrDim + pad * 2;
    outCanvas.height = qrDim + headerHeight + footerHeight;

    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    // Card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

    // Top accent bar
    ctx.fillStyle = fgColor;
    ctx.fillRect(0, 0, outCanvas.width, 12);

    // Header text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`TABLE #${table.tableNumber}`, outCanvas.width / 2, 52);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 14px sans-serif';
    ctx.fillText(`${table.name} • ${table.section} (${table.capacity} Seats)`, outCanvas.width / 2, 76);

    // Draw QR code from source canvas
    ctx.drawImage(sourceCanvas, pad, headerHeight, qrDim, qrDim);

    // Footer text
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('SCAN TO BROWSE MENU & ORDER', outCanvas.width / 2, headerHeight + qrDim + 28);

    const url = buildTableUrl(table);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    const truncatedUrl = url.length > 52 ? url.slice(0, 49) + '...' : url;
    ctx.fillText(truncatedUrl, outCanvas.width / 2, headerHeight + qrDim + 50);

    const dataUrl = outCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Table-${table.tableNumber}-QR.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast(`Downloaded Table #${table.tableNumber} QR Code (PNG)`);
  };

  // Download single Table QR as SVG vector file
  const handleDownloadSvg = (table: Table) => {
    const svgEl = document.getElementById(`qr-svg-${table.id}`);
    if (!svgEl) {
      showToast('Could not locate QR SVG element.');
      return;
    }

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `Table-${table.tableNumber}-QR.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(svgUrl);

    showToast(`Downloaded Table #${table.tableNumber} Vector QR (SVG)`);
  };

  // Batch Download All Tables as Printable PDF Sheet
  const handleDownloadAllPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const cols = 2;
    const cardW = 88;
    const cardH = 115;
    const marginX = 14;
    const marginY = 18;
    const gapX = 6;
    const gapY = 8;

    tables.forEach((table, index) => {
      if (index > 0 && index % 4 === 0) {
        doc.addPage();
      }
      const posOnPage = index % 4;
      const col = posOnPage % cols;
      const row = Math.floor(posOnPage / cols);
      const x = marginX + col * (cardW + gapX);
      const y = marginY + row * (cardH + gapY);

      // Card border
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, cardW, cardH, 4, 4, 'S');

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text('QR BISTRO & CAFE', x + cardW / 2, y + 10, { align: 'center' });

      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text(`TABLE #${table.tableNumber}`, x + cardW / 2, y + 19, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`${table.name} • ${table.section}`, x + cardW / 2, y + 25, { align: 'center' });

      // Grab QR canvas image
      const canvasEl = document.getElementById(`qr-canvas-${table.id}`) as HTMLCanvasElement | null;
      if (canvasEl) {
        const imgData = canvasEl.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', x + (cardW - 58) / 2, y + 29, 58, 58);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('SCAN QR TO ORDER AT YOUR TABLE', x + cardW / 2, y + 95, { align: 'center' });

      const fullUrl = buildTableUrl(table);
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const shortUrl = fullUrl.length > 48 ? fullUrl.slice(0, 45) + '...' : fullUrl;
      doc.text(shortUrl, x + cardW / 2, y + 102, { align: 'center' });

      if (promoCodeParam.trim()) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(217, 119, 6);
        doc.text(`Auto-Promo: ${promoCodeParam.trim().toUpperCase()}`, x + cardW / 2, y + 109, {
          align: 'center',
        });
      }
    });

    doc.save(`All-Tables-QR-Codes-${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast(`Downloaded PDF sheet with ${tables.length} unique Table QR codes!`);
  };

  // Export CSV of all generated Table URLs
  const handleExportUrlsCsv = () => {
    const headers = ['Table ID', 'Table Number', 'Name', 'Section', 'Capacity', 'Generated QR URL'];
    const rows = tables.map(t => [
      t.id,
      t.tableNumber,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.section}"`,
      String(t.capacity),
      `"${buildTableUrl(t)}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent([headers.join(','), ...rows.map(r => r.join(','))].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `table_qr_urls_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Exported all Table QR URLs to CSV!');
  };

  const handleSimulateParameterizedScan = (table: Table) => {
    setActiveTable(table);
    selectTableByNumber(table.tableNumber);
    if (promoCodeParam.trim()) {
      applyDiscountCode(promoCodeParam.trim());
    }
    setViewMode('customer');
    showToast(
      `Simulated scan for Table #${table.tableNumber}${
        promoCodeParam.trim() ? ` with promo ${promoCodeParam.trim().toUpperCase()}` : ''
      }`
    );
  };

  const filteredTables = useMemo(() => {
    if (sectionFilter === 'ALL') return tables;
    return tables.filter(t => t.section === sectionFilter);
  }, [tables, sectionFilter]);

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              Table QR Code Studio &amp; URL Parameter Generator
            </h3>
            <p className="text-xs text-slate-400">
              Configure dynamic deep-link parameters, customize QR appearance, and download print-ready PNG, SVG, or PDF sheets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadAllPdf}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition active:scale-95"
          >
            <FileDown className="h-4 w-4" />
            <span>Download All QRs (PDF)</span>
          </button>

          <button
            onClick={handleExportUrlsCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 transition"
          >
            <Download className="h-4 w-4 text-sky-400" />
            <span>Export URLs (CSV)</span>
          </button>

          <button
            onClick={onOpenAddTableModal}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-black text-white hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Table</span>
          </button>
        </div>
      </div>

      {/* Builder Grid: URL Parameter Generator (Left) + Live QR Inspector & Customizer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 7 COLS: URL Parameter Generator */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-indigo-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Dynamic URL Parameter Generator
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                setBaseUrl(window.location.origin);
                setTableParamKey('table');
                setIncludeSectionParam(true);
                setIncludeCapacityParam(false);
                setBranchParam('central');
                setDiningModeParam('dine_in');
                setPromoCodeParam('');
                setUtmSourceParam('table_qr');
                setCustomParams([]);
                showToast('Reset URL parameters to default');
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-white"
            >
              <RefreshCw className="h-3 w-3" /> Reset Defaults
            </button>
          </div>

          {/* Base URL & Table Key */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Base Ordering URL / Domain
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://order.restaurant.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Table Parameter Key
              </label>
              <input
                type="text"
                value={tableParamKey}
                onChange={e => setTableParamKey(e.target.value)}
                placeholder="table"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-indigo-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Built-in Deep-Link Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                <MapPin className="inline h-3 w-3 mr-1 text-emerald-400" />
                Branch Identifier (`branch=`)
              </label>
              <input
                type="text"
                value={branchParam}
                onChange={e => setBranchParam(e.target.value)}
                placeholder="e.g. central, downtown (leave blank to omit)"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                <Utensils className="inline h-3 w-3 mr-1 text-sky-400" />
                Default Dining Mode (`mode=`)
              </label>
              <select
                value={diningModeParam}
                onChange={e => setDiningModeParam(e.target.value as 'none' | 'dine_in' | 'takeout')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="dine_in">dine_in (Dine-In Table Service)</option>
                <option value="takeout">takeout (Express Takeout)</option>
                <option value="none">Omit parameter</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                <Tag className="inline h-3 w-3 mr-1 text-amber-400" />
                Auto-Apply Promo Code (`promo=`)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={promoCodeParam}
                  onChange={e => setPromoCodeParam(e.target.value.toUpperCase())}
                  placeholder="Optional (e.g. WELCOME10)"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs uppercase font-bold text-amber-300 placeholder:normal-case placeholder:font-normal focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPromoCodeParam(prev => (prev === 'WELCOME10' ? '' : 'WELCOME10'))
                  }
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black text-amber-300 hover:bg-amber-500/20 shrink-0"
                >
                  WELCOME10
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Campaign / Source Tag (`utm_source=`)
              </label>
              <input
                type="text"
                value={utmSourceParam}
                onChange={e => setUtmSourceParam(e.target.value)}
                placeholder="e.g. table_qr, tent_card"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Toggle Checkboxes for Table Metadata */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSectionParam}
                onChange={e => setIncludeSectionParam(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Include Table Section (`section=main_hall`)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCapacityParam}
                onChange={e => setIncludeCapacityParam(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Include Seat Capacity (`seats=4`)</span>
            </label>
          </div>

          {/* Custom Key=Value Query Parameters */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Custom URL Query Parameters
            </label>

            <form onSubmit={handleAddCustomParam} className="flex gap-2">
              <input
                type="text"
                placeholder="Parameter key (e.g. waiter)"
                value={newParamKey}
                onChange={e => setNewParamKey(e.target.value)}
                className="w-1/3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Parameter value (e.g. marco)"
                value={newParamValue}
                onChange={e => setNewParamValue(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-indigo-500 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add Param
              </button>
            </form>

            {customParams.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {customParams.map(cp => (
                  <span
                    key={cp.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-mono text-indigo-300"
                  >
                    <span>
                      {cp.key}=<strong className="text-white">{cp.value}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomParam(cp.id)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Live Generated URL Preview Bar */}
          {previewTable && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                  Generated URL Preview (Table #{previewTable.tableNumber})
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewTable)}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-indigo-500"
                >
                  {copiedId === previewTable.id ? (
                    <>
                      <Check className="h-3 w-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy Link
                    </>
                  )}
                </button>
              </div>
              <p className="break-all font-mono text-xs text-emerald-300 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
                {buildTableUrl(previewTable)}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT 5 COLS: QR Style Customizer & Live Preview */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  QR Appearance &amp; Inspector
                </h4>
              </div>
              {previewTable && (
                <select
                  value={previewTable.id}
                  onChange={e => setPreviewTableId(e.target.value)}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-bold text-emerald-400"
                >
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>
                      Inspect: Table #{t.tableNumber} ({t.section})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                Color Theme Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setFgColor(preset.fg);
                      setBgColor(preset.bg);
                    }}
                    className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
                      fgColor === preset.fg
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.fg }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Correction & Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Error Correction Level
                </label>
                <select
                  value={errorLevel}
                  onChange={e => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs text-white"
                >
                  <option value="L">Level L (7% recovery)</option>
                  <option value="M">Level M (15% recovery)</option>
                  <option value="Q">Level Q (25% recovery)</option>
                  <option value="H">Level H (30% Best Print)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Export Resolution
                </label>
                <select
                  value={qrSize}
                  onChange={e => setQrSize(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs text-white"
                >
                  <option value={180}>180×180 px (Compact)</option>
                  <option value={220}>220×220 px (Standard)</option>
                  <option value={300}>300×300 px (High-Res)</option>
                  <option value={400}>400×400 px (Print Master)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={e => setIncludeLogo(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
                <span>Embed Center Bistro Logo</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMargin}
                  onChange={e => setIncludeMargin(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
                <span>Quiet Zone Margin</span>
              </label>
            </div>
          </div>

          {/* Live Preview Card */}
          {previewTable && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col items-center text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">
                LIVE TABLE TENT PREVIEW • TABLE #{previewTable.tableNumber}
              </span>
              <div
                className="my-2 rounded-2xl p-3 shadow-lg border border-slate-700/50"
                style={{ backgroundColor: bgColor }}
              >
                <QRCodeSVG
                  value={buildTableUrl(previewTable)}
                  size={150}
                  level={errorLevel}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  includeMargin={includeMargin}
                  imageSettings={
                    includeLogo
                      ? {
                          src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=100&q=80',
                          x: undefined,
                          y: undefined,
                          height: 28,
                          width: 28,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2 w-full">
                <button
                  type="button"
                  onClick={() => handleDownloadPng(previewTable)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 px-3 text-xs font-black text-white hover:bg-emerald-500"
                >
                  <Download className="h-3.5 w-3.5" /> PNG
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSvg(previewTable)}
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-600 py-2 px-3 text-xs font-black text-white hover:bg-indigo-500"
                >
                  <Download className="h-3.5 w-3.5" /> SVG
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateParameterizedScan(previewTable)}
                  className="flex items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-950 py-2 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800"
                  title="Test Scan with Parameters"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-400" /> Test
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Filter Bar for All Tables */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <h4 className="text-sm font-black text-white">
            All Generated Table QR Codes ({filteredTables.length})
          </h4>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {['ALL', 'Main Hall', 'Patio', 'VIP Room', 'Bar Area'].map(sec => (
            <button
              key={sec}
              onClick={() => setSectionFilter(sec)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                sectionFilter === sec
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {sec === 'ALL' ? 'All Sections' : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of All Tables with Individual QR Download & Parameterized URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map(tbl => {
          const parameterizedUrl = buildTableUrl(tbl);
          const isCopied = copiedId === tbl.id;
          const activeOrder = orders.find(
            o =>
              (o.tableId === tbl.id || o.tableNumber === tbl.tableNumber) &&
              o.status !== 'completed' &&
              o.status !== 'cancelled'
          );
          const isOccupied = Boolean(activeOrder) || tbl.status === 'occupied';

          return (
            <div
              key={tbl.id}
              className={`rounded-3xl border bg-slate-950 p-5 shadow-lg flex flex-col justify-between transition ${
                isOccupied
                  ? 'border-amber-500/40 hover:border-amber-400/60'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-white">TABLE #{tbl.tableNumber}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                          isOccupied
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : tbl.status === 'reserved'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isOccupied
                          ? activeOrder
                            ? `Active (${activeOrder.id})`
                            : 'Occupied'
                          : tbl.status === 'reserved'
                          ? 'Reserved'
                          : 'Vacant'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {tbl.name} • {tbl.section}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900 border border-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                    {tbl.capacity} Seats
                  </span>
                </div>

                {/* Visible SVG QR Code + Hidden High-Res Canvas for PNG/PDF Export */}
                <div
                  className="my-3 flex justify-center p-3.5 rounded-2xl border border-slate-800/60"
                  style={{ backgroundColor: bgColor }}
                >
                  <QRCodeSVG
                    id={`qr-svg-${tbl.id}`}
                    value={parameterizedUrl}
                    size={145}
                    level={errorLevel}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    includeMargin={includeMargin}
                    imageSettings={
                      includeLogo
                        ? {
                            src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=100&q=80',
                            x: undefined,
                            y: undefined,
                            height: 26,
                            width: 26,
                            excavate: true,
                          }
                        : undefined
                    }
                  />
                  <div className="hidden">
                    <QRCodeCanvas
                      id={`qr-canvas-${tbl.id}`}
                      value={parameterizedUrl}
                      size={qrSize}
                      level={errorLevel}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      includeMargin={includeMargin}
                    />
                  </div>
                </div>

                {/* Parameterized URL Box */}
                <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Unique Parameterized URL
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(tbl)}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="truncate font-mono text-[11px] text-emerald-400" title={parameterizedUrl}>
                    {parameterizedUrl}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadPng(tbl)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2 px-3 text-xs font-bold text-white hover:bg-indigo-500 transition active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadSvg(tbl)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 border border-slate-700 py-2 px-3 text-xs font-bold text-slate-200 hover:bg-slate-800 transition active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5 text-sky-400" />
                    <span>Download SVG</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulateParameterizedScan(tbl)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Simulate Scan (Customer View)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectPrintTable(tbl, parameterizedUrl)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
                  >
                    <Printer className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Print Tent Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewTableId(tbl.id)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                    title="Inspect in QR Studio"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>

                  {onEditTable && (
                    <button
                      type="button"
                      onClick={() => onEditTable(tbl)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:bg-indigo-600 hover:text-white transition"
                      title="Edit Table"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteTable(tbl.id)}
                    className="p-2 rounded-xl bg-red-950 text-red-400 border border-red-900/50 hover:bg-red-900"
                    title="Delete Table"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
