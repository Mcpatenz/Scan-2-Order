import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

export interface ReportFilterOptions {
  periodType: 'date' | 'month' | 'year' | 'all';
  selectedDate: string; // YYYY-MM-DD
  selectedMonth: string; // YYYY-MM
  selectedYear: string; // YYYY
  paymentStatus: 'all' | 'paid' | 'unpaid';
  diningOption: 'all' | 'dine_in' | 'takeout';
  generatedBy: string; // e.g. "Sarah Jenkins (Cashier)" or "Admin Manager"
  role: 'Cashier' | 'Admin';
}

export function generatePdfReport(orders: Order[], filter: ReportFilterOptions) {
  const doc = new jsPDF();

  // Filter orders based on periodType and filters
  const filteredOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const dateStr = o.createdAt.slice(0, 10); // YYYY-MM-DD
    const monthStr = o.createdAt.slice(0, 7); // YYYY-MM
    const yearStr = o.createdAt.slice(0, 4);  // YYYY

    // Date Filter
    if (filter.periodType === 'date' && filter.selectedDate && dateStr !== filter.selectedDate) {
      return false;
    }
    // Month Filter
    if (filter.periodType === 'month' && filter.selectedMonth && monthStr !== filter.selectedMonth) {
      return false;
    }
    // Year Filter
    if (filter.periodType === 'year' && filter.selectedYear && yearStr !== filter.selectedYear) {
      return false;
    }

    // Payment Status Filter
    if (filter.paymentStatus === 'paid' && o.paymentStatus !== 'paid') return false;
    if (filter.paymentStatus === 'unpaid' && o.paymentStatus !== 'unpaid') return false;

    // Dining Option Filter
    if (filter.diningOption === 'dine_in' && o.diningOption !== 'dine_in') return false;
    if (filter.diningOption === 'takeout' && o.diningOption !== 'takeout') return false;

    return true;
  });

  // Calculate Metrics
  const totalSales = filteredOrders
    .filter(o => o.paymentStatus === 'paid' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const paidCount = filteredOrders.filter(o => o.paymentStatus === 'paid' && o.status !== 'cancelled').length;
  const unpaidCount = filteredOrders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'cancelled').length;
  const cancelledCount = filteredOrders.filter(o => o.status === 'cancelled').length;
  const totalCount = filteredOrders.length;
  const avgOrderValue = paidCount > 0 ? totalSales / paidCount : 0;

  // Payment Breakdown
  const cashTotal = filteredOrders
    .filter(o => o.paymentStatus === 'paid' && o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.total, 0);
  const cardTotal = filteredOrders
    .filter(o => o.paymentStatus === 'paid' && o.paymentMethod === 'card')
    .reduce((sum, o) => sum + o.total, 0);
  const gcashTotal = filteredOrders
    .filter(o => o.paymentStatus === 'paid' && o.paymentMethod === 'gcash')
    .reduce((sum, o) => sum + o.total, 0);

  // Period Display Label
  let periodLabel = 'All Time';
  if (filter.periodType === 'date') periodLabel = `Daily: ${filter.selectedDate}`;
  if (filter.periodType === 'month') periodLabel = `Monthly: ${filter.selectedMonth}`;
  if (filter.periodType === 'year') periodLabel = `Yearly: ${filter.selectedYear}`;

  // PDF Styling Setup
  const primaryColor = [15, 23, 42]; // Slate 900
  const accentColor = [16, 185, 129]; // Emerald 500

  // 1. Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('QR BISTRO & CAFE', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${filter.role.toUpperCase()} OFFICIAL SALES & FINANCIAL REPORT`, 14, 22);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 15);
  doc.text(`By: ${filter.generatedBy}`, 140, 22);

  // 2. Report Overview Box
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Report Period: ${periodLabel}`, 14, 36);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Filter: ${filter.paymentStatus.toUpperCase()}  |  Dining Filter: ${filter.diningOption.toUpperCase()}`, 14, 42);

  // Summary Metrics Table/Grid
  const summaryRows = [
    ['Total Net Revenue', `₱${totalSales.toFixed(2)}`, 'Cash Payments', `₱${cashTotal.toFixed(2)}`],
    ['Total Orders Count', `${totalCount} orders`, 'Card Payments', `₱${cardTotal.toFixed(2)}`],
    ['Paid Orders', `${paidCount} orders`, 'GCash / Digital', `₱${gcashTotal.toFixed(2)}`],
    ['Unpaid Bills', `${unpaidCount} orders`, 'Avg Order Value', `₱${avgOrderValue.toFixed(2)}`],
    ['Cancelled Orders', `${cancelledCount} orders`, 'Report Scope', periodLabel],
  ];

  autoTable(doc, {
    startY: 46,
    head: [['Financial Metric', 'Value', 'Payment Method Breakdown', 'Total Amount']],
    body: summaryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
    },
    styles: {
      cellPadding: 2.5,
    },
  });

  // 3. Detailed Itemized Orders Table
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 90;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Itemized Orders List (${filteredOrders.length} records)`, 14, finalY);

  const orderTableRows = filteredOrders.map(o => [
    o.id,
    new Date(o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    `Table #${o.tableNumber}`,
    o.customerName,
    o.diningOption === 'dine_in' ? 'Dine In' : 'Takeout',
    o.paymentMethod.toUpperCase(),
    o.paymentStatus.toUpperCase(),
    o.status.toUpperCase(),
    `₱${o.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: finalY + 4,
    head: [['Order ID', 'Date & Time', 'Table', 'Customer', 'Type', 'Payment', 'Pay Status', 'Order Status', 'Amount']],
    body: orderTableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 2,
    },
  });

  // Footer & Page Numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Page ${i} of ${pageCount} • QR Bistro Management System • Confidentially Generated by ${filter.generatedBy}`,
      14,
      287
    );
  }

  // Save PDF
  const filename = `Sales_Report_${filter.periodType}_${filter.role.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
