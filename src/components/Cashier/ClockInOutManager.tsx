import React, { useState, useEffect } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { ClockStatus, ClockLog, EmployeeSchedule } from '../../types';
import {
  Clock,
  UserCheck,
  Coffee,
  LogOut,
  LogIn,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Shield,
  Search,
  Filter,
  History,
  Users,
  Award,
  Sparkles,
  KeyRound,
  FileText,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { playChime } from '../../utils/audio';
import { MonthlyTimesheetView } from './MonthlyTimesheetView';

const INITIAL_SCHEDULES: EmployeeSchedule[] = [
  {
    employeeId: 'cash-101',
    employeeName: 'Sarah Jenkins',
    role: 'Head Cashier',
    employeeCode: 'EMP-9021',
    scheduledShift: '08:00 AM - 04:00 PM',
    scheduledHours: 8.0,
    status: 'clocked_in',
    lastClockIn: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
    totalHoursWorkedToday: 3.5,
    pinCode: '1234',
  },
  {
    employeeId: 'cash-102',
    employeeName: 'Alex Mercer',
    role: 'Senior Cashier',
    employeeCode: 'EMP-9022',
    scheduledShift: '04:00 PM - 12:00 AM',
    scheduledHours: 8.0,
    status: 'clocked_out',
    totalHoursWorkedToday: 0,
    pinCode: '2222',
  },
  {
    employeeId: 'cash-103',
    employeeName: 'Marcus Vance',
    role: 'POS Specialist',
    employeeCode: 'EMP-9023',
    scheduledShift: '08:00 AM - 04:00 PM',
    scheduledHours: 8.0,
    status: 'on_break',
    lastClockIn: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    breakStartTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    totalHoursWorkedToday: 3.75,
    pinCode: '3333',
  },
  {
    employeeId: 'cash-104',
    employeeName: 'Elena Rostova',
    role: 'Cashier & Supervisor',
    employeeCode: 'EMP-9024',
    scheduledShift: '12:00 PM - 08:00 PM',
    scheduledHours: 8.0,
    status: 'clocked_in',
    lastClockIn: new Date(Date.now() - 1.2 * 3600 * 1000).toISOString(),
    totalHoursWorkedToday: 1.2,
    pinCode: '4444',
  },
  {
    employeeId: 'staff-105',
    employeeName: 'David Kim',
    role: 'Head Chef',
    employeeCode: 'EMP-9025',
    scheduledShift: '07:30 AM - 03:30 PM',
    scheduledHours: 8.0,
    status: 'clocked_in',
    lastClockIn: new Date(Date.now() - 4.2 * 3600 * 1000).toISOString(),
    totalHoursWorkedToday: 4.2,
    pinCode: '5555',
  },
  {
    employeeId: 'staff-106',
    employeeName: 'Maria Santos',
    role: 'Lead Barista',
    employeeCode: 'EMP-9026',
    scheduledShift: '08:00 AM - 04:00 PM',
    scheduledHours: 8.0,
    status: 'clocked_in',
    lastClockIn: new Date(Date.now() - 3.8 * 3600 * 1000).toISOString(),
    totalHoursWorkedToday: 3.8,
    pinCode: '6666',
  },
];

const INITIAL_LOGS: ClockLog[] = [
  {
    id: 'log-1',
    employeeId: 'cash-101',
    employeeName: 'Sarah Jenkins',
    type: 'clock_in',
    timestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
    notes: 'Morning shift started on time. Register cash verified.',
  },
  {
    id: 'log-2',
    employeeId: 'cash-103',
    employeeName: 'Marcus Vance',
    type: 'clock_in',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    notes: 'Covering register 2.',
  },
  {
    id: 'log-3',
    employeeId: 'cash-103',
    employeeName: 'Marcus Vance',
    type: 'break_start',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    notes: '15-min meal break.',
  },
];

export const ClockInOutManager: React.FC = () => {
  const { activeCashier, showToast, soundEnabled } = useOrderContext();

  // Employee Schedules State
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>(() => {
    const saved = localStorage.getItem('qr_app_employee_schedules');
    return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
  });

  // Clock Logs State
  const [clockLogs, setClockLogs] = useState<ClockLog[]>(() => {
    const saved = localStorage.getItem('qr_app_clock_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  // Realtime Live Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('qr_app_employee_schedules', JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem('qr_app_clock_logs', JSON.stringify(clockLogs));
  }, [clockLogs]);

  // View Controls
  const [activeTab, setActiveTab] = useState<'clock_terminal' | 'roster' | 'logs' | 'timesheet'>('clock_terminal');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clocked_in' | 'on_break' | 'clocked_out'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // PIN Code Modal State
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [targetAction, setTargetAction] = useState<'clock_in' | 'break_start' | 'break_end' | 'clock_out' | null>(null);
  const [inputPin, setInputPin] = useState('');
  const [shiftNoteInput, setShiftNoteInput] = useState('');
  const [selectedStaffForAction, setSelectedStaffForAction] = useState<EmployeeSchedule | null>(null);

  // Find logged-in staff schedule profile
  const currentStaffProfile = schedules.find(
    s => s.employeeId === activeCashier.id || s.employeeName === activeCashier.name
  ) || {
    employeeId: activeCashier.id,
    employeeName: activeCashier.name,
    role: activeCashier.role,
    employeeCode: activeCashier.employeeCode,
    scheduledShift: activeCashier.shift,
    scheduledHours: 8.0,
    status: 'clocked_in' as ClockStatus,
    totalHoursWorkedToday: 3.5,
    pinCode: '1234',
  };

  // Helper to format duration
  const getElapsedTimeString = (startIso?: string) => {
    if (!startIso) return '0h 0m';
    const start = new Date(startIso).getTime();
    const now = currentTime.getTime();
    const diffMs = Math.max(0, now - start);
    const hrs = Math.floor(diffMs / (1000 * 3600));
    const mins = Math.floor((diffMs % (1000 * 3600)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  // Trigger Action with PIN check
  const openActionModal = (
    staff: EmployeeSchedule,
    action: 'clock_in' | 'break_start' | 'break_end' | 'clock_out'
  ) => {
    setSelectedStaffForAction(staff);
    setTargetAction(action);
    setInputPin('');
    setShiftNoteInput('');
    setPinModalOpen(true);
  };

  const handleConfirmClockAction = () => {
    if (!selectedStaffForAction || !targetAction) return;

    // PIN check
    if (inputPin !== selectedStaffForAction.pinCode && inputPin !== '1234') {
      showToast('Incorrect PIN! Default PIN is 1234.');
      return;
    }

    const nowIso = new Date().toISOString();
    const staffId = selectedStaffForAction.employeeId;

    setSchedules(prev =>
      prev.map(emp => {
        if (emp.employeeId !== staffId) return emp;

        if (targetAction === 'clock_in') {
          return {
            ...emp,
            status: 'clocked_in',
            lastClockIn: nowIso,
            breakStartTime: undefined,
          };
        } else if (targetAction === 'break_start') {
          return {
            ...emp,
            status: 'on_break',
            breakStartTime: nowIso,
          };
        } else if (targetAction === 'break_end') {
          return {
            ...emp,
            status: 'clocked_in',
            breakStartTime: undefined,
          };
        } else if (targetAction === 'clock_out') {
          // Calculate worked duration
          let addedHours = 0;
          if (emp.lastClockIn) {
            const diffMs = new Date().getTime() - new Date(emp.lastClockIn).getTime();
            addedHours = Math.round((diffMs / (1000 * 3600)) * 10) / 10;
          }
          return {
            ...emp,
            status: 'clocked_out',
            lastClockOut: nowIso,
            totalHoursWorkedToday: emp.totalHoursWorkedToday + addedHours,
            breakStartTime: undefined,
          };
        }
        return emp;
      })
    );

    // Create log entry
    const actionTitles: Record<string, string> = {
      clock_in: 'Clocked In to Shift',
      break_start: 'Started Meal Break',
      break_end: 'Ended Break & Resumed',
      clock_out: 'Clocked Out from Shift',
    };

    const newLog: ClockLog = {
      id: `log-${Date.now()}`,
      employeeId: selectedStaffForAction.employeeId,
      employeeName: selectedStaffForAction.employeeName,
      type: targetAction,
      timestamp: nowIso,
      notes: shiftNoteInput.trim() || actionTitles[targetAction],
    };

    setClockLogs(prev => [newLog, ...prev]);

    if (soundEnabled) playChime('success');
    showToast(`✓ ${selectedStaffForAction.employeeName} ${actionTitles[targetAction]}!`);

    setPinModalOpen(false);
  };

  // Filter schedules
  const filteredSchedules = schedules.filter(s => {
    const matchesSearch =
      s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return matchesSearch;
  });

  const activeClockedInCount = schedules.filter(s => s.status === 'clocked_in').length;
  const onBreakCount = schedules.filter(s => s.status === 'on_break').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black shadow-lg shadow-emerald-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Staff Clock-In & Schedule Terminal</h2>
            <p className="text-xs text-slate-400">Timecard punches, shift schedule roster & active employee monitoring</p>
          </div>
        </div>

        {/* Live Digital Clock Widget */}
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-black text-white font-mono leading-none">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Terminal View Navigation */}
      <div className="flex rounded-2xl bg-slate-950 p-1.5 border border-slate-800 text-xs font-bold w-full sm:w-auto self-start">
        <button
          onClick={() => setActiveTab('clock_terminal')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition ${
            activeTab === 'clock_terminal'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" /> My Clock Terminal
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition ${
            activeTab === 'roster'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" /> Active Staff Roster ({activeClockedInCount + onBreakCount})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition ${
            activeTab === 'logs'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="h-4 w-4" /> Timecard Logs
        </button>
        <button
          onClick={() => setActiveTab('timesheet')}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition ${
            activeTab === 'timesheet'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Monthly Timesheet
        </button>
      </div>

      {/* TAB 1: MY CLOCK TERMINAL */}
      {activeTab === 'clock_terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Cashier Punch Card */}
          <div className="lg:col-span-2 rounded-3xl bg-slate-950 p-6 border border-slate-800 shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 text-lg font-black">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{currentStaffProfile.employeeName}</h3>
                    <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                      {currentStaffProfile.employeeCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {currentStaffProfile.role} • Scheduled: {currentStaffProfile.scheduledShift}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {currentStaffProfile.status === 'clocked_in' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                    CLOCKED IN (ACTIVE SHIFT)
                  </span>
                )}
                {currentStaffProfile.status === 'on_break' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black">
                    <Coffee className="h-4 w-4 text-amber-400 animate-bounce" />
                    ON MEAL BREAK
                  </span>
                )}
                {currentStaffProfile.status === 'clocked_out' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-black">
                    OFF SHIFT / CLOCKED OUT
                  </span>
                )}
              </div>
            </div>

            {/* Current Shift Timer Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 text-center space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Current Shift Duration</p>
                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {currentStaffProfile.status === 'clocked_in'
                    ? getElapsedTimeString(currentStaffProfile.lastClockIn)
                    : currentStaffProfile.status === 'on_break'
                    ? 'Break In Progress'
                    : '0h 0m'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {currentStaffProfile.lastClockIn
                    ? `In at ${new Date(currentStaffProfile.lastClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                    : 'Not clocked in'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 text-center space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Break Duration</p>
                <p className="text-2xl font-black text-amber-400 font-mono">
                  {currentStaffProfile.status === 'on_break'
                    ? getElapsedTimeString(currentStaffProfile.breakStartTime)
                    : '00m 00s'}
                </p>
                <p className="text-[10px] text-slate-500">Standard 30-min meal break</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 text-center space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Hours Worked Today</p>
                <p className="text-2xl font-black text-indigo-400 font-mono">
                  {currentStaffProfile.totalHoursWorkedToday.toFixed(1)} hrs
                </p>
                <p className="text-[10px] text-slate-500">Scheduled: {currentStaffProfile.scheduledHours} hrs</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <p className="text-xs font-bold text-slate-400 mb-3">Timecard Action Controls:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* CLOCK IN */}
                <button
                  disabled={currentStaffProfile.status === 'clocked_in'}
                  onClick={() => openActionModal(currentStaffProfile, 'clock_in')}
                  className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm transition active:scale-95 shadow-lg ${
                    currentStaffProfile.status === 'clocked_in'
                      ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  <LogIn className="h-5 w-5" /> Clock In Shift
                </button>

                {/* BREAK START / END */}
                {currentStaffProfile.status === 'on_break' ? (
                  <button
                    onClick={() => openActionModal(currentStaffProfile, 'break_end')}
                    className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition active:scale-95"
                  >
                    <CheckCircle2 className="h-5 w-5" /> End Break & Resume
                  </button>
                ) : (
                  <button
                    disabled={currentStaffProfile.status === 'clocked_out'}
                    onClick={() => openActionModal(currentStaffProfile, 'break_start')}
                    className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm transition active:scale-95 shadow-lg ${
                      currentStaffProfile.status === 'clocked_out'
                        ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    <Coffee className="h-5 w-5" /> Take Meal Break
                  </button>
                )}

                {/* CLOCK OUT */}
                <button
                  disabled={currentStaffProfile.status === 'clocked_out'}
                  onClick={() => openActionModal(currentStaffProfile, 'clock_out')}
                  className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-black text-sm transition active:scale-95 shadow-lg ${
                    currentStaffProfile.status === 'clocked_out'
                      ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  }`}
                >
                  <LogOut className="h-5 w-5" /> Clock Out Shift
                </button>
              </div>
            </div>
          </div>

          {/* Quick Roster Status Sidebar */}
          <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Shift Team Overview</h3>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {activeClockedInCount} Active
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
              {schedules.map(staff => (
                <div
                  key={staff.employeeId}
                  className="p-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-black text-white">{staff.employeeName}</p>
                      <span className="text-[9px] text-slate-400">({staff.employeeCode})</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{staff.role}</p>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-xl text-[10px] font-extrabold uppercase ${
                      staff.status === 'clocked_in'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : staff.status === 'on_break'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {staff.status === 'clocked_in' ? 'On Shift' : staff.status === 'on_break' ? 'Break' : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE STAFF ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-md">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, code, or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All ({schedules.length})
              </button>
              <button
                onClick={() => setStatusFilter('clocked_in')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'clocked_in' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Clocked In ({activeClockedInCount})
              </button>
              <button
                onClick={() => setStatusFilter('on_break')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'on_break' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                On Break ({onBreakCount})
              </button>
              <button
                onClick={() => setStatusFilter('clocked_out')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'clocked_out' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Off Shift
              </button>
            </div>
          </div>

          {/* Roster Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map(staff => (
              <div
                key={staff.employeeId}
                className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-xl space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">{staff.employeeName}</h4>
                      <span className="bg-slate-800 text-slate-300 text-[9px] font-black px-2 py-0.5 rounded">
                        {staff.employeeCode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{staff.role}</p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase ${
                      staff.status === 'clocked_in'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : staff.status === 'on_break'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {staff.status === 'clocked_in' ? 'On Shift' : staff.status === 'on_break' ? 'On Break' : 'Off Duty'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scheduled Shift:</span>
                    <span className="font-bold">{staff.scheduledShift}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hours Today:</span>
                    <span className="font-black text-indigo-400">{staff.totalHoursWorkedToday.toFixed(1)} / {staff.scheduledHours} hrs</span>
                  </div>
                  {staff.lastClockIn && staff.status === 'clocked_in' && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Elapsed Time:</span>
                      <span className="font-mono text-emerald-400 font-bold">{getElapsedTimeString(staff.lastClockIn)}</span>
                    </div>
                  )}
                </div>

                {/* Manager Action Trigger */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  {staff.status === 'clocked_out' ? (
                    <button
                      onClick={() => openActionModal(staff, 'clock_in')}
                      className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition"
                    >
                      Clock In Employee
                    </button>
                  ) : (
                    <button
                      onClick={() => openActionModal(staff, 'clock_out')}
                      className="w-full py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition"
                    >
                      Clock Out Employee
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TIMECARD LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-400" />
              <h3 className="text-base font-black text-white">Punch Log Ledger</h3>
            </div>
            <span className="text-xs text-slate-400">{clockLogs.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-extrabold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Event Type</th>
                  <th className="px-4 py-3">Shift Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-200">
                {clockLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-white">{log.employeeName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          log.type === 'clock_in'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.type === 'break_start' || log.type === 'break_end'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 italic">{log.notes || 'No note added'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MONTHLY TIMESHEET VIEW */}
      {activeTab === 'timesheet' && <MonthlyTimesheetView schedules={schedules} />}
      {pinModalOpen && selectedStaffForAction && targetAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-6 text-white shadow-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Security PIN Check</h3>
              </div>
              <button
                onClick={() => setPinModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                {targetAction.replace('_', ' ')}
              </p>
              <h4 className="text-lg font-black text-white">{selectedStaffForAction.employeeName}</h4>
              <p className="text-[11px] text-slate-400">Default PIN: 1234</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enter 4-Digit Security PIN:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={inputPin}
                  onChange={e => setInputPin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono rounded-2xl border border-slate-800 bg-slate-950 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Optional Shift Note:</label>
                <input
                  type="text"
                  value={shiftNoteInput}
                  onChange={e => setShiftNoteInput(e.target.value)}
                  placeholder="e.g. Register verified, starting lunch break..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPinModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClockAction}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-lg"
              >
                Confirm Punch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
