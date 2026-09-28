import React, { useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import {
  LogIn,
  UserPlus,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowLeft,
} from 'lucide-react';

interface EmployeeSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeSignInModal: React.FC<EmployeeSignInModalProps> = ({ isOpen, onClose }) => {
  const { loginEmployee, addEmployee, employees } = useOrderContext();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [emailOrCode, setEmailOrCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
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

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('Please fill in your name, email, and password to register.');
      return;
    }

    const emailExists = employees.some(
      emp => emp.email.toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (emailExists) {
      setErrorMsg('An account with this email already exists. Please sign in.');
      return;
    }

    const newCustomerCode = `CUS-${Math.floor(100 + Math.random() * 900)}`;
    addEmployee({
      firstName: firstName.trim(),
      middleName: '',
      lastName: lastName.trim(),
      gender: 'Other',
      status: 'Active',
      birthDate: '1998-01-01',
      address: address.trim() || 'Central District',
      contactNumber: contactNumber.trim() || '+1 (555) 010-9999',
      email: regEmail.trim(),
      password: regPassword,
      photo:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      role: 'customer',
      employeeCode: newCustomerCode,
      pinCode: '0000',
    });

    // Automatically log in the newly registered customer
    setTimeout(() => {
      loginEmployee(regEmail.trim(), regPassword);
      setFirstName('');
      setLastName('');
      setRegEmail('');
      setContactNumber('');
      setAddress('');
      setRegPassword('');
      setMode('login');
      onClose();
    }, 50);
  };

  // Quick fill demo helper
  const handleDemoFill = (email: string, pass: string) => {
    setMode('login');
    setEmailOrCode(email);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-950 rounded-3xl border border-slate-800 p-6 sm:p-8 text-white shadow-2xl space-y-5 my-8">
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
            {mode === 'login' ? <LogIn className="h-7 w-7" /> : <UserPlus className="h-7 w-7" />}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? 'Sign in to your account or register a new customer profile.'
              : 'Register your customer account to order and earn loyalty rewards.'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {mode === 'login' ? (
          <>
            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="relative">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="employee-sign-in-identity"
                    type="text"
                    required
                    value={emailOrCode}
                    onChange={e => setEmailOrCode(e.target.value)}
                    placeholder=" "
                    className="peer w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                  <label
                    htmlFor="employee-sign-in-identity"
                    className="absolute left-10 top-0 -translate-y-1/2 bg-slate-900 px-1 text-[10px] font-bold text-emerald-400 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-500 peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-emerald-400"
                  >
                    Email or Employee Code
                  </label>
                </div>
                <p className="mt-1.5 pl-1 text-[10px] text-slate-500">
                  Use your email address or employee code.
                </p>
              </div>

              <div className="relative">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="employee-sign-in-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder=" "
                    className="peer w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-3.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                  <label
                    htmlFor="employee-sign-in-password"
                    className="absolute left-10 top-0 -translate-y-1/2 bg-slate-900 px-1 text-[10px] font-bold text-emerald-400 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-500 peer-focus:top-0 peer-focus:text-[10px] peer-focus:text-emerald-400"
                  >
                    Password
                  </label>
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

              {/* Register Button at the Login Page */}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('register');
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 font-black text-xs py-3 rounded-xl transition active:scale-98 flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" /> Register New Account
              </button>
            </form>

            {/* Quick Demo Credentials Assistant */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-slate-400 uppercase tracking-wider">
                  Demo Accounts
                </span>
                <span className="text-[10px] text-slate-500">Click to quick-fill</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoFill('customer@restaurant.com', 'customer123')}
                  className="p-2 bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left text-[11px] transition"
                >
                  <div className="font-black text-emerald-400">Customer</div>
                  <div className="text-[10px] text-slate-500 truncate">customer123</div>
                </button>

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
          </>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="First Name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Last Name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="tel"
                placeholder="Phone Number (Optional)"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Address (Optional)"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Create Password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 transition active:scale-98 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" /> Complete Registration
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setMode('login');
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
