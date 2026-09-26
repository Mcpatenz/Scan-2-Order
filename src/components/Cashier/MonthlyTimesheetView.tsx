import React, { useState, useMemo } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { MonthlyTimesheetEntry, EmployeeSchedule } from '../../types';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  Printer,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  FileText,
  Briefcase,
} from 'lucide-react';

interface MonthlyTimesheetViewProps {
  schedules: EmployeeSchedule[];
}

// Generate realistic mock monthly entries for selected employee and month
const generateMockMonthlyEntries = (
  employeeId: string,
  employeeName: string,
  employeeCode: string,
  year: number,
  monthIndex: number // 0 = Jan, 7 = Aug
): MonthlyTimesheetEntry[] => {
  const entries: MonthlyTimesheetEntry[] = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, monthIndex, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat

    // Skip Sundays as day off or rostered off
    if (dayOfWeek === 0) continue;

    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Seed variations based on day number
    const isWeekend = dayOfWeek === 6;
    let lateMins = 0;
    let otHours = 0;
    let utMins = 0;
    let status: MonthlyTimesheetEntry['status'] = 'On Time';
    let timeIn = '08:00 AM';
    let timeOut = '04:00 PM';
    let totalHours = 8.0;

    if (day % 7 === 1) {
      // Late by 12 mins
      lateMins = 12;
      timeIn = '08:12 AM';
      timeOut = '04:00 PM';
      totalHours = 7.8;
      status = 'Late';
    } else if (day % 5 === 0) {
      // Overtime by 1.5 hrs
      otHours = 1.5;
      timeIn = '08:00 AM';
      timeOut = '05:30 PM';
      totalHours = 9.5;
      status = 'Overtime';
    } else if (day % 11 === 0) {
      // Undertime by 30 mins
      utMins = 30;
      timeIn = '08:00 AM';
      timeOut = '03:30 PM';
      totalHours = 7.5;
      status = 'Undertime';
    } else if (isWeekend && day % 3 === 0) {
      // Overtime Saturday shift
      otHours = 2.0;
      timeIn = '08:00 AM';
      timeOut = '06:00 PM';
      totalHours = 10.0;
      status = 'Overtime';
    }

    entries.push({
      id: `ts-${employeeId}-${dateStr}`,
      employeeId,
      employeeName,
      employeeCode,
      date: dateStr,
      scheduledShift: '08:00 AM - 04:00 PM',
      timeIn,
      timeOut,
      totalHours,
      lateMinutes: lateMins,
      overtimeHours: otHours,
      undertimeMinutes: utMins,
      status,
      notes: lateMins > 0 ? `Late arrival due to traffic` : otHours > 0 ? `Approved peak shift extension` : undefined,
    });
  }

  return entries;
};

