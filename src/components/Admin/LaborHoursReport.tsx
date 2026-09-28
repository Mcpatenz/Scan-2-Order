import React, { useState, useEffect, useMemo } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { EmployeeSchedule, ShiftSession } from '../../types';
import {
  Clock,
  Users,
  Briefcase,
  TrendingUp,
  Download,
  Plus,
  Search,
  LogIn,
  LogOut,
  Coffee,
  Trash2,
  X,
  Calendar,
  Timer,
} from 'lucide-react';

export const LaborHoursReport: React.FC = () => {
  const {
    employeeSchedules,
    shiftSessions,
    clockLogs,
    orders,
    performClockAction,
    addManualShiftSession,
    deleteShiftSession,
    updateEmployeeHourlyRate,
    showToast,
  } = useOrderContext();

  // Live clock to calculate real-time hours for staff currently on the clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Report Filters
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'all'>('week');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reportSubView, setReportSubView] = useState<'summary' | 'shifts' | 'punches'>('summary');

  // Manual Shift Entry Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employeeSchedules[0]?.employeeId || 'cash-101');
  const [shiftDate, setShiftDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [clockInInput, setClockInInput] = useState<string>('08:00');
  const [clockOutInput, setClockOutInput] = useState<string>('16:30');
  const [breakMinsInput, setBreakMinsInput] = useState<string>('30');
  const [shiftNotesInput, setShiftNotesInput] = useState<string>('');

  // Inline Hourly Rate Editor State
  const [editingRateEmpId, setEditingRateEmpId] = useState<string | null>(null);
  const [rateInputValue, setRateInputValue] = useState<string>('');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter Shift Sessions by Date Range
  const periodSessions = useMemo(() => {
    return shiftSessions.filter(session => {
      if (dateRange === 'today') {
        return session.date === todayStr || session.status !== 'completed';
      }
      if (dateRange === 'week') {
        const diffDays =
          (currentTime.getTime() - new Date(session.clockInTime).getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7 || session.status !== 'completed';
      }
      return true;
    });
  }, [shiftSessions, dateRange, todayStr, currentTime]);

  // Calculate live hours for a ShiftSession
  const getSessionLiveHours = (session: ShiftSession): { regular: number; overtime: number; total: number } => {
    if (session.status === 'completed') {
      return {
        regular: session.regularHours,
        overtime: session.overtimeHours,
        total: session.totalHours,
      };
    }

    const startMs = new Date(session.clockInTime).getTime();
    const rawHours = Math.max(0.1, (currentTime.getTime() - startMs) / (1000 * 3600) - session.breakMinutes / 60);
    const total = Math.round(rawHours * 100) / 100;
    const regular = Math.min(8, total);
    const overtime = Math.max(0, Math.round((total - 8) * 100) / 100);
    return { regular, overtime, total };
  };

  // Build per-employee labor summary rows
  const employeeLaborRows = useMemo(() => {
    return employeeSchedules
      .map(emp => {
        const empSessions = periodSessions.filter(s => s.employeeId === emp.employeeId);

        let regularHours = 0;
        let overtimeHours = 0;
        let totalHours = 0;
        let breakMinutes = 0;

        empSessions.forEach(sess => {
          const hrs = getSessionLiveHours(sess);
          regularHours += hrs.regular;
          overtimeHours += hrs.overtime;
          totalHours += hrs.total;
          breakMinutes += sess.breakMinutes;
        });

        // If no sessions matched in period but employee has today's hours, fallback to schedule hours
        if (empSessions.length === 0 && dateRange === 'today' && emp.totalHoursWorkedToday > 0) {
          totalHours = emp.totalHoursWorkedToday;
          regularHours = Math.min(8, totalHours);
          overtimeHours = Math.max(0, totalHours - 8);
          breakMinutes = emp.accumulatedBreakMinutesToday || 0;
        }

        const hourlyRate = emp.hourlyRate || 135;
        // Overtime paid at 1.25x
        const laborCost = regularHours * hourlyRate + overtimeHours * hourlyRate * 1.25;

        return {
          schedule: emp,
          shiftsCount: empSessions.length,
          regularHours: Math.round(regularHours * 100) / 100,
          overtimeHours: Math.round(overtimeHours * 100) / 100,
          totalHours: Math.round(totalHours * 100) / 100,
          breakMinutes,
          hourlyRate,
          laborCost: Math.round(laborCost * 100) / 100,
        };
      })
      .filter(row => {
        const matchesDept =
          departmentFilter === 'all' || (row.schedule.department || 'Front of House') === departmentFilter;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          row.schedule.employeeName.toLowerCase().includes(q) ||
          row.schedule.employeeCode.toLowerCase().includes(q) ||
          row.schedule.role.toLowerCase().includes(q);
        return matchesDept && matchesSearch;
      });
  }, [employeeSchedules, periodSessions, departmentFilter, searchQuery, dateRange, currentTime]);

  // Filtered Shift Sessions for the Shift Log sub-view
  const filteredSessions = useMemo(() => {
    return periodSessions.filter(sess => {
      const matchesDept = departmentFilter === 'all' || sess.department === departmentFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        sess.employeeName.toLowerCase().includes(q) ||
        sess.employeeCode.toLowerCase().includes(q) ||
        sess.role.toLowerCase().includes(q) ||
        (sess.notes && sess.notes.toLowerCase().includes(q));
      return matchesDept && matchesSearch;
    });
  }, [periodSessions, departmentFilter, searchQuery]);

  // Aggregate KPI Totals
  const totalLaborHours = employeeLaborRows.reduce((sum, r) => sum + r.totalHours, 0);
  const totalRegularHours = employeeLaborRows.reduce((sum, r) => sum + r.regularHours, 0);
  const totalOvertimeHours = employeeLaborRows.reduce((sum, r) => sum + r.overtimeHours, 0);
  const totalLaborCost = employeeLaborRows.reduce((sum, r) => sum + r.laborCost, 0);

  const activeClockedInStaff = employeeSchedules.filter(s => s.status === 'clocked_in').length;
  const onBreakStaff = employeeSchedules.filter(s => s.status === 'on_break').length;

  // Paid sales for Labor-to-Sales ratio
  const paidSalesTotal = orders
    .filter(o => o.status !== 'cancelled' && o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const laborCostRatioPct =
    paidSalesTotal > 0 ? Math.min(100, Math.round((totalLaborCost / paidSalesTotal) * 100)) : 0;

  // Format elapsed time string for active shifts
  const getElapsedDuration = (startIso?: string) => {
    if (!startIso) return '—';
    const diffMs = Math.max(0, currentTime.getTime() - new Date(startIso).getTime());
    const hrs = Math.floor(diffMs / (1000 * 3600));
    const mins = Math.floor((diffMs % (1000 * 3600)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
  };

  // Handle Manual Shift Submission
  const handleAddManualShift = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employeeSchedules.find(s => s.employeeId === selectedEmpId);
    if (!targetEmp) return;

    const [inH, inM] = clockInInput.split(':').map(Number);
    const [outH, outM] = clockOutInput.split(':').map(Number);
    const breakMins = Math.max(0, parseInt(breakMinsInput, 10) || 0);

    const startTotalMins = inH * 60 + inM;
    let endTotalMins = outH * 60 + outM;
    if (endTotalMins <= startTotalMins) {
      endTotalMins += 24 * 60; // overnight shift
    }

    const workedMins = Math.max(15, endTotalMins - startTotalMins - breakMins);
    const totalHours = Math.round((workedMins / 60) * 100) / 100;
    const regularHours = Math.min(8, totalHours);
    const overtimeHours = Math.max(0, Math.round((totalHours - 8) * 100) / 100);

    const clockInDate = new Date(`${shiftDate}T${clockInInput}:00`);
    const clockOutDate = new Date(clockInDate.getTime() + (endTotalMins - startTotalMins) * 60 * 1000);

    addManualShiftSession({
      employeeId: targetEmp.employeeId,
      employeeName: targetEmp.employeeName,
      employeeCode: targetEmp.employeeCode,
      role: targetEmp.role,
      department: targetEmp.department || 'Front of House',
      hourlyRate: targetEmp.hourlyRate || 135,
      date: shiftDate,
      scheduledShift: targetEmp.scheduledShift,
      clockInTime: clockInDate.toISOString(),
      clockOutTime: clockOutDate.toISOString(),
      breakMinutes: breakMins,
      regularHours,
      overtimeHours,
      totalHours,
      status: 'completed',
      notes: shiftNotesInput.trim() || 'Manual shift logged by Admin',
    });

    setManualModalOpen(false);
    setShiftNotesInput('');
  };

  // Export Labor Hours Report CSV
  const handleExportLaborCSV = () => {
    const headers = [
      'Employee Code',
      'Employee Name',
      'Role',
      'Department',
      'Current Status',
      'Shifts Logged',
      'Regular Hours',
      'Overtime Hours',
      'Break (Mins)',
      'Total Labor Hours',
      'Hourly Rate (PHP)',
      'Estimated Labor Cost (PHP)',
    ];

    const rows = employeeLaborRows.map(r => [
      r.schedule.employeeCode,
      `"${r.schedule.employeeName}"`,
      `"${r.schedule.role}"`,
      `"${r.schedule.department || 'Front of House'}"`,
      r.schedule.status,
      r.shiftsCount,
      r.regularHours.toFixed(2),
      r.overtimeHours.toFixed(2),
      r.breakMinutes,
      r.totalHours.toFixed(2),
      r.hourlyRate.toFixed(2),
      r.laborCost.toFixed(2),
    ]);

    rows.push([]);
    rows.push([
      'TOTALS',
      `Period: ${dateRange.toUpperCase()}`,
      '',
      '',
      `${activeClockedInStaff} Active`,
      employeeLaborRows.reduce((s, r) => s + r.shiftsCount, 0),
      totalRegularHours.toFixed(2),
      totalOvertimeHours.toFixed(2),
      employeeLaborRows.reduce((s, r) => s + r.breakMinutes, 0),
      totalLaborHours.toFixed(2),
      '',
      totalLaborCost.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Admin_Labor_Hours_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Labor Hours Report CSV downloaded!');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                Employee Labor Hours &amp; Time Clock Report
              </h2>
              <span className="text-xs font-semibold text-emerald-400">
                {activeClockedInStaff} Clocked In · {onBreakStaff} On Break
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live attendance hours, regular vs. overtime breakdown, shift durations, and labor cost summary
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setManualModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/25 transition active:scale-95"
          >
            <Plus className="h-4 w-4" /> Log Manual Shift
          </button>

          <button
            type="button"
            onClick={handleExportLaborCSV}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-2xl transition active:scale-95"
          >
            <Download className="h-4 w-4 text-emerald-400" /> Export Labor CSV
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-slate-950 border border-slate-800 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>TOTAL LABOR HOURS</span>
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{totalLaborHours.toFixed(2)} hrs</p>
          <p className="text-xs text-slate-400">
            <span>{totalRegularHours.toFixed(1)}h regular</span>
            <span className="mx-1.5">·</span>
            <span className="text-amber-400">{totalOvertimeHours.toFixed(1)}h overtime</span>
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950 border border-slate-800 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>STAFF ON THE CLOCK</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">
            {activeClockedInStaff} Active
          </p>
          <p className="text-xs text-slate-400">
            <span>{onBreakStaff} on break</span>
            <span className="mx-1.5">·</span>
            <span>{employeeSchedules.length} total staff</span>
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950 border border-slate-800 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>OVERTIME HOURS</span>
            <Timer className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">
            {totalOvertimeHours.toFixed(2)} hrs
          </p>
          <p className="text-xs text-slate-400">
            Shifts exceeding 8.0 regular hours/day
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950 border border-slate-800 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>ESTIMATED LABOR COST</span>
            <TrendingUp className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-sky-400 font-mono">
            ₱{totalLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400">
            <span>Avg ₱{(totalLaborHours > 0 ? totalLaborCost / totalLaborHours : 0).toFixed(0)}/hr</span>
            <span className="mx-1.5">·</span>
            <span>{laborCostRatioPct}% of paid sales</span>
          </p>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-950 p-4 rounded-3xl border border-slate-800">
        {/* Sub-view Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setReportSubView('summary')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              reportSubView === 'summary' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Staff Labor Summary ({employeeLaborRows.length})
          </button>
          <button
            type="button"
            onClick={() => setReportSubView('shifts')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              reportSubView === 'shifts' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Shift Sessions ({filteredSessions.length})
          </button>
          <button
            type="button"
            onClick={() => setReportSubView('punches')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              reportSubView === 'punches' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            Time Clock Punches ({clockLogs.length})
          </button>
        </div>

        {/* Period, Department & Search Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Period Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dateRange === 'today' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dateRange === 'week' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dateRange === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Records
            </button>
          </div>

          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            <option value="Front of House">Front of House</option>
            <option value="Kitchen & Culinary">Kitchen &amp; Culinary</option>
            <option value="Bar & Beverage">Bar &amp; Beverage</option>
            <option value="Management">Management</option>
          </select>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: STAFF LABOR HOURS SUMMARY TABLE */}
      {reportSubView === 'summary' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-white">Labor Hours by Employee</h3>
              <p className="text-xs text-slate-400">
                Includes live hours from staff currently clocked in at the Cashier Terminal
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Total: {totalLaborHours.toFixed(2)} hrs · ₱{totalLaborCost.toFixed(2)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-extrabold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Role &amp; Dept</th>
                  <th className="px-4 py-3.5">Live Status</th>
                  <th className="px-4 py-3.5">Shifts</th>
                  <th className="px-4 py-3.5">Regular Hrs</th>
                  <th className="px-4 py-3.5">Overtime</th>
                  <th className="px-4 py-3.5">Total Labor Hours</th>
                  <th className="px-4 py-3.5">Hourly Rate</th>
                  <th className="px-4 py-3.5">Est. Labor Pay</th>
                  <th className="px-5 py-3.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {employeeLaborRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No employee labor records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  employeeLaborRows.map(row => {
                    const { schedule } = row;
                    const targetCap = dateRange === 'today' ? schedule.scheduledHours || 8 : 40;
                    const progressPct = Math.min(100, Math.round((row.totalHours / targetCap) * 100));

                    return (
                      <tr key={schedule.employeeId} className="hover:bg-slate-900/50 transition">
                        <td className="px-5 py-4">
                          <div className="font-black text-white">{schedule.employeeName}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {schedule.employeeCode} · {schedule.scheduledShift}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-200">{schedule.role}</div>
                          <div className="text-[11px] text-slate-400">
                            {schedule.department || 'Front of House'}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {schedule.status === 'clocked_in' && (
                            <div className="space-y-0.5">
                              <span className="text-xs font-black text-emerald-400">● Clocked In</span>
                              <p className="text-[10px] font-mono text-slate-400">
                                {getElapsedDuration(schedule.lastClockIn)} elapsed
                              </p>
                            </div>
                          )}
                          {schedule.status === 'on_break' && (
                            <div className="space-y-0.5">
                              <span className="text-xs font-black text-amber-400">◐ On Break</span>
                              <p className="text-[10px] font-mono text-slate-400">
                                {getElapsedDuration(schedule.breakStartTime)} break
                              </p>
                            </div>
                          )}
                          {schedule.status === 'clocked_out' && (
                            <span className="text-xs font-bold text-slate-500">○ Clocked Out</span>
                          )}
                        </td>

                        <td className="px-4 py-4 font-mono font-bold text-slate-300">{row.shiftsCount}</td>

                        <td className="px-4 py-4 font-mono font-bold text-slate-200">
                          {row.regularHours.toFixed(2)}h
                        </td>

                        <td className="px-4 py-4 font-mono font-bold">
                          {row.overtimeHours > 0 ? (
                            <span className="text-amber-400">+{row.overtimeHours.toFixed(2)}h</span>
                          ) : (
                            <span className="text-slate-500">0.00h</span>
                          )}
                        </td>

                        <td className="px-4 py-4 min-w-[160px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-black text-indigo-400 font-mono">
                              {row.totalHours.toFixed(2)} hrs
                            </span>
                            <span className="text-[10px] text-slate-500">{progressPct}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.overtimeHours > 0 ? 'bg-amber-400' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {editingRateEmpId === schedule.employeeId ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={rateInputValue}
                                onChange={e => setRateInputValue(e.target.value)}
                                className="w-16 rounded-lg border border-indigo-500 bg-slate-900 px-2 py-1 text-xs font-mono text-white"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const parsed = parseFloat(rateInputValue);
                                  if (!isNaN(parsed) && parsed > 0) {
                                    updateEmployeeHourlyRate(schedule.employeeId, parsed);
                                  }
                                  setEditingRateEmpId(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRateEmpId(schedule.employeeId);
                                setRateInputValue(String(row.hourlyRate));
                              }}
                              className="font-mono text-slate-300 hover:text-white underline decoration-slate-700"
                              title="Click to adjust hourly rate"
                            >
                              ₱{row.hourlyRate.toFixed(0)}/hr
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-4 font-mono font-black text-emerald-400">
                          ₱{row.laborCost.toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {schedule.status === 'clocked_out' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  performClockAction(schedule.employeeId, 'clock_in', 'Admin clocked in staff')
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold transition"
                              >
                                <LogIn className="h-3 w-3" /> Clock In
                              </button>
                            ) : (
                              <>
                                {schedule.status === 'on_break' ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      performClockAction(schedule.employeeId, 'break_end', 'Admin resumed shift')
                                    }
                                    className="px-2.5 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-[11px] font-bold transition"
                                  >
                                    End Break
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      performClockAction(schedule.employeeId, 'break_start', 'Break started')
                                    }
                                    className="p-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 transition"
                                    title="Start Break"
                                  >
                                    <Coffee className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    performClockAction(schedule.employeeId, 'clock_out', 'Admin clocked out staff')
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-bold transition"
                                >
                                  <LogOut className="h-3 w-3" /> Clock Out
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DETAILED SHIFT SESSIONS LOG */}
      {reportSubView === 'shifts' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white">Individual Shift Sessions</h3>
              <p className="text-xs text-slate-400">
                Complete breakdown of active and completed shifts with clock-in/out timestamps
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">{filteredSessions.length} Shifts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-extrabold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Clock In</th>
                  <th className="px-4 py-3.5">Clock Out</th>
                  <th className="px-4 py-3.5">Break</th>
                  <th className="px-4 py-3.5">Regular / OT</th>
                  <th className="px-4 py-3.5">Total Hours</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Shift Notes</th>
                  <th className="px-5 py-3.5 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredSessions.map(sess => {
                  const liveHrs = getSessionLiveHours(sess);
                  return (
                    <tr key={sess.id} className="hover:bg-slate-900/50 transition">
                      <td className="px-5 py-3.5 font-mono text-slate-300">{sess.date}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-black text-white">{sess.employeeName}</div>
                        <div className="text-[11px] text-slate-400">
                          {sess.role} · {sess.employeeCode}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-emerald-400">
                        {new Date(sess.clockInTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {sess.clockOutTime
                          ? new Date(sess.clockOutTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Active Shift'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">{sess.breakMinutes}m</td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {liveHrs.regular.toFixed(1)}h reg
                        {liveHrs.overtime > 0 && (
                          <span className="text-amber-400 ml-1">+{liveHrs.overtime.toFixed(1)}h OT</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-black text-indigo-400">
                        {liveHrs.total.toFixed(2)} hrs
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs font-black uppercase ${
                            sess.status === 'active'
                              ? 'text-emerald-400'
                              : sess.status === 'on_break'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {sess.status === 'active'
                            ? '● Active'
                            : sess.status === 'on_break'
                            ? '◐ Break'
                            : '✓ Completed'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate">
                        {sess.notes || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => deleteShiftSession(sess.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                          title="Delete shift record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: RAW PUNCH LOGS */}
      {reportSubView === 'punches' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white">Real-Time Cashier Time Clock Punches</h3>
              <p className="text-xs text-slate-400">
                Chronological audit trail of every clock-in, meal break, and clock-out event
              </p>
            </div>
            <span className="text-xs font-bold text-slate-400">{clockLogs.length} Punches</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-extrabold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Shift Hours</th>
                  <th className="px-5 py-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {clockLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="px-5 py-3.5 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleDateString()}{' '}
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3.5 font-black text-white">
                      {log.employeeName}
                      {log.employeeCode && (
                        <span className="ml-1.5 text-[10px] font-mono text-slate-400">
                          {log.employeeCode}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
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
                    <td className="px-4 py-3.5 font-mono text-indigo-400">
                      {log.shiftDurationHours !== undefined
                        ? `${log.shiftDurationHours.toFixed(2)} hrs`
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANUAL SHIFT LOG MODAL */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-950 border border-slate-800 p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">Log Manual Shift Entry</h3>
              </div>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualShift} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">
                  Staff Member
                </label>
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 font-bold text-white focus:border-indigo-500 focus:outline-none"
                >
                  {employeeSchedules.map(emp => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.employeeName} ({emp.employeeCode} · {emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">
                    Shift Date
                  </label>
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={e => setShiftDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">
                    Break (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={breakMinsInput}
                    onChange={e => setBreakMinsInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">
                    Clock In Time
                  </label>
                  <input
                    type="time"
                    value={clockInInput}
                    onChange={e => setClockInInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 uppercase mb-1">
                    Clock Out Time
                  </label>
                  <input
                    type="time"
                    value={clockOutInput}
                    onChange={e => setClockOutInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 uppercase mb-1">
                  Shift Notes
                </label>
                <input
                  type="text"
                  value={shiftNotesInput}
                  onChange={e => setShiftNotesInput(e.target.value)}
                  placeholder="e.g. Approved overtime shift, catering event..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-white shadow-lg"
                >
                  Save Shift Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
