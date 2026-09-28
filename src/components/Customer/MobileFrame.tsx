import React from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Wifi, Battery, Signal } from 'lucide-react';
import { MobilePushNotification } from './MobilePushNotification';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const { mobileFrameEnabled } = useOrderContext();

  if (!mobileFrameEnabled) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        <MobilePushNotification />
        {children}
      </div>
    );
  }

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="flex justify-center items-center py-4 px-2 min-h-[calc(100vh-64px)] bg-slate-900/60 print:block print:p-0 print:min-h-0 print:bg-white">
      {/* iPhone Device Chassis */}
      <div className="relative w-full max-w-[420px] h-[840px] bg-slate-950 rounded-[50px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 overflow-hidden flex flex-col print:max-w-none print:h-auto print:bg-white print:rounded-none print:p-0 print:shadow-none print:border-none print:ring-0 print:overflow-visible">
        
        {/* Dynamic Island / Camera Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 h-5 w-28 bg-black rounded-full flex items-center justify-between px-3 print:hidden">
          <div className="h-2 w-2 rounded-full bg-emerald-500/80 animate-pulse"></div>
          <div className="h-2.5 w-2.5 rounded-full bg-slate-800"></div>
        </div>

        {/* Status Bar */}
        <div className="pt-2 px-6 pb-1 flex justify-between items-center text-slate-400 text-[11px] font-semibold z-40 select-none bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 rounded-t-[38px] print:hidden">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1.5">
            <Signal className="h-3 w-3 text-slate-400" />
            <Wifi className="h-3 w-3 text-slate-400" />
            <Battery className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
          </div>
        </div>

        {/* Screen Content Container */}
        <div className="relative flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto rounded-b-[38px] scrollbar-none flex flex-col print:bg-white print:overflow-visible print:rounded-none">
          <MobilePushNotification />
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-600/60 rounded-full z-50 print:hidden"></div>
      </div>
    </div>
  );
};
