import React, { useState } from 'react';
import { useOrderContext } from '../context/OrderContext';
import {
  Smartphone,
  Volume2,
  VolumeX,
  LogIn,
  LogOut,
} from 'lucide-react';
import { EmployeeSignInModal } from './Common/EmployeeSignInModal';

export const Header: React.FC = () => {
  const {
    viewMode,
    mobileFrameEnabled,
    setMobileFrameEnabled,
    activeTable,
    tables,
    selectTableByNumber,
    soundEnabled,
    setSoundEnabled,
    currentEmployee,
    logoutEmployee,
  } = useOrderContext();

  const [signInModalOpen, setSignInModalOpen] = useState(false);

  return (
    <header className="z-40 bg-slate-900/95 text-white border-b border-slate-800 shadow-md">
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          
          {/* Table selector (customer view only) */}
          {viewMode === 'customer' && (
            <div className="flex items-center justify-between sm:justify-start gap-4">
              {/* Quick Table Selector for Testing */}
              <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg px-2.5 py-1 border border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 hidden md:inline">Active Table:</span>
                <select
                  value={activeTable.tableNumber}
                  onChange={(e) => selectTableByNumber(e.target.value)}
                  className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
                >
                  {tables.map((tbl) => (
                    <option key={tbl.id} value={tbl.tableNumber} className="bg-slate-900 text-white">
                      Table #{tbl.tableNumber} ({tbl.section})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}


          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Employee Auth Status / Sign In Button */}
            {currentEmployee ? (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1 shadow-sm">
                <img
                  src={currentEmployee.photo}
                  alt={currentEmployee.firstName}
                  className="h-7 w-7 rounded-lg object-cover border border-slate-600"
                  onError={e => {
                    (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80');
                  }}
                />
                <div className="hidden sm:block text-left">
                  <div className="text-[11px] font-black text-white leading-tight">
                    {currentEmployee.firstName} {currentEmployee.lastName}
                  </div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                    {currentEmployee.role} ({currentEmployee.employeeCode})
                  </div>
                </div>

                <button
                  onClick={logoutEmployee}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition"
                  title="Sign Out Employee"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSignInModalOpen(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-md shadow-emerald-500/20 transition active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Employee Sign In</span>
              </button>
            )}

            {/* Mobile frame toggle if in customer mode */}
            {viewMode === 'customer' && (
              <button
                onClick={() => setMobileFrameEnabled(!mobileFrameEnabled)}
                className={`hidden lg:flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  mobileFrameEnabled
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>{mobileFrameEnabled ? 'Phone View' : 'Fluid View'}</span>
              </button>
            )}

            {/* Sound Chime Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
            </button>
          </div>

        </div>
      </div>

      {/* Employee Sign In Modal */}
      <EmployeeSignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
      />
    </header>
  );
};
