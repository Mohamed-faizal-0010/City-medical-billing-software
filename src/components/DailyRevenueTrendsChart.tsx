import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Trophy,
  Calendar,
  Layers,
  Sparkles,
  CreditCard,
  Wallet,
  Receipt,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { SaleTransaction } from '../types';

interface DailyRevenueTrendsChartProps {
  transactions: SaleTransaction[];
  onSelectDate?: (dateStr: string) => void;
}

type WeekScope = 'current_week' | 'last_7_days' | 'previous_week';
type ChartMetric = 'revenue' | 'split' | 'bills';

interface DayData {
  dateStr: string;
  dayName: string;
  shortDate: string;
  fullDateLabel: string;
  displayLabel: string;
  revenue: number;
  cashRevenue: number;
  upiRevenue: number;
  billCount: number;
  cogs: number;
  grossProfit: number;
  averageBillValue: number;
  isToday: boolean;
  isPeak: boolean;
  isFuture: boolean;
}

export const DailyRevenueTrendsChart: React.FC<DailyRevenueTrendsChartProps> = ({
  transactions,
  onSelectDate
}) => {
  const [weekScope, setWeekScope] = useState<WeekScope>('current_week');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('revenue');

  // Compute daily revenue aggregates based on chosen week scope
  const { daysData, peakDay, totalWeekRevenue, averageDailyRevenue, totalWeekBills, averageBillValue, upiPercent } = useMemo(() => {
    const now = new Date();
    // Normalize to midnight
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = todayMidnight.toISOString().split('T')[0];

    const datesList: Date[] = [];

    if (weekScope === 'current_week') {
      // Monday to Sunday of the current week (ISO business week)
      const dayOfWeek = todayMidnight.getDay(); // 0 is Sunday, 1 is Monday...
      const distanceToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(todayMidnight);
      monday.setDate(todayMidnight.getDate() - distanceToMonday);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        datesList.push(d);
      }
    } else if (weekScope === 'last_7_days') {
      // Rolling 7 days up to today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayMidnight);
        d.setDate(todayMidnight.getDate() - i);
        datesList.push(d);
      }
    } else if (weekScope === 'previous_week') {
      // Previous week Monday to Sunday
      const dayOfWeek = todayMidnight.getDay();
      const distanceToMonday = (dayOfWeek + 6) % 7;
      const lastMonday = new Date(todayMidnight);
      lastMonday.setDate(todayMidnight.getDate() - distanceToMonday - 7);

      for (let i = 0; i < 7; i++) {
        const d = new Date(lastMonday);
        d.setDate(lastMonday.getDate() + i);
        datesList.push(d);
      }
    }

    // Index transactions by YYYY-MM-DD
    const txByDate: Record<string, SaleTransaction[]> = {};
    transactions.forEach(tx => {
      if (!tx.date) return;
      const datePart = tx.date.slice(0, 10);
      if (!txByDate[datePart]) {
        txByDate[datePart] = [];
      }
      txByDate[datePart].push(tx);
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let maxRev = -1;

    const rawData: DayData[] = datesList.map(dateObj => {
      const dateStr = dateObj.toISOString().split('T')[0];
      const dayName = dayNames[dateObj.getDay()];
      const shortDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]}`;
      const fullDateLabel = `${dayName}, ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
      const isToday = dateStr === todayStr;
      const isFuture = dateObj.getTime() > todayMidnight.getTime();

      const dayTxs = txByDate[dateStr] || [];

      let revenue = 0;
      let cashRevenue = 0;
      let upiRevenue = 0;
      let cogs = 0;

      dayTxs.forEach(tx => {
        const amount = Number(tx.grandTotal ?? 0);
        revenue += amount;
        cogs += Number(tx.costOfGoodsSold ?? 0);

        if (tx.paymentMethod === 'Cash') {
          cashRevenue += amount;
        } else if (tx.paymentMethod === 'UPI') {
          upiRevenue += amount;
        } else if (tx.paymentMethod === 'Split' && tx.splitPayment) {
          cashRevenue += Number(tx.splitPayment.cashAmount ?? 0);
          upiRevenue += Number(tx.splitPayment.upiAmount ?? 0);
        } else {
          // Card or other treated as digital/UPI
          upiRevenue += amount;
        }
      });

      if (revenue > maxRev) {
        maxRev = revenue;
      }

      const billCount = dayTxs.length;
      const grossProfit = revenue - cogs;
      const averageBillValue = billCount > 0 ? revenue / billCount : 0;

      return {
        dateStr,
        dayName,
        shortDate,
        fullDateLabel,
        displayLabel: `${dayName} ${dateObj.getDate()}`,
        revenue: Math.round(revenue * 100) / 100,
        cashRevenue: Math.round(cashRevenue * 100) / 100,
        upiRevenue: Math.round(upiRevenue * 100) / 100,
        billCount,
        cogs: Math.round(cogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        averageBillValue: Math.round(averageBillValue * 100) / 100,
        isToday,
        isPeak: false, // will mark below
        isFuture
      };
    });

    // Mark peak day(s) (only if revenue > 0)
    let peakItem: DayData | null = null;
    if (maxRev > 0) {
      rawData.forEach(d => {
        if (d.revenue === maxRev) {
          d.isPeak = true;
          if (!peakItem) peakItem = d;
        }
      });
    }

    const totalRev = rawData.reduce((acc, d) => acc + d.revenue, 0);
    const totalBills = rawData.reduce((acc, d) => acc + d.billCount, 0);
    const activeDaysCount = rawData.filter(d => !d.isFuture && d.revenue > 0).length || 1;
    const avgDailyRev = totalRev / activeDaysCount;
    const avgAov = totalBills > 0 ? totalRev / totalBills : 0;

    const totalUpi = rawData.reduce((acc, d) => acc + d.upiRevenue, 0);
    const upiShare = totalRev > 0 ? Math.round((totalUpi / totalRev) * 100) : 0;

    return {
      daysData: rawData,
      peakDay: peakItem as DayData | null,
      totalWeekRevenue: totalRev,
      averageDailyRevenue: avgDailyRev,
      totalWeekBills: totalBills,
      averageBillValue: avgAov,
      upiPercent: upiShare
    };
  }, [transactions, weekScope]);

  // Format currency for ticks and tooltips
  const formatINR = (val: number) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatShortINR = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayData = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <div>
              <p className="font-bold text-slate-100 text-sm">{data.fullDateLabel}</p>
              {data.isToday && (
                <span className="text-[10px] uppercase font-black text-sky-400">● Today's Sales</span>
              )}
            </div>
            {data.isPeak && (
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-[10px] font-black flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>Peak Day</span>
              </span>
            )}
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between items-center text-sm font-black">
              <span className="text-slate-300">Total Revenue:</span>
              <span className="text-emerald-400 font-mono">{formatINR(data.revenue)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300 text-xs">
              <span>Transactions / Bills:</span>
              <span className="font-bold text-white">{data.billCount} bills</span>
            </div>

            <div className="flex justify-between items-center text-slate-300 text-xs">
              <span>Avg Order Value (AOV):</span>
              <span className="font-mono text-slate-200">{formatINR(data.averageBillValue)}</span>
            </div>

            {data.revenue > 0 && (
              <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/50">
                  <span className="text-sky-300 block font-semibold">UPI / Digital</span>
                  <span className="font-mono font-bold text-white">{formatINR(data.upiRevenue)}</span>
                  <span className="text-[10px] text-slate-400 block">
                    {Math.round((data.upiRevenue / data.revenue) * 100)}%
                  </span>
                </div>
                <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/50">
                  <span className="text-amber-300 block font-semibold">Cash Counter</span>
                  <span className="font-mono font-bold text-white">{formatINR(data.cashRevenue)}</span>
                  <span className="text-[10px] text-slate-400 block">
                    {Math.round((data.cashRevenue / data.revenue) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {data.isFuture && (
              <p className="text-[10px] text-slate-400 italic pt-1 text-center">
                Upcoming business day in this week
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Peak day comparison calculation
  const peakAboveAvgPercent = peakDay && averageDailyRevenue > 0
    ? Math.round(((peakDay.revenue - averageDailyRevenue) / averageDailyRevenue) * 100)
    : 0;

  const peakSharePercent = peakDay && totalWeekRevenue > 0
    ? Math.round((peakDay.revenue / totalWeekRevenue) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* 1. Header with Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl">
              <BarChart3 className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Daily Revenue Trends & Peak Performance</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Recharts Visualizer
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Identify highest turnover days, dispense patterns, and peak customer traffic for proactive staffing & inventory
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Week Scope Selector & Metric View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Week Scope Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setWeekScope('current_week')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                weekScope === 'current_week'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current Week
            </button>
            <button
              type="button"
              onClick={() => setWeekScope('last_7_days')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                weekScope === 'last_7_days'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setWeekScope('previous_week')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                weekScope === 'previous_week'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prev Week
            </button>
          </div>

          {/* Metric View Toggle */}
          <div className="flex items-center bg-teal-50/60 p-1 rounded-xl border border-teal-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartMetric('revenue')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                chartMetric === 'revenue'
                  ? 'bg-teal-700 text-white font-bold shadow-2xs'
                  : 'text-teal-900 hover:bg-teal-100/50'
              }`}
              title="Daily Total Revenue"
            >
              <span>Revenue (₹)</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('split')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                chartMetric === 'split'
                  ? 'bg-teal-700 text-white font-bold shadow-2xs'
                  : 'text-teal-900 hover:bg-teal-100/50'
              }`}
              title="Cash vs UPI Split"
            >
              <Layers className="w-3 h-3" />
              <span>UPI vs Cash</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('bills')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                chartMetric === 'bills'
                  ? 'bg-teal-700 text-white font-bold shadow-2xs'
                  : 'text-teal-900 hover:bg-teal-100/50'
              }`}
              title="Bill & Patient Transaction Count"
            >
              <Receipt className="w-3 h-3" />
              <span>Invoices</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Insights Strip: Peak Day KPI Card & Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Peak Day Highlight Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50/60 rounded-xl p-3.5 border-2 border-amber-300 shadow-2xs relative overflow-hidden">
          <div className="absolute top-2 right-2 p-1.5 bg-amber-400/20 text-amber-700 rounded-lg">
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Peak Performance Day</span>
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-black text-slate-900">
              {peakDay ? peakDay.dayName : 'None'}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {peakDay ? peakDay.shortDate : 'No data'}
            </span>
          </div>
          <div className="text-base font-extrabold text-amber-900 font-mono mt-0.5">
            {peakDay ? formatINR(peakDay.revenue) : '₹0.00'}
          </div>
          <div className="mt-1 text-[11px] text-amber-800 font-medium flex items-center gap-1.5">
            {peakDay ? (
              <>
                <span className="font-bold">{peakDay.billCount} bills</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">+{peakAboveAvgPercent}% vs avg</span>
                <span>•</span>
                <span>{peakSharePercent}% share</span>
              </>
            ) : (
              <span>No transactions recorded</span>
            )}
          </div>
        </div>

        {/* Total Week Revenue */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            {weekScope === 'current_week' ? 'Week Turnover' : 'Period Turnover'}
          </span>
          <div className="text-lg font-black text-slate-900 font-mono mt-1">
            {formatINR(totalWeekRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Receipt className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-bold text-slate-700">{totalWeekBills} total bills dispensed</span>
          </p>
        </div>

        {/* Daily Average Revenue */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Active Daily Average
          </span>
          <div className="text-lg font-black text-teal-700 font-mono mt-1">
            {formatINR(averageDailyRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>Benchmark for peak comparison</span>
          </p>
        </div>

        {/* Payment Preference Split (UPI vs Cash) */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Digital / UPI Share
          </span>
          <div className="text-lg font-black text-indigo-700 font-mono mt-1">
            {upiPercent}% UPI
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5 flex">
            <div className="bg-indigo-600 h-full transition-all" style={{ width: `${upiPercent}%` }} />
            <div className="bg-amber-500 h-full transition-all" style={{ width: `${100 - upiPercent}%` }} />
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-mono">
            <span>UPI: {upiPercent}%</span>
            <span>Cash: {100 - upiPercent}%</span>
          </div>
        </div>
      </div>

      {/* 3. Recharts Main Canvas */}
      <div className="w-full pt-1">
        <div className="h-[300px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={daysData}
              margin={{ top: 25, right: 15, left: 10, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0] && onSelectDate) {
                  onSelectDate(e.activePayload[0].payload.dateStr);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="displayLabel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={val => (chartMetric === 'bills' ? val : formatShortINR(val))}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />

              {/* Reference line for Daily Average when looking at revenue */}
              {chartMetric === 'revenue' && averageDailyRevenue > 0 && (
                <ReferenceLine
                  y={averageDailyRevenue}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Daily Avg: ${formatShortINR(averageDailyRevenue)}`,
                    position: 'top',
                    fill: '#64748b',
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />
              )}

              {/* Chart Metric: Single Total Revenue Bar with Peak/Today Dynamic Coloring */}
              {chartMetric === 'revenue' && (
                <Bar
                  dataKey="revenue"
                  name="Revenue (₹)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {daysData.map((entry, index) => {
                    let fill = '#0d9488'; // standard teal
                    if (entry.isPeak && entry.revenue > 0) {
                      fill = '#f59e0b'; // Gold / Amber for peak performance day!
                    } else if (entry.isToday) {
                      fill = '#0284c7'; // Vivid Sky Blue for today
                    } else if (entry.isFuture) {
                      fill = '#e2e8f0'; // Muted slate for future days
                    }
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={fill}
                        className="transition-all hover:opacity-85 cursor-pointer"
                      />
                    );
                  })}
                </Bar>
              )}

              {/* Chart Metric: Stacked UPI vs Cash */}
              {chartMetric === 'split' && (
                <>
                  <Legend
                    wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="upiRevenue"
                    name="UPI / Digital (₹)"
                    stackId="payment"
                    fill="#4f46e5"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    dataKey="cashRevenue"
                    name="Cash Counter (₹)"
                    stackId="payment"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </>
              )}

              {/* Chart Metric: Bill Volume / Patient Count */}
              {chartMetric === 'bills' && (
                <Bar
                  dataKey="billCount"
                  name="Invoices Dispensed"
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {daysData.map((entry, index) => {
                    let fill = '#0f766e';
                    if (entry.isPeak && entry.revenue > 0) {
                      fill = '#d97706';
                    } else if (entry.isToday) {
                      fill = '#0369a1';
                    } else if (entry.isFuture) {
                      fill = '#e2e8f0';
                    }
                    return <Cell key={`cell-bill-${index}`} fill={fill} />;
                  })}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Legend Key & Operational Recommendation Footnote */}
      <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Color Legend Indicators */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500 ring-1 ring-amber-300" />
            <span className="text-amber-900 font-bold">🏆 Peak Performance Day</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-sky-600" />
            <span className="text-sky-900 font-bold">● Today's Sales</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-teal-600" />
            <span>Regular Days</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-200" />
            <span className="text-slate-400">Upcoming / No Sales</span>
          </span>
        </div>

        {/* Pharmacy Owner Operational Insight Badge */}
        <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-1.5 text-[11px] text-amber-950">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            {peakDay ? (
              <>
                <strong>{peakDay.fullDateLabel}</strong> had highest volume ({formatINR(peakDay.revenue)}). Plan extra cashier & fast-mover rack restocking.
              </>
            ) : (
              <span>Punch sales at POS to track real-time daily turnover trends.</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
