import React, { useState, useMemo } from 'react';
import { useOrderContext } from '../../context/OrderContext';
import { Order, Product } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Flame,
  Clock,
  TrendingUp,
  Award,
  DollarSign,
  ShoppingBag,
  Filter,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export const AnalyticsDashboard: React.FC = () => {
  const { orders, products, categories } = useOrderContext();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'all'>('all');
  const [metricType, setMetricType] = useState<'quantity' | 'revenue'>('quantity');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      if (o.status === 'cancelled') return false;
      const orderDate = new Date(o.createdAt);
      if (timeRange === 'today') {
        return orderDate.toDateString() === now.toDateString();
      } else if (timeRange === 'week') {
        const diffDays = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      return true;
    });
  }, [orders, timeRange]);

  // 1. Item Popularity Data
  const itemPopularityData = useMemo(() => {
    const statsMap: Record<string, { id: string; name: string; quantity: number; revenue: number; categoryId: string }> = {};

    // Initialize with known products
    products.forEach(p => {
      statsMap[p.id] = {
        id: p.id,
        name: p.name,
        quantity: 0,
        revenue: 0,
        categoryId: p.categoryId,
      };
    });

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!statsMap[item.productId]) {
          statsMap[item.productId] = {
            id: item.productId,
            name: item.productName,
            quantity: 0,
            revenue: 0,
            categoryId: 'unknown',
          };
        }
        statsMap[item.productId].quantity += item.quantity;
        statsMap[item.productId].revenue += item.itemTotal;
      });
    });

    let result = Object.values(statsMap);

    if (selectedCategory !== 'all') {
      result = result.filter(item => item.categoryId === selectedCategory);
    }

    // Sort by selected metric
    result.sort((a, b) => (metricType === 'quantity' ? b.quantity - a.quantity : b.revenue - a.revenue));

    // Return top 8
    return result.slice(0, 8);
  }, [products, filteredOrders, selectedCategory, metricType]);

  // 2. Peak Hours Data (08:00 to 22:00)
  const peakHoursData = useMemo(() => {
    const hourBuckets: { [hour: number]: { count: number; revenue: number; items: number } } = {};

    for (let h = 8; h <= 22; h++) {
      hourBuckets[h] = { count: 0, revenue: 0, items: 0 };
    }

    filteredOrders.forEach(order => {
      const orderHour = new Date(order.createdAt).getHours();
      if (hourBuckets[orderHour] !== undefined) {
        hourBuckets[orderHour].count += 1;
        hourBuckets[orderHour].revenue += order.total;
        const totalItemsInOrder = order.items.reduce((sum, i) => sum + i.quantity, 0);
        hourBuckets[orderHour].items += totalItemsInOrder;
      }
    });

    return Object.keys(hourBuckets).map(hStr => {
      const h = parseInt(hStr, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const formattedHour = h % 12 === 0 ? 12 : h % 12;
      const label = `${formattedHour} ${ampm}`;

      return {
        hour: label,
        rawHour: h,
        ordersCount: hourBuckets[h].count,
        revenue: Math.round(hourBuckets[h].revenue),
        itemsSold: hourBuckets[h].items,
      };
    });
  }, [filteredOrders]);

  // 3. Category Distribution Data
  const categoryDistributionData = useMemo(() => {
    const catMap: Record<string, { name: string; value: number; revenue: number }> = {};

    categories.forEach(c => {
      catMap[c.id] = { name: c.name, value: 0, revenue: 0 };
    });

    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const catId = prod?.categoryId || 'cat-other';
        if (catMap[catId]) {
          catMap[catId].value += item.quantity;
          catMap[catId].revenue += item.itemTotal;
        } else {
          catMap[catId] = { name: 'Other', value: item.quantity, revenue: item.itemTotal };
        }
      });
    });

    return Object.values(catMap).filter(c => c.value > 0);
  }, [categories, products, filteredOrders]);

  // Key Analytics Highlights
  const topItem = itemPopularityData[0];
  const peakHour = useMemo(() => {
    if (peakHoursData.length === 0) return null;
    return [...peakHoursData].sort((a, b) => b.ordersCount - a.ordersCount)[0];
  }, [peakHoursData]);

  const totalItemsSold = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0);
  }, [filteredOrders]);

  const totalRevenueCalculated = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.total, 0);
  }, [filteredOrders]);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-black uppercase text-slate-300">Analytics Controls:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded-lg transition ${
                timeRange === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded-lg transition ${
                timeRange === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 rounded-lg transition ${
                timeRange === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Highlights KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800/80 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">#1 Top Dish</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg font-black text-white truncate">{topItem ? topItem.name : 'N/A'}</p>
          <p className="text-xs font-extrabold text-amber-400">
            {topItem ? `${topItem.quantity} Sold • ₱${topItem.revenue.toFixed(2)}` : 'No data'}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800/80 shadow-xl space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Peak Ordering Hour</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg font-black text-white">{peakHour ? peakHour.hour : '12:00 PM'}</p>
          <p className="text-xs font-extrabold text-indigo-400">
            {peakHour ? `${peakHour.ordersCount} Orders Rush` : '0 Orders'}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800/80 shadow-xl space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Items Prepared</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white">{totalItemsSold} Items</p>
          <p className="text-xs text-slate-400">Across {filteredOrders.length} completed orders</p>
        </div>

        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800/80 shadow-xl space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Filtered Sales Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400">₱{totalRevenueCalculated.toFixed(2)}</p>
          <p className="text-xs text-slate-400">Avg ₱{(totalRevenueCalculated / Math.max(1, filteredOrders.length)).toFixed(2)} / order</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CHART 1: ITEM POPULARITY (Recharts BarChart) */}
        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">Item Popularity Leaderboard</h3>
              </div>
              <p className="text-xs text-slate-400">Ranking top performing dishes by volume or total revenue</p>
            </div>

            <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => setMetricType('quantity')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  metricType === 'quantity' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Units Sold
              </button>
              <button
                onClick={() => setMetricType('revenue')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  metricType === 'revenue' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Revenue (₱)
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={itemPopularityData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#cbd5e1"
                  fontSize={11}
                  width={110}
                  tickFormatter={val => (val.length > 15 ? `${val.slice(0, 15)}...` : val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  formatter={(value: number) =>
                    metricType === 'revenue' ? [`₱${value.toFixed(2)}`, 'Revenue'] : [`${value} Units`, 'Quantity Sold']
                  }
                />
                <Bar
                  dataKey={metricType === 'quantity' ? 'quantity' : 'revenue'}
                  fill="#6366f1"
                  radius={[0, 8, 8, 0]}
                  name={metricType === 'quantity' ? 'Units Sold' : 'Revenue (₱)'}
                >
                  {itemPopularityData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#f59e0b' : index === 1 ? '#3b82f6' : '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: PEAK ORDERING HOURS (Recharts AreaChart) */}
        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Peak Ordering Hours Timeline</h3>
              </div>
              <p className="text-xs text-slate-400">Order traffic distribution throughout restaurant business hours</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={peakHoursData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'ordersCount' ? `${value} Orders` : `₱${value}`,
                    name === 'ordersCount' ? 'Order Volume' : 'Revenue',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="ordersCount"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                  name="ordersCount"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Category Breakdown & Sales Velocity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Category Share PieChart */}
        <div className="rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <PieIcon className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-base font-black text-white">Category Share</h3>
              <p className="text-xs text-slate-400">Sales volume distribution by category</p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: number) => [`${val} items ordered`, 'Volume']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
            {categoryDistributionData.map((cat, idx) => (
              <span key={cat.name} className="flex items-center gap-1 text-slate-300">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                />
                {cat.name} ({cat.value})
              </span>
            ))}
          </div>
        </div>

        {/* Detailed Item Popularity Table */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-950 p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-base font-black text-white">Item Popularity Matrix</h3>
              <p className="text-xs text-slate-400">Cross-reference unit sales, total earnings, and current stock status</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400">
                <tr>
                  <th className="pb-2">Dish Name</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Units Sold</th>
                  <th className="pb-2 text-right">Total Revenue</th>
                  <th className="pb-2 text-right">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-200">
                {itemPopularityData.map((item, idx) => {
                  const matchedProduct = products.find(p => p.id === item.id);
                  const categoryObj = categories.find(c => c.id === item.categoryId);

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50">
                      <td className="py-2.5 flex items-center gap-2">
                        <span className="font-black text-slate-500 w-4">#{idx + 1}</span>
                        <span className="font-extrabold text-white">{item.name}</span>
                      </td>
                      <td className="py-2.5 text-slate-400">{categoryObj ? categoryObj.name : 'General'}</td>
                      <td className="py-2.5 text-right font-black text-indigo-400">{item.quantity}</td>
                      <td className="py-2.5 text-right font-black text-emerald-400">₱{item.revenue.toFixed(2)}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            matchedProduct?.inStock
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {matchedProduct?.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
