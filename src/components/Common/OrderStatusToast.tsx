import React, { useEffect, useRef, useState } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { OrderStatus } from '../../types';
import { Bell, X, CheckCircle2, Clock, ChefHat, AlertCircle, ShoppingBag } from 'lucide-react';
import { playChime } from '../../utils/audio';

interface OrderChangeAlert {
  id: string;
  orderId: string;
  tableNumber: string;
  customerName: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: string;
}

export const OrderStatusToast: React.FC = () => {
  const { orders, soundEnabled } = useOrderContext();
  const [activeAlerts, setActiveAlerts] = useState<OrderChangeAlert[]>([]);
  const prevOrdersRef = useRef<Map<string, OrderStatus>>(new Map());
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Populate initial state without triggering alerts on page load
    if (isInitialMount.current) {
      const initialMap = new Map<string, OrderStatus>();
      orders.forEach(o => initialMap.set(o.id, o.status));
      prevOrdersRef.current = initialMap;
      isInitialMount.current = false;
      return;
    }

    const prevMap = prevOrdersRef.current;
    const newAlertsList: OrderChangeAlert[] = [];

    orders.forEach(order => {
      const oldStatus = prevMap.get(order.id);
      if (oldStatus && oldStatus !== order.status) {
        newAlertsList.push({
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          orderId: order.id,
          tableNumber: order.tableNumber,
          customerName: order.customerName,
          oldStatus,
          newStatus: order.status,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      }
      prevMap.set(order.id, order.status);
    });

    if (newAlertsList.length > 0) {
      setActiveAlerts(prev => [...newAlertsList, ...prev].slice(0, 4));

      if (soundEnabled) {
        const latestNewStatus = newAlertsList[0].newStatus;
        if (latestNewStatus === 'ready') playChime('order_ready');
        else if (latestNewStatus === 'preparing') playChime('new_order');
        else playChime('click');
      }
    }
  }, [orders, soundEnabled]);

  const dismissAlert = (id: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (activeAlerts.length === 0) return null;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock };
      case 'preparing':
        return { label: 'Preparing', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: ChefHat };
      case 'ready':
        return { label: 'Ready for Serve', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
      case 'completed':
        return { label: 'Completed', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: ShoppingBag };
      case 'cancelled':
        return { label: 'Cancelled', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: AlertCircle };
      default:
        return { label: status, bg: 'bg-slate-700 text-slate-200', icon: Bell };
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      {activeAlerts.map(alert => {
        const oldInfo = getStatusBadge(alert.oldStatus);
        const newInfo = getStatusBadge(alert.newStatus);
        const NewIcon = newInfo.icon;

        return (
          <div
            key={alert.id}
            className="pointer-events-auto relative overflow-hidden rounded-2xl bg-slate-900/95 text-white p-4 shadow-2xl border border-slate-700 backdrop-blur-md animate-slideUp space-y-2.5"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-white font-black shadow-md">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">
                    Order Status Update
                  </h4>
                  <p className="text-[10px] text-slate-400">{alert.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-sky-300">{alert.orderId}</span>
                <span className="text-slate-300">Table #{alert.tableNumber}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Customer: <span className="text-slate-200 font-semibold">{alert.customerName}</span>
              </p>

              {/* Status transition chips */}
              <div className="flex items-center gap-2 pt-1">
                <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${oldInfo.bg}`}>
                  {oldInfo.label}
                </span>
                <span className="text-slate-500 font-bold text-xs">→</span>
                <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-black rounded-md border ${newInfo.bg}`}>
                  <NewIcon className="h-3 w-3" />
                  {newInfo.label}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
