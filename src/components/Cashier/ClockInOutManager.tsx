import React, { useState, useEffect } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { EmployeeSchedule } from '../../types';
import {
  Clock,
  UserCheck,
  Coffee,
  LogOut,
  LogIn,
  CheckCircle2,
  Search,
  History,
  Users,
  KeyRound,
  FileSpreadsheet,
  Zap,
  Timer,
  Briefcase,
  Delete,
} from 'lucide-react';
import { MonthlyTimesheetView } from './MonthlyTimesheetView';

export const ClockInOutManager: React.FC = () => {
  const {
    activeCashier,
    employeeSchedules,
    clockLogs,
    shiftSessions,
    performClockAction,
    showToast,
  } = useOrderContext();

  // Realtime Live Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // View Controls
  const [activeTab, setActiveTab] = useState<'clock_terminal' | 'roster' | 'logs' | 'timesheet'>('clock_terminal');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clocked_in' | 'on_break' | 'clocked_out'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Employee in the Time Clock Kiosk (defaults to activeCashier)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(activeCashier.id);

  // Sync selected employee when activeCashier changes in header
  useEffect(() => {
    setSelectedEmployeeId(activeCashier.id);
  }, [activeCashier.id]);

  // Require PIN toggle (Instant Quick Punch vs PIN Keypad Verification)
  const [requirePinVerification, setRequirePinVerification] = useState<boolean>(false);
  const [quickShiftNote, setQuickShiftNote] = useState<string>('');

  // PIN Code Modal State
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [targetAction, setTargetAction] = useState<'clock_in' | 'break_start' | 'break_end' | 'clock_out' | null>(null);
  const [inputPin, setInputPin] = useState('');
  const [shiftNoteInput, setShiftNoteInput] = useState('');
  const [selectedStaffForAction, setSelectedStaffForAction] = useState<EmployeeSchedule | null>(null);

  // Find selected staff schedule profile
  const currentStaffProfile: EmployeeSchedule =
    employeeSchedules.find(
      s => s.employeeId === selectedEmployeeId || s.employeeName === activeCashier.name
    ) ||
    employeeSchedules[0] || {
      employeeId: activeCashier.id,
      employeeName: activeCashier.name,
      role: activeCashier.role,
      department: 'Front of House',
      employeeCode: activeCashier.employeeCode,
      scheduledShift: activeCashier.shift,
      scheduledHours: 8.0,
      hourlyRate: 145,
      status: 'clocked_in',
      totalHoursWorkedToday: 3.5,
      pinCode: '1234',
    };

  // Helper to format live elapsed duration
  const getElapsedTimeString = (startIso?: string) => {
    if (!startIso) return '00h 00m 00s';
    const start = new Date(startIso).getTime();
    const now = currentTime.getTime();
    const diffMs = Math.max(0, now - start);
    const hrs = Math.floor(diffMs / (1000 * 3600));
    const mins = Math.floor((diffMs % (1000 * 3600)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  // Live hours including ongoing active shift
  const getLiveHoursToday = (staff: EmployeeSchedule) => {
    if (staff.status === 'clocked_in' && staff.lastClockIn) {
      const elapsedHrs = Math.max(
        0,
        (currentTime.getTime() - new Date(staff.lastClockIn).getTime()) / (1000 * 3600) -
          (staff.accumulatedBreakMinutesToday || 0) / 60
      );
      return Math.max(staff.totalHoursWorkedToday, Math.round(elapsedHrs * 100) / 100);
    }
    return staff.totalHoursWorkedToday;
  };

  // Trigger Clock Action (Instant or PIN modal)
  const triggerClockAction = (
    staff: EmployeeSchedule,
    action: 'clock_in' | 'break_start' | 'break_end' | 'clock_out',
    noteOverride?: string
  ) => {
    if (!requirePinVerification) {
      performClockAction(staff.employeeId, action, noteOverride ?? quickShiftNote);
      setQuickShiftNote('');
      return;
    }

    setSelectedStaffForAction(staff);
    setTargetAction(action);
    setInputPin('');
    setShiftNoteInput(noteOverride ?? quickShiftNote);
    setPinModalOpen(true);
  };

  const handleConfirmPinClockAction = () => {
    if (!selectedStaffForAction || !targetAction) return;

    if (inputPin !== selectedStaffForAction.pinCode && inputPin !== '1234') {
      showToast('⚠️ Incorrect PIN! Use employee PIN or default 1234.');
      return;
    }

    performClockAction(selectedStaffForAction.employeeId, targetAction, shiftNoteInput);
    setPinModalOpen(false);
    setQuickShiftNote('');
  };

  // Filter schedules
  const filteredSchedules = employeeSchedules.filter(s => {
    const matchesSearch =
      s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return matchesSearch;
  });

  const activeClockedInCount = employeeSchedules.filter(s => s.status === 'clocked_in').length;
  const onBreakCount = employeeSchedules.filter(s => s.status === 'on_break').length;
  const offShiftCount = employeeSchedules.filter(s => s.status === 'clocked_out').length;
  const totalTeamHoursToday = employeeSchedules.reduce((sum, s) => sum + getLiveHoursToday(s), 0);

  const currentLiveHours = getLiveHoursToday(currentStaffProfile);
  const shiftProgressPct = Math.min(
    100,
    Math.round((currentLiveHours / (currentStaffProfile.scheduledHours || 8)) * 100)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/25">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-white tracking-tight">Employee Time Clock</h2>
              <span className="text-xs font-semibold text-emerald-400">
                {activeClockedInCount} Clocked In · {onBreakCount} On Break · {totalTeamHoursToday.toFixed(1)}h Logged Today
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Clock in and out of shifts, track meal breaks, and sync live labor hours with Admin Reports
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Punch vs PIN Verification Toggle */}
          <button
            type="button"
            onClick={() => setRequirePinVerification(prev => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition ${
              requirePinVerification
                ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
            }`}
            title="Switch between 1-click instant punch and 4-digit PIN verification"
          >
            {requirePinVerification ? (
              <>
                <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
                <span>PIN Verification: ON</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span>1-Click Instant Punch: ON</span>
              </>
            )}
          </button>

          {/* Live Digital Clock Widget */}
          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black text-white font-mono leading-none">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {currentTime.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Terminal View Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-2xl bg-slate-950 p-1.5 border border-slate-800 text-xs font-bold w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('clock_terminal')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'clock_terminal'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" /> Time Clock Kiosk
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'roster'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" /> All Staff Roster ({employeeSchedules.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="h-4 w-4" /> Punch Activity Log ({clockLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('timesheet')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
              activeTab === 'timesheet'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" /> Monthly Timesheet
          </button>
        </div>
      </div>

      {/* TAB 1: TIME CLOCK KIOSK */}
      {activeTab === 'clock_terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Active Staff Time Clock Punch Card */}
          <div className="lg:col-span-2 rounded-3xl bg-slate-950 p-6 border border-slate-800 shadow-2xl space-y-6">
            {/* Staff Member Selector Bar */}
            <div className="space-y-2.5 border-b border-slate-800/80 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Select Staff Member to Clock In / Out
                </label>
                <span className="text-[11px] text-slate-400">
                  All punches sync live with Admin Labor Hours Report
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {employeeSchedules.map(emp => {
                  const isSelected = emp.employeeId === currentStaffProfile.employeeId;
                  return (
                    <button
                      key={emp.employeeId}
                      type="button"
                      onClick={() => setSelectedEmployeeId(emp.employeeId)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          emp.status === 'clocked_in'
                            ? 'bg-emerald-400'
                            : emp.status === 'on_break'
                            ? 'bg-amber-400'
                            : 'bg-slate-500'
                        }`}
                      />
                      <span>{emp.employeeName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{emp.employeeCode}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Employee Identity & Live Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 text-lg font-black">
                  <UserCheck className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-black text-white">{currentStaffProfile.employeeName}</h3>
                    <span className="text-xs font-mono text-sky-400">
                      {currentStaffProfile.employeeCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentStaffProfile.role} · {currentStaffProfile.department || 'Front of House'} · Shift: {currentStaffProfile.scheduledShift}
                  </p>
                </div>
              </div>

              {/* Current Status Indicator */}
              <div>
                {currentStaffProfile.status === 'clocked_in' && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                    CLOCKED IN · ON SHIFT
                  </div>
                )}
                {currentStaffProfile.status === 'on_break' && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
                    <Coffee className="h-4 w-4 text-amber-400" />
                    ON MEAL BREAK
                  </div>
                )}
                {currentStaffProfile.status === 'clocked_out' && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-black">
                    CLOCKED OUT · OFF SHIFT
                  </div>
                )}
              </div>
            </div>

            {/* Live Shift Timers & Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>ACTIVE SHIFT TIMER</span>
                  <Timer className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  {currentStaffProfile.status === 'clocked_in'
                    ? getElapsedTimeString(currentStaffProfile.lastClockIn)
                    : currentStaffProfile.status === 'on_break'
                    ? 'PAUSED (ON BREAK)'
                    : '00h 00m 00s'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {currentStaffProfile.lastClockIn && currentStaffProfile.status !== 'clocked_out'
                    ? `Clocked in at ${new Date(currentStaffProfile.lastClockIn).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : currentStaffProfile.lastClockOut
                    ? `Last out at ${new Date(currentStaffProfile.lastClockOut).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Ready to clock in'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>MEAL BREAK TIMER</span>
                  <Coffee className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <p className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                  {currentStaffProfile.status === 'on_break'
                    ? getElapsedTimeString(currentStaffProfile.breakStartTime)
                    : `${currentStaffProfile.accumulatedBreakMinutesToday || 0} mins used`}
                </p>
                <p className="text-[11px] text-slate-500">Standard 30-min meal break</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>LABOR HOURS TODAY</span>
                  <Briefcase className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <p className="text-2xl font-black text-indigo-400 font-mono tracking-tight">
                  {currentLiveHours.toFixed(2)} hrs
                </p>
                <div className="space-y-1 pt-0.5">
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${shiftProgressPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Target: {currentStaffProfile.scheduledHours}h ({shiftProgressPct}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Shift Note Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <input
                type="text"
                value={quickShiftNote}
                onChange={e => setQuickShiftNote(e.target.value)}
                placeholder="Optional shift note (e.g. Opening cash drawer verified, covering Counter 2)..."
                className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Primary Clock In / Break / Clock Out Controls */}
            <div className="pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* CLOCK IN BUTTON */}
                <button
                  type="button"
                  disabled={currentStaffProfile.status !== 'clocked_out'}
                  onClick={() => triggerClockAction(currentStaffProfile, 'clock_in')}
                  className={`flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl font-black text-sm transition active:scale-95 shadow-lg ${
                    currentStaffProfile.status !== 'clocked_out'
                      ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                  }`}
                >
                  <LogIn className="h-5 w-5" /> Clock In
                </button>

                {/* START / END BREAK BUTTON */}
                {currentStaffProfile.status === 'on_break' ? (
                  <button
                    type="button"
                    onClick={() => triggerClockAction(currentStaffProfile, 'break_end')}
                    className="flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl font-black text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/25 transition active:scale-95"
                  >
                    <CheckCircle2 className="h-5 w-5" /> End Break &amp; Resume
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={currentStaffProfile.status === 'clocked_out'}
                    onClick={() => triggerClockAction(currentStaffProfile, 'break_start')}
                    className={`flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl font-black text-sm transition active:scale-95 shadow-lg ${
                      currentStaffProfile.status === 'clocked_out'
                        ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    <Coffee className="h-5 w-5" /> Start Break
                  </button>
                )}

                {/* CLOCK OUT BUTTON */}
                <button
                  type="button"
                  disabled={currentStaffProfile.status === 'clocked_out'}
                  onClick={() => triggerClockAction(currentStaffProfile, 'clock_out')}
                  className={`flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl font-black text-sm transition active:scale-95 shadow-lg ${
                    currentStaffProfile.status === 'clocked_out'
                      ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                  }`}
                >
                  <LogOut className="h-5 w-5" /> Clock Out
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Team Status & Quick Actions */}
          <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-black text-white">Staff Shift Board</h3>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {activeClockedInCount} Active · {offShiftCount} Off
                </span>
              </div>

              <div className="space-y-2.5 max-h-[390px] overflow-y-auto pr-1 scrollbar-none">
                {employeeSchedules.map(staff => {
                  const liveHrs = getLiveHoursToday(staff);
                  return (
                    <div
                      key={staff.employeeId}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-2 ${
                        staff.employeeId === currentStaffProfile.employeeId
                          ? 'border-sky-500/50 bg-sky-950/20'
                          : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => setSelectedEmployeeId(staff.employeeId)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              staff.status === 'clocked_in'
                                ? 'bg-emerald-400'
                                : staff.status === 'on_break'
                                ? 'bg-amber-400'
                                : 'bg-slate-500'
                            }`}
                          />
                          <p className="text-xs font-black text-white truncate">{staff.employeeName}</p>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {staff.role} · <span className="text-indigo-400 font-bold">{liveHrs.toFixed(1)}h today</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {staff.status === 'clocked_out' ? (
                          <button
                            type="button"
                            onClick={() => triggerClockAction(staff, 'clock_in')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black transition"
                          >
                            Clock In
                          </button>
                        ) : (
                          <>
                            {staff.status === 'on_break' ? (
                              <button
                                type="button"
                                onClick={() => triggerClockAction(staff, 'break_end')}
                                className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black transition"
                              >
                                Resume
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => triggerClockAction(staff, 'break_start')}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-[10px] font-black transition"
                              >
                                Break
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => triggerClockAction(staff, 'clock_out')}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-black transition"
                            >
                              Clock Out
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Punch Footer */}
            {clockLogs[0] && (
              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span className="truncate">
                  Latest: <strong className="text-white">{clockLogs[0].employeeName}</strong> (
                  {clockLogs[0].type.replace('_', ' ')})
                </span>
                <span className="font-mono text-slate-500 shrink-0 ml-2">
                  {new Date(clockLogs[0].timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ALL STAFF ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
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
                All ({employeeSchedules.length})
              </button>
              <button
                onClick={() => setStatusFilter('clocked_in')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'clocked_in'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Clocked In ({activeClockedInCount})
              </button>
              <button
                onClick={() => setStatusFilter('on_break')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'on_break'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                On Break ({onBreakCount})
              </button>
              <button
                onClick={() => setStatusFilter('clocked_out')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  statusFilter === 'clocked_out'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Clocked Out ({offShiftCount})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchedules.map(staff => {
              const liveHrs = getLiveHoursToday(staff);
              return (
                <div
                  key={staff.employeeId}
                  className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white">{staff.employeeName}</h4>
                          <span className="text-xs font-mono text-slate-400">{staff.employeeCode}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {staff.role} · {staff.department || 'Front of House'}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-extrabold uppercase ${
                          staff.status === 'clocked_in'
                            ? 'text-emerald-400'
                            : staff.status === 'on_break'
                            ? 'text-amber-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {staff.status === 'clocked_in'
                          ? '● Clocked In'
                          : staff.status === 'on_break'
                          ? '◐ On Break'
                          : '○ Clocked Out'}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 text-xs space-y-1.5 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Scheduled Shift:</span>
                        <span className="font-bold">{staff.scheduledShift}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hours Worked Today:</span>
                        <span className="font-black text-indigo-400">
                          {liveHrs.toFixed(2)} / {staff.scheduledHours} hrs
                        </span>
                      </div>
                      {staff.lastClockIn && staff.status === 'clocked_in' && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Active Shift Timer:</span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {getElapsedTimeString(staff.lastClockIn)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    {staff.status === 'clocked_out' ? (
                      <button
                        type="button"
                        onClick={() => triggerClockAction(staff, 'clock_in')}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5"
                      >
                        <LogIn className="h-4 w-4" /> Clock In Staff
                      </button>
                    ) : (
                      <>
                        {staff.status === 'on_break' ? (
                          <button
                            type="button"
                            onClick={() => triggerClockAction(staff, 'break_end')}
                            className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black transition"
                          >
                            End Break
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => triggerClockAction(staff, 'break_start')}
                            className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 rounded-xl text-xs font-black transition"
                          >
                            Start Break
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => triggerClockAction(staff, 'clock_out')}
                          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5"
                        >
                          <LogOut className="h-4 w-4" /> Clock Out
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TIMECARD PUNCH LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-black text-white">Employee Time Clock Punch Ledger</h3>
                <p className="text-xs text-slate-400">
                  Real-time log of all clock-ins, breaks, and clock-outs ({ shiftSessions.filter(s => s.status !== 'completed').length } active shifts)
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400">{clockLogs.length} Entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-extrabold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Shift Hours</th>
                  <th className="px-4 py-3">Shift Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-200">
                {clockLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString()}{' '}
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-white">
                      {log.employeeName}
                      {log.employeeCode && (
                        <span className="ml-1.5 text-[10px] font-mono text-slate-400">{log.employeeCode}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{log.role || 'Staff'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-black uppercase ${
                          log.type === 'clock_in'
                            ? 'text-emerald-400'
                            : log.type === 'break_start' || log.type === 'break_end'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-400">
                      {log.shiftDurationHours !== undefined ? `${log.shiftDurationHours.toFixed(2)} hrs` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MONTHLY TIMESHEET VIEW */}
      {activeTab === 'timesheet' && <MonthlyTimesheetView schedules={employeeSchedules} />}

      {/* PIN Keypad Modal */}
      {pinModalOpen && selectedStaffForAction && targetAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-6 text-white shadow-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Employee Time Clock PIN</h3>
              </div>
              <button
                type="button"
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
              <p className="text-[11px] text-slate-400">
                Employee PIN: <span className="font-mono text-slate-300">{selectedStaffForAction.pinCode}</span> (or default 1234)
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                maxLength={4}
                value={inputPin}
                onChange={e => setInputPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-[0.5em] text-xl font-mono rounded-2xl border border-slate-800 bg-slate-950 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                autoFocus
              />

              {/* Interactive Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => setInputPin(prev => (prev.length < 4 ? prev + digit : prev))}
                    className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sm font-black font-mono text-white transition"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setInputPin('1234')}
                  className="py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-[10px] font-black text-emerald-300 transition"
                >
                  Auto 1234
                </button>
                <button
                  type="button"
                  onClick={() => setInputPin(prev => (prev.length < 4 ? prev + '0' : prev))}
                  className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sm font-black font-mono text-white transition"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setInputPin(prev => prev.slice(0, -1))}
                  className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 transition"
                >
                  <Delete className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Optional Shift Note:
                </label>
                <input
                  type="text"
                  value={shiftNoteInput}
                  onChange={e => setShiftNoteInput(e.target.value)}
                  placeholder="e.g. Register verified, starting break..."
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPinClockAction}
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
