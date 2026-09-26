/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { OrderProvider, useOrderContext } from './context/OrderContext';
import { Header } from './components/Header';
import { MobileFrame } from './components/Customer/MobileFrame';
import { CustomerHome } from './components/Customer/CustomerHome';
import { KitchenDashboard } from './components/Kitchen/KitchenDashboard';
import { CashierDashboard } from './components/Cashier/CashierDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { OrderStatusToast } from './components/Common/OrderStatusToast';
import { AdminInventoryToast } from './components/Admin/AdminInventoryToast';

function MainAppContent() {
  const { viewMode, selectTableByNumber } = useOrderContext();

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
      {/* Top Header & Role Switcher */}
      <Header />

      {/* Main View Layouts */}
      <main className="w-full">
        {viewMode === 'customer' && (
          <MobileFrame>
            <CustomerHome />
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
