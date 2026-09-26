/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { OrderProvider, useOrderContext } from './context/OrderContext';
import { Header } from './components/Header';
import { MobileFrame } from './components/Customer/MobileFrame';
import { CustomerLanding } from './components/Customer/CustomerLanding';
import { CustomerHome } from './components/Customer/CustomerHome';
import { KitchenDashboard } from './components/Kitchen/KitchenDashboard';
import { CashierDashboard } from './components/Cashier/CashierDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { OrderStatusToast } from './components/Common/OrderStatusToast';
import { AdminInventoryToast } from './components/Admin/AdminInventoryToast';
import { ToastBanner } from './components/Common/ToastBanner';

function MainAppContent() {
  const { viewMode, selectTableByNumber, isTableSelected } = useOrderContext();

  // Handle URL query parameters e.g., ?table=12
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table');
      if (tableParam) {
        selectTableByNumber(tableParam);
      }
    } catch (e) {
      console.warn('URL search parse error:', e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Global notification banner (kept visible on every view) */}
      <ToastBanner />

      {/* Top Header & Role Switcher - hidden on the customer app, which is a standalone
          phone experience: it shows a landing page until the table QR is scanned. */}
      {viewMode !== 'customer' && <Header />}

      {/* Main View Layouts */}
      <main className="w-full">
        {viewMode === 'customer' && (
          <MobileFrame>
            {isTableSelected ? <CustomerHome /> : <CustomerLanding />}
          </MobileFrame>
        )}

        {viewMode === 'kitchen' && <KitchenDashboard />}

        {viewMode === 'cashier' && <CashierDashboard />}

        {viewMode === 'admin' && <AdminDashboard />}
      </main>

      {/* Global Order Status Change Toast Notifications */}
      <OrderStatusToast />

      {/* Global Low-Stock & Inventory Warning Toast Notifications for Kitchen, Cashier, and Admin */}
      <AdminInventoryToast />
    </div>
  );
}

export default function App() {
  return (
    <OrderProvider>
      <MainAppContent />
    </OrderProvider>
  );
}