export const MonthlyTimesheetView: React.FC<MonthlyTimesheetViewProps> = ({ schedules }) => {
  const { activeCashier, showToast } = useOrderContext();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // 7 = August (0-indexed)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    schedules.find(s => s.employeeId === activeCashier.id)?.employeeId || schedules[0]?.employeeId || 'cash-101'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'On Time' | 'Late' | 'Overtime' | 'Undertime'>('all');

  // Load custom stored entries or fallback to mock
  const [timesheetDb, setTimesheetDb] = useState<Record<string, MonthlyTimesheetEntry[]>>(() => {
    const saved = localStorage.getItem('qr_app_monthly_timesheets');
    return saved ? JSON.parse(saved) : {};
  });

  const selectedStaff = schedules.find(s => s.employeeId === selectedEmployeeId) || {
    employeeId: activeCashier.id,
    employeeName: activeCashier.name,
    role: activeCashier.role,
    employeeCode: activeCashier.employeeCode,
    scheduledShift: activeCashier.shift,
    scheduledHours: 8.0,
    status: 'clocked_in' as const,
    totalHoursWorkedToday: 3.5,
    pinCode: '1234',
  };

  const monthKey = `${selectedEmployeeId}-${selectedYear}-${selectedMonth}`;

  // Get current timesheet entries for selected employee & month
  const rawEntries = useMemo(() => {
    if (timesheetDb[monthKey] && timesheetDb[monthKey].length > 0) {
      return timesheetDb[monthKey];
    }
    return generateMockMonthlyEntries(
      selectedStaff.employeeId,
      selectedStaff.employeeName,
      selectedStaff.employeeCode,
      selectedYear,
      selectedMonth
    );
  }, [timesheetDb, monthKey, selectedStaff, selectedYear, selectedMonth]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return rawEntries.filter(entry => {
      const matchesSearch =
        entry.date.includes(searchQuery) ||
        entry.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.notes && entry.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
      return matchesSearch;
    });
  }, [rawEntries, searchQuery, statusFilter]);

  // Monthly Summary Calculations
  const totalDaysWorked = rawEntries.length;
  const totalHoursWorked = rawEntries.reduce((sum, e) => sum + e.totalHours, 0);
  const totalLateMinutes = rawEntries.reduce((sum, e) => sum + e.lateMinutes, 0);
  const totalOvertimeHours = rawEntries.reduce((sum, e) => sum + e.overtimeHours, 0);
  const totalUndertimeMinutes = rawEntries.reduce((sum, e) => sum + e.undertimeMinutes, 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Export to CSV Function
  const handleDownloadCSV = () => {
    const headers = [
      'Date',
      'Employee Name',
      'Employee Code',
      'Scheduled Shift',
      'Time In',
      'Time Out',
      'Total Hours Worked',
      'Late (mins)',
      'Overtime (hrs)',
      'Undertime (mins)',
      'Status',
      'Notes'
    ];

    const rows = filteredEntries.map(e => [
      e.date,
      `"${e.employeeName}"`,
      e.employeeCode,
      `"${e.scheduledShift}"`,
      e.timeIn,
      e.timeOut,
      e.totalHours.toFixed(2),
      e.lateMinutes,
      e.overtimeHours.toFixed(2),
      e.undertimeMinutes,
      e.status,
      `"${e.notes || ''}"`
    ]);

    // CSV summary line
    rows.push([]);
    rows.push([
      'TOTALS',
      `"${selectedStaff.employeeName}"`,
      selectedStaff.employeeCode,
      `Month: ${monthNames[selectedMonth]} ${selectedYear}`,
      '',
      '',
      totalHoursWorked.toFixed(2),
      `${totalLateMinutes} mins`,
      `${totalOvertimeHours.toFixed(2)} hrs`,
      `${totalUndertimeMinutes} mins`,
      `Days Worked: ${totalDaysWorked}`,
      ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Timesheet_${selectedStaff.employeeName.replace(/\s+/g, '_')}_${monthNames[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`✓ Timesheet CSV downloaded for ${selectedStaff.employeeName}!`);
  };

  // Printable PDF / Window Handler
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocked! Please allow pop-ups to generate PDF/Print report.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Monthly Timesheet - ${selectedStaff.employeeName} (${monthNames[selectedMonth]} ${selectedYear})</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .badge { background: #0284c7; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }
            .emp-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-bottom: 25px; }
            .info-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .info-val { font-size: 14px; font-weight: bold; color: #0f172a; }
            .summary-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 25px; }
            .card { background: #ffffff; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; text-align: center; }
            .card-num { font-size: 18px; font-weight: 900; color: #0284c7; }
            .card-label { font-size: 10px; font-weight: bold; color: #475569; text-transform: uppercase; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { background: #0f172a; color: white; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
            td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) { background: #f8fafc; }
            .status-ontime { color: #16a34a; font-weight: bold; }
            .status-late { color: #dc2626; font-weight: bold; }
            .status-ot { color: #d97706; font-weight: bold; }
            .status-ut { color: #2563eb; font-weight: bold; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; padding-top: 30px; }
            .sig-box { width: 40%; border-top: 1px solid #94a3b8; text-align: center; font-size: 11px; color: #475569; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">EMPLOYEE MONTHLY TIMESHEET REPORT</h1>
              <div class="subtitle">Official Shift Clock-In / Timecard Attendance Log</div>
            </div>
            <span class="badge">${monthNames[selectedMonth]} ${selectedYear}</span>
          </div>

          <div class="emp-info">
            <div>
              <div class="info-label">Employee Name</div>
              <div class="info-val">${selectedStaff.employeeName}</div>
            </div>
            <div>
              <div class="info-label">Employee Code</div>
              <div class="info-val">${selectedStaff.employeeCode}</div>
            </div>
            <div>
              <div class="info-label">Role & Position</div>
              <div class="info-val">${selectedStaff.role}</div>
            </div>
            <div>
              <div class="info-label">Scheduled Shift</div>
              <div class="info-val">${selectedStaff.scheduledShift}</div>
            </div>
          </div>

          <div class="summary-cards">
            <div class="card">
              <div class="card-num">${totalDaysWorked}</div>
              <div class="card-label">Days Worked</div>
            </div>
            <div class="card">
              <div class="card-num">${totalHoursWorked.toFixed(1)} hrs</div>
              <div class="card-label">Total Hours</div>
            </div>
            <div class="card">
              <div class="card-num" style="color: ${totalLateMinutes > 0 ? '#dc2626' : '#16a34a'};">${totalLateMinutes} mins</div>
              <div class="card-label">Total Late</div>
            </div>
            <div class="card">
              <div class="card-num" style="color: #d97706;">${totalOvertimeHours.toFixed(1)} hrs</div>
              <div class="card-label">Total Overtime</div>
            </div>
            <div class="card">
              <div class="card-num" style="color: #2563eb;">${totalUndertimeMinutes} mins</div>
              <div class="card-label">Total Undertime</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Scheduled Shift</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Total Hours</th>
                <th>Late</th>
                <th>Overtime</th>
                <th>Undertime</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEntries
                .map(
                  e => `
                <tr>
                  <td><strong>${e.date}</strong></td>
                  <td>${e.scheduledShift}</td>
                  <td>${e.timeIn}</td>
                  <td>${e.timeOut}</td>
                  <td><strong>${e.totalHours.toFixed(2)} hrs</strong></td>
                  <td style="color: ${e.lateMinutes > 0 ? '#dc2626' : '#64748b'}">${e.lateMinutes > 0 ? `${e.lateMinutes} mins` : '-'}</td>
                  <td style="color: ${e.overtimeHours > 0 ? '#d97706' : '#64748b'}">${e.overtimeHours > 0 ? `${e.overtimeHours.toFixed(1)} hrs` : '-'}</td>
                  <td style="color: ${e.undertimeMinutes > 0 ? '#2563eb' : '#64748b'}">${e.undertimeMinutes > 0 ? `${e.undertimeMinutes} mins` : '-'}</td>
                  <td class="status-${e.status.toLowerCase().replace(' ', '')}">${e.status}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-box">
              Employee Signature & Date<br/><strong>${selectedStaff.employeeName}</strong>
            </div>
            <div class="sig-box">
              Manager / Supervisor Approval<br/><strong>Store HR & Payroll Dept</strong>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter & Selector Controls */}
      <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Monthly Employee Timesheet</h2>
              <p className="text-xs text-slate-400">
                Detailed timecards, clock-in, clock-out, late, overtime & undertime summary log
              </p>
            </div>
          </div>

          {/* Export / Download Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition active:scale-95"
            >
              <Download className="h-4 w-4" /> Download CSV Timesheet
            </button>

            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-lg shadow-sky-600/20 transition active:scale-95"
            >
              <Printer className="h-4 w-4" /> Print / Save PDF Report
            </button>
          </div>
        </div>

        {/* Month, Year, and Employee Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          {/* Employee Selector */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Select Employee:</label>
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs font-black text-white focus:outline-none focus:border-indigo-500"
            >
              {schedules.map(staff => (
                <option key={staff.employeeId} value={staff.employeeId}>
                  {staff.employeeName} ({staff.employeeCode}) - {staff.role}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Select Month:</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs font-black text-white focus:outline-none focus:border-indigo-500"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Select Year:</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs font-black text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>
        </div>
      </div>

      {/* Monthly Summary Statistics Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Days Worked */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md space-y-1">
          <p className="text-[10px] font-extrabold uppercase text-slate-400">Shifts Worked</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-white">{totalDaysWorked} Days</span>
            <Calendar className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="text-[10px] text-slate-500">{monthNames[selectedMonth]} {selectedYear}</p>
        </div>

        {/* Total Hours Worked */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md space-y-1">
          <p className="text-[10px] font-extrabold uppercase text-slate-400">Total Hours</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-400">{totalHoursWorked.toFixed(1)} hrs</span>
            <Clock className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-[10px] text-slate-500">Avg {(totalHoursWorked / (totalDaysWorked || 1)).toFixed(1)} hrs/shift</p>
        </div>

        {/* Total Late Minutes */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md space-y-1">
          <p className="text-[10px] font-extrabold uppercase text-slate-400">Late Duration</p>
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-black ${totalLateMinutes > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalLateMinutes} mins
            </span>
            <AlertTriangle className={`h-5 w-5 ${totalLateMinutes > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <p className="text-[10px] text-slate-500">Tardiness penalties</p>
        </div>

        {/* Total Overtime Hours */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md space-y-1">
          <p className="text-[10px] font-extrabold uppercase text-slate-400">Overtime (OT)</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-400">{totalOvertimeHours.toFixed(1)} hrs</span>
            <TrendingUp className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-[10px] text-slate-500">Extra shift hours</p>
        </div>

        {/* Total Undertime Minutes */}
        <div className="col-span-2 sm:col-span-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md space-y-1">
          <p className="text-[10px] font-extrabold uppercase text-slate-400">Undertime (UT)</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-sky-400">{totalUndertimeMinutes} mins</span>
            <Clock className="h-5 w-5 text-sky-400" />
          </div>
          <p className="text-[10px] text-slate-500">Early departure time</p>
        </div>
      </div>

      {/* Filter and Search Bar for Timesheet Table */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search date, status, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['all', 'On Time', 'Late', 'Overtime', 'Undertime'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'all' ? 'All Days' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Monthly Timesheet Log Table */}
      <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              {selectedStaff.employeeName} — {monthNames[selectedMonth]} {selectedYear} Timesheet ({filteredEntries.length} Records)
            </h3>
          </div>
          <span className="text-[10px] font-black text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
            Role: {selectedStaff.role}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Scheduled Shift</th>
                <th className="py-3 px-4">Time In</th>
                <th className="py-3 px-4">Time Out</th>
                <th className="py-3 px-4"># Hours</th>
                <th className="py-3 px-4">Late</th>
                <th className="py-3 px-4">Overtime</th>
                <th className="py-3 px-4">Undertime</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-500 font-bold">
                    No timesheet entries found for this month or filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-900/60 transition">
                    {/* Date */}
                    <td className="py-3 px-4 font-black text-white whitespace-nowrap">
                      {new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    {/* Scheduled Shift */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">{entry.scheduledShift}</td>

                    {/* Time In */}
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {entry.timeIn}
                    </td>

                    {/* Time Out */}
                    <td className="py-3 px-4 font-mono font-bold text-sky-400 whitespace-nowrap">
                      {entry.timeOut}
                    </td>

                    {/* # of Hours */}
                    <td className="py-3 px-4 font-mono font-black text-white whitespace-nowrap">
                      {entry.totalHours.toFixed(2)} hrs
                    </td>

                    {/* Late */}
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {entry.lateMinutes > 0 ? (
                        <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                          +{entry.lateMinutes} mins
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Overtime */}
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {entry.overtimeHours > 0 ? (
                        <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          +{entry.overtimeHours.toFixed(1)} hrs
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Undertime */}
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {entry.undertimeMinutes > 0 ? (
                        <span className="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                          -{entry.undertimeMinutes} mins
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {entry.status === 'On Time' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                          <CheckCircle2 className="h-3 w-3" /> On Time
                        </span>
                      )}
                      {entry.status === 'Late' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-md">
                          <AlertTriangle className="h-3 w-3" /> Late
                        </span>
                      )}
                      {entry.status === 'Overtime' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                          <TrendingUp className="h-3 w-3" /> Overtime
                        </span>
                      )}
                      {entry.status === 'Undertime' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-0.5 rounded-md">
                          <Clock className="h-3 w-3" /> Undertime
                        </span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-xs">
                      {entry.notes || <span className="text-slate-600 italic">No remarks</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
