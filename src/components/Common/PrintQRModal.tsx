import React from 'react';
import { Table } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, ExternalLink } from 'lucide-react';
import { useOrderContext } from '../../context/OrderContext';

interface PrintQRModalProps {
  table: Table | null;
  customUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintQRModal: React.FC<PrintQRModalProps> = ({
  table,
  customUrl,
  isOpen,
  onClose,
}) => {
  const { setViewMode, setActiveTable, selectTableByNumber, showToast, businessSettings } = useOrderContext();

  if (!isOpen || !table) return null;

  const targetUrl = customUrl || window.location.origin + `?table=${table.tableNumber}`;

  const handleTestScan = () => {
    setActiveTable(table);
    selectTableByNumber(table.tableNumber);
    setViewMode('customer');
    onClose();
    showToast(`Switched to Customer view for Table #${table.tableNumber}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Table QR Code Flyer</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tent Card Display */}
        <div className="my-5 flex flex-col items-center rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-50/50 to-white p-6 text-center shadow-lg dark:from-slate-900 dark:to-slate-950 dark:border-emerald-500/30">
          <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 mb-2">
            <span className="text-xs font-black tracking-widest uppercase">
              {businessSettings.businessName || 'QR BISTRO & CAFE'}
            </span>
          </div>

          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            TABLE #{table.tableNumber}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {table.name} ({table.section})
          </p>

          <div className="rounded-xl bg-white p-4 shadow-md border border-slate-200 dark:border-slate-700 dark:bg-white">
            <QRCodeSVG
              value={targetUrl}
              size={180}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=100&q=80',
                x: undefined,
                y: undefined,
                height: 32,
                width: 32,
                excavate: true,
              }}
            />
          </div>

          <p className="mt-4 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            📱 SCAN QR TO BROWSE MENU &amp; ORDER
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            No app download required. Instant contactless order.
          </p>
          <p className="mt-2 max-w-full break-all font-mono text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
            {targetUrl}
          </p>
        </div>

        <div className="space-y-2 print:hidden">
          <button
            onClick={handleTestScan}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 active:scale-95"
          >
            <ExternalLink className="h-4 w-4" />
            Simulate Scan (Open Customer View)
          </button>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Printer className="h-4 w-4" />
            Print Table Tent Card
          </button>
        </div>
      </div>
    </div>
  );
};
