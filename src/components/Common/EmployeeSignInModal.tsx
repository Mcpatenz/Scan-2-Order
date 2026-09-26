import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import {
  LogIn,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface EmployeeSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeSignInModal: React.FC<EmployeeSignInModalProps> = ({ isOpen, onClose }) => {
  const { loginEmployee, employees } = useOrderContext();

  const [emailOrCode, setEmailOrCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailOrCode.trim() || !password.trim()) {
      setErrorMsg('Please enter both Email/Employee Code and Password.');
      return;
    }

    const success = loginEmployee(emailOrCode, password);
    if (success) {
      setEmailOrCode('');
      setPassword('');
      onClose();
    } else {
      setErrorMsg('Invalid email/code or password. Please verify credentials.');
    }
  };

  // Quick fill demo helper
  const handleDemoFill = (email: string, pass: string) => {
    setEmailOrCode(email);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-950 rounded-3xl border border-slate-800 p-6 sm:p-8 text-white shadow-2xl space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-black text-slate-950 shadow-xl shadow-emerald-500/20">
            <LogIn className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Employee Sign In</h2>
          <p className="text-xs text-slate-400">
            Sign in to access your role dashboard (Admin, Cashier, or Kitchen)
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-300 mb-1.5">
              Email or Employee Code
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={emailOrCode}
                onChange={e => setEmailOrCode(e.target.value)}
                placeholder="e.g. admin@restaurant.com or EMP-101"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                title={showPassword ? 'Hide Password' : 'View Password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 transition active:scale-98 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="h-4 w-4" /> Sign In to Dashboard
          </button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-slate-400 uppercase tracking-wider">Demo Accounts</span>
            <span className="text-[10px] text-slate-500">Click to quick-fill</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('admin@restaurant.com', 'admin123')}
              className="p-2 bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left text-[11px] transition"
            >
              <div className="font-black text-indigo-400">Admin</div>
              <div className="text-[10px] text-slate-500 truncate">admin123</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('cashier@restaurant.com', 'cashier123')}
              className="p-2 bg-slate-900 hover:bg-sky-950/60 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left text-[11px] transition"
            >
              <div className="font-black text-sky-400">Cashier</div>
              <div className="text-[10px] text-slate-500 truncate">cashier123</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoFill('kitchen@restaurant.com', 'kitchen123')}
              className="p-2 bg-slate-900 hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left text-[11px] transition"
            >
              <div className="font-black text-amber-400">Kitchen</div>
              <div className="text-[10px] text-slate-500 truncate">kitchen123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
