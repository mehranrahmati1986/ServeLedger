import React, { useMemo, useState } from 'react';
import { Order } from '../types';
import { formatPrice, formatNumber, cn } from '../lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LineChart, Line, Legend } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, ShoppingCart, Ban, Receipt, Calculator, Download, Printer, CircleDollarSign, Plus, UserIcon, Utensils, Zap, Clock, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

interface AccountingViewProps {
  orders: Order[];
  restaurantInfo?: import('../types').RestaurantInfo;
  expenses?: import('../types').Expense[];
  onAddExpense?: (expense: import('../types').Expense) => void;
  cheques?: import('../types').Cheque[];
  onAddCheque?: (cheque: import('../types').Cheque) => void;
  onUpdateChequeStatus?: (id: string, status: import('../types').Cheque['status']) => void;
}

export function AccountingView({ orders, restaurantInfo, expenses = [], onAddExpense, cheques = [], onAddCheque, onUpdateChequeStatus }: AccountingViewProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [plPeriod, setPlPeriod] = useState<'daily' | 'monthly'>('monthly');
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'cheques' | 'taxes' | 'weekly-reports' | 'profit-loss'>('overview');

  // Expense form state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'salary' | 'rent' | 'supplies' | 'other' | 'waste'>('supplies');

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount || !onAddExpense) return;
    
    onAddExpense({
      id: Date.now().toString(),
      title: expenseTitle,
      amount: parseInt(expenseAmount.replace(/,/g, '')),
      category: expenseCategory,
      date: new Date().toISOString()
    });
    
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseCategory('supplies');
  };

  // Cheque form state
  const [chequeType, setChequeType] = useState<'received' | 'paid'>('received');
  const [chequeAmount, setChequeAmount] = useState('');
  const [chequeDueDate, setChequeDueDate] = useState('');
  const [chequeBank, setChequeBank] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeDescription, setChequeDescription] = useState('');

  const handleAddCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chequeAmount || !chequeDueDate || !chequeBank || !chequeNumber || !onAddCheque) return;
    
    onAddCheque({
      id: Date.now().toString(),
      type: chequeType,
      amount: parseInt(chequeAmount.replace(/,/g, '')),
      dueDate: chequeDueDate,
      status: 'pending',
      bankName: chequeBank,
      chequeNumber: chequeNumber,
      description: chequeDescription
    });
    
    setChequeAmount('');
    setChequeDueDate('');
    setChequeBank('');
    setChequeNumber('');
    setChequeDescription('');
  };

  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const msInDay = 24 * 60 * 60 * 1000;
    
    return orders.filter(o => {
      if (period === 'daily') {
        return o.date.startsWith(todayStr); // daily = today
      } else if (period === 'weekly') {
        const oDate = new Date(o.date);
        return (now.getTime() - oDate.getTime()) <= 7 * msInDay; // last 7 days
      } else if (period === 'monthly') {
        const oDate = new Date(o.date);
        return (now.getTime() - oDate.getTime()) <= 30 * msInDay; // last 30 days
      }
      return true;
    });
  }, [orders, period]);

  const filteredExpenses = useMemo(() => {
    if (period === 'all') return expenses;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const msInDay = 24 * 60 * 60 * 1000;
    
    return expenses.filter(e => {
      if (period === 'daily') {
        return e.date.startsWith(todayStr); // daily = today
      } else if (period === 'weekly') {
        const eDate = new Date(e.date);
        return (now.getTime() - eDate.getTime()) <= 7 * msInDay; // last 7 days
      } else if (period === 'monthly') {
        const eDate = new Date(e.date);
        return (now.getTime() - eDate.getTime()) <= 30 * msInDay; // last 30 days
      }
      return true;
    });
  }, [expenses, period]);

  // Compute basic stats
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0);
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const netProfit = totalRevenue / 1.09;
    const totalTax = totalRevenue - netProfit;
    const realProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      netProfit,
      totalTax,
      totalExpenses,
      realProfit,
      completedOrders,
      averageOrderValue,
      cancelledOrders: filteredOrders.filter(o => o.status === 'cancelled').length
    };
  }, [filteredOrders, filteredExpenses]);

  // Generate chart data by day
  const chartData = useMemo(() => {
    // Group orders by localized date string
    const map = new Map<string, number>();
    filteredOrders.forEach(o => {
      if (o.status !== 'completed') return;
      const d = new Date(o.date);
      // Format as simple locale date string (Persian)
      const dateStr = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d);
      map.set(dateStr, (map.get(dateStr) || 0) + o.total);
    });

    // Convert map to array and sort 
    // (mock relies on generation order which shouldn't be strictly sorted by date text naturally, but it'll do for visual)
    const arr = Array.from(map.entries()).map(([date, revenue]) => ({ date, revenue }));
    return arr.reverse(); // simple mock visual fix since mock generates older dates later
  }, [filteredOrders]);

  // Generate profit & loss data (daily and monthly)
  const plData = useMemo(() => {
    const dailyMap = new Map<string, { label: string, sortKey: string, totalRevenue: number, totalCogs: number, totalOpEx: number }>();
    const monthlyMap = new Map<string, { label: string, sortKey: string, totalRevenue: number, totalCogs: number, totalOpEx: number }>();

    orders.forEach(o => {
      if (o.status !== 'completed') return;
      
      const d = new Date(o.date);
      const dayKey = d.toISOString().split('T')[0];
      const monthKey = dayKey.slice(0, 7); // YYYY-MM
      
      const dayLabel = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d);
      const monthLabel = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(d);
      
      if (!dailyMap.has(dayKey)) dailyMap.set(dayKey, { label: dayLabel, sortKey: dayKey, totalRevenue: 0, totalCogs: 0, totalOpEx: 0 });
      dailyMap.get(dayKey)!.totalRevenue += o.total;

      if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, { label: monthLabel, sortKey: monthKey, totalRevenue: 0, totalCogs: 0, totalOpEx: 0 });
      monthlyMap.get(monthKey)!.totalRevenue += o.total;
    });

    expenses.forEach(e => {
       const d = new Date(e.date);
       const dayKey = d.toISOString().split('T')[0];
       const monthKey = dayKey.slice(0, 7);
       const dayLabel = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d);
       const monthLabel = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(d);

       if (!dailyMap.has(dayKey)) dailyMap.set(dayKey, { label: dayLabel, sortKey: dayKey, totalRevenue: 0, totalCogs: 0, totalOpEx: 0 });
       if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, { label: monthLabel, sortKey: monthKey, totalRevenue: 0, totalCogs: 0, totalOpEx: 0 });

       if (e.category === 'supplies' || e.category === 'waste') {
         dailyMap.get(dayKey)!.totalCogs += e.amount;
         monthlyMap.get(monthKey)!.totalCogs += e.amount;
       } else {
         dailyMap.get(dayKey)!.totalOpEx += e.amount;
         monthlyMap.get(monthKey)!.totalOpEx += e.amount;
       }
    });

    const formatData = (map: Map<string, any>) => Array.from(map.values())
      .sort((a,b) => a.sortKey.localeCompare(b.sortKey))
      .map(d => ({
        label: d.label,
        totalRevenue: d.totalRevenue,
        totalCogs: d.totalCogs,
        totalOpEx: d.totalOpEx,
        grossProfit: d.totalRevenue - d.totalCogs,
        netProfit: d.totalRevenue - d.totalCogs - d.totalOpEx
      }));

    return {
      daily: formatData(dailyMap),
      monthly: formatData(monthlyMap)
    };

  }, [orders, expenses]);

  const StatCard = ({ title, value, icon, type }: { title: string, value: string, icon: React.ReactNode, type: 'primary' | 'success' | 'warning' | 'danger' }) => {
    const colors = {
      primary: 'bg-blue-50 text-blue-600',
      success: 'bg-emerald-50 text-emerald-600',
      warning: 'bg-amber-50 text-amber-600',
      danger: 'bg-red-50 text-red-600'
    };

    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-slate-500 font-medium mb-2">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", colors[type])}>
          {icon}
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 text-white rounded-xl p-3 shadow-xl border border-zinc-800 text-sm dir-rtl text-right">
          <p className="font-medium text-slate-300 mb-1">{label}</p>
          <p className="font-bold text-amber-400">{formatPrice(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const exportToCSV = () => {
    const headers = ['شماره سفارش', 'تاریخ', 'مبلغ (تومان)', 'وضعیت', 'روش پرداخت'];
    
    const rows = filteredOrders.map(order => [
      order.id,
      new Date(order.date).toLocaleString('fa-IR'),
      order.total,
      order.status === 'completed' ? 'تکمیل شده' : order.status === 'cancelled' ? 'لغو شده' : 'در انتظار',
      order.paymentMethod === 'card' ? 'کارت‌خوان' : 'نقدی'
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(',')]
        .concat(rows.map(row => row.join(',')))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial-report-${new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportWeeklyCSV = () => {
    const headers = ['هفته', 'درآمد (تومان)', 'هزینه (تومان)', 'سود ناخالص (تومان)'];
    
    const rows = weeklyReports.map(report => [
      report.weekLabel,
      report.income,
      report.expense,
      report.profit
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(',')]
        .concat(rows.map(row => row.join(',')))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `weekly-reports.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute completed orders for printing
  const completedFilteredOrders = filteredOrders.filter(o => o.status === 'completed');

  // Compute Top and Bottom selling items trends
  const itemTrends = useMemo(() => {
    // Determine cutoff date for all-time vs limited depending on trendPeriod
    const now = new Date();
    const periodOrders = orders.filter(o => {
      if (o.status !== 'completed') return false;
      const d = new Date(o.date);
      if (trendPeriod === 'daily') {
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 30; // last 30 days
      }
      if (trendPeriod === 'weekly') {
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 90; // last 12 weeks
      }
      return true; // monthly: all time
    });

    const totalItemCounts = new Map<string, number>();
    periodOrders.forEach(o => {
      o.items.forEach(item => {
        totalItemCounts.set(item.name, (totalItemCounts.get(item.name) || 0) + item.quantity);
      });
    });

    if (totalItemCounts.size === 0) return { topItems: [], bottomItems: [], trendData: [] };

    const sortedItems = Array.from(totalItemCounts.entries()).sort((a, b) => b[1] - a[1]);
    const topItems = sortedItems.slice(0, 3).map(i => i[0]);
    const bottomItems = sortedItems.length > 5 ? sortedItems.slice(sortedItems.length - 3).map(i => i[0]) : sortedItems.slice(3).map(i => i[0]);
    const trackItems = [...new Set([...topItems, ...bottomItems])];

    const dateMap = new Map<string, any>();
    
    periodOrders.forEach(o => {
      const d = new Date(o.date);
      let dateStr = '';
      
      if (trendPeriod === 'daily') {
        dateStr = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d);
      } else if (trendPeriod === 'weekly') {
        // Find start of week (Saturday in Iran)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 6 ? 0 : -1); // approximate
        const startOfWeek = new Date(d.setDate(diff));
        dateStr = 'هفته ' + new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(startOfWeek);
      } else {
        dateStr = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(d);
      }
      
      if (!dateMap.has(dateStr)) {
        const entry: any = { date: dateStr, timestamp: d.getTime() };
        trackItems.forEach(i => entry[i] = 0);
        dateMap.set(dateStr, entry);
      }
      
      const entry = dateMap.get(dateStr);
      o.items.forEach(item => {
        if (trackItems.includes(item.name)) {
          entry[item.name] += item.quantity;
        }
      });
    });

    const trendArray = Array.from(dateMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    return { 
      topItems, 
      bottomItems, 
      trendData: trendArray 
    };
  }, [orders, trendPeriod]);

  // Compare current season (last 90 days) with previous season (91-180 days ago)
  const seasonComparisonData = useMemo(() => {
    const now = new Date();
    const currentSeasonStart = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    const previousSeasonStart = new Date(now.getTime() - 180 * 24 * 3600 * 1000);

    const weeksData = Array.from({ length: 12 }, (_, i) => ({
      name: `هفته ${i + 1}`,
      current: 0,
      previous: 0
    }));

    orders.forEach(o => {
      if (o.status !== 'completed') return;
      
      const d = new Date(o.date);
      if (d >= currentSeasonStart && d <= now) {
        // Current season
        const daysDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
        // invert so week 1 is oldest in the season (90 days ago)
        const weekIndex = Math.floor((89 - daysDiff) / 7.5);
        if (weekIndex >= 0 && weekIndex < 12) {
          weeksData[weekIndex].current += o.total;
        }
      } else if (d >= previousSeasonStart && d < currentSeasonStart) {
        // Previous season
        const daysDiff = Math.floor((currentSeasonStart.getTime() - d.getTime()) / (1000 * 3600 * 24));
        const weekIndex = Math.floor((89 - daysDiff) / 7.5);
        if (weekIndex >= 0 && weekIndex < 12) {
          weeksData[weekIndex].previous += o.total;
        }
      }
    });

    return weeksData;
  }, [orders]);

  // Tax and Seasonal Report Calculation
  const seasonalTaxReports = useMemo(() => {
    const seasonsMap: Record<string, { income: number; expense: number }> = {};

    const getQuarterString = (dateString: string) => {
      const date = new Date(dateString);
      const parts = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'numeric' }).formatToParts(date);
      let year = '';
      let month = 0;
      for (const part of parts) {
        if (part.type === 'year') year = part.value;
        if (part.type === 'month') month = parseInt(part.value, 10);
      }
      
      let season = '';
      if (month >= 1 && month <= 3) season = 'بهار';
      else if (month >= 4 && month <= 6) season = 'تابستان';
      else if (month >= 7 && month <= 9) season = 'پاییز';
      else season = 'زمستان';

      return `${season} ${year}`;
    };

    // Calculate Incomes
    orders.forEach(o => {
      if (o.status !== 'completed') return;
      const quarter = getQuarterString(o.date);
      if (!seasonsMap[quarter]) seasonsMap[quarter] = { income: 0, expense: 0 };
      seasonsMap[quarter].income += o.total;
    });

    // Calculate Expenses
    expenses.forEach(e => {
      const quarter = getQuarterString(e.date);
      if (!seasonsMap[quarter]) seasonsMap[quarter] = { income: 0, expense: 0 };
      seasonsMap[quarter].expense += e.amount;
    });

    return Object.entries(seasonsMap).map(([season, data]) => {
      const grossProfit = data.income - data.expense;
      const taxAmount = grossProfit > 0 ? grossProfit * 0.25 : 0; // 25% tax on net profit
      const netProfit = grossProfit - taxAmount;

      return {
        season,
        income: data.income,
        expense: data.expense,
        grossProfit,
        taxAmount,
        netProfit
      };
    });
  }, [orders, expenses]);

  const weeklyReports = useMemo(() => {
    // Group orders and expenses by week. Week starts on Saturday (Shamsi style) or just group by 7 day intervals
    // We can group by ISO week and year. To keep it simple, we use the start of the week for display.
    const weeksMap: Record<string, { income: number; expense: number; StartDate: Date }> = {};
    
    // helper to get the week string
    const getWeekString = (dateString: string) => {
      const d = new Date(dateString);
      // Adjust to start on Saturday for Iranian week (Saturday is 6 in JS standard, let's just use regular locale string for the start of week)
      // JS getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
      const dayOffset = (d.getDay() + 1) % 7; // So Saturday is 0
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - dayOffset);
      startOfWeek.setHours(0,0,0,0);
      return startOfWeek.getTime().toString();
    };

    orders.forEach(o => {
      if (o.status !== 'completed') return;
      const weekKey = getWeekString(o.date);
      if (!weeksMap[weekKey]) weeksMap[weekKey] = { income: 0, expense: 0, StartDate: new Date(Number(weekKey)) };
      weeksMap[weekKey].income += o.total;
    });

    expenses.forEach(e => {
      const weekKey = getWeekString(e.date);
      if (!weeksMap[weekKey]) weeksMap[weekKey] = { income: 0, expense: 0, StartDate: new Date(Number(weekKey)) };
      weeksMap[weekKey].expense += e.amount;
    });

    const arr = Object.values(weeksMap).map(data => {
      const start = data.StartDate;
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      return {
        weekLabel: `${new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(start)} تا ${new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(end)}`,
        income: data.income,
        expense: data.expense,
        profit: data.income - data.expense,
        timestamp: start.getTime()
      };
    });

    return arr.sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, expenses]);

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-8 print:overflow-visible">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">حسابداری و گزارشات</h2>
          <p className="text-slate-500 mt-1">بررسی وضعیت مالی، فروش و داشبورد مدیریتی</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shadow-inner shrink-0 leading-none">
            <button 
              onClick={() => setPeriod('daily')} 
              className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-colors", period === 'daily' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >روزانه</button>
            <button 
              onClick={() => setPeriod('weekly')} 
              className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-colors", period === 'weekly' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >هفتگی</button>
            <button 
              onClick={() => setPeriod('monthly')} 
              className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-colors", period === 'monthly' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >ماهانه</button>
            <button 
              onClick={() => setPeriod('all')} 
              className={cn("px-4 py-2 text-sm font-bold rounded-lg transition-colors", period === 'all' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
            >همه</button>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl font-medium hover:bg-amber-100 transition-colors shadow-sm leading-none"
            >
              <Printer size={18} /> چاپ گزارش (PDF)
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm leading-none"
            >
              <Download size={18} /> خروجی CSV
            </button>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl w-max mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'overview' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          )}
        >
          گزارش جامع
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'expenses' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          )}
        >
          مدیریت هزینه‌ها
        </button>
        <button
          onClick={() => setActiveTab('cheques')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'cheques' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          )}
        >
          مدیریت چک‌ها
        </button>
        <button
          onClick={() => setActiveTab('taxes')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'taxes' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          )}
        >
          گزارش مالیاتی فصلی
        </button>
        <button
          onClick={() => setActiveTab('weekly-reports')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'weekly-reports' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          )}
        >
          گزارش‌های هفتگی
        </button>
        <button
          onClick={() => setActiveTab('profit-loss')}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'profit-loss' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          )}
        >
          سود و زیان (P&L)
        </button>
      </div>

      {activeTab === 'overview' ? (
      <div className="print:hidden space-y-6">
        {/* Financial Details */}
        <h3 className="font-bold text-lg text-slate-800 -mb-2">خلاصه مالی</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            title="فروش کل" 
            value={formatPrice(stats.totalRevenue)} 
            type="primary"
            icon={<Calculator size={28} />} 
          />
          <StatCard 
            title="مجموع هزینه‌ها" 
            value={formatPrice(stats.totalExpenses)} 
            type="danger"
            icon={<TrendingDown size={28} />} 
          />
          <StatCard 
            title="سود ناخالص (پس از کسر هزینه‌ها)" 
            value={formatPrice(stats.realProfit)} 
            type="success"
            icon={<Wallet size={28} />} 
          />
          <StatCard 
            title="مالیات بر ارزش افزوده" 
            value={formatPrice(stats.totalTax)} 
            type="danger"
            icon={<Receipt size={28} />} 
          />
        </div>

        {/* General Stats */}
        <h3 className="font-bold text-lg text-slate-800 -mb-2">آمار سفارشات</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="تعداد سفارشات" 
            value={`${formatNumber(stats.completedOrders)} سفارش`} 
            type="primary"
            icon={<ShoppingCart size={28} />} 
          />
          <StatCard 
            title="میانگین ارزش سفارش" 
            value={formatPrice(stats.averageOrderValue)} 
            type="warning"
            icon={<TrendingUp size={28} />} 
          />
          <StatCard 
            title="سفارشات لغو شده" 
            value={`${formatNumber(stats.cancelledOrders)} سفارش`} 
            type="danger"
            icon={<Ban size={28} />} 
          />
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="mb-6">
              <h3 className="font-bold text-lg text-slate-800">روند فروش (۷ روز اخیر)</h3>
            </div>
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tickMargin={10}
                    tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Vazirmatn' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => Math.floor(val / 1000) + 'k'}
                    tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Vazirmatn' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">آخرین تراکنش‌ها</h3>
              <button className="text-sm font-medium text-amber-600 hover:text-amber-700">مشاهده همه</button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {orders.slice(0, 8).map(order => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <Wallet size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{order.id}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.date))}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-slate-800">{formatPrice(order.total)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{order.paymentMethod === 'card' ? 'کارت‌خوان' : 'نقدی'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart Area */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="mb-6">
              <h3 className="font-bold text-lg text-slate-800">تحلیل روزانه درآمد (نمودار میله‌ای)</h3>
            </div>
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tickMargin={10}
                    tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Vazirmatn' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => Math.floor(val / 1000) + 'k'}
                    tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Vazirmatn' }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                  <Bar 
                    dataKey="revenue" 
                    fill="#3b82f6" 
                    radius={[6, 6, 0, 0]} 
                    barSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Advanced Item Trends Analysis */}
        {itemTrends.trendData.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 print:hidden mb-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">تحلیل اقلام پرفروش و کم‌فروش</h3>
                <p className="text-sm text-slate-500 mt-1">مشاهده روند فروش محصولات برتر و ضعیف در بازه‌های زمانی مختلف</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setTrendPeriod('daily')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                    trendPeriod === 'daily' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                  )}
                >
                  روزانه
                </button>
                <button
                  onClick={() => setTrendPeriod('weekly')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                    trendPeriod === 'weekly' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                  )}
                >
                  هفتگی
                </button>
                <button
                  onClick={() => setTrendPeriod('monthly')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                    trendPeriod === 'monthly' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                  )}
                >
                  ماهانه
                </button>
              </div>
            </div>
            
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={itemTrends.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tickMargin={10}
                    tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Vazirmatn' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Vazirmatn' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', direction: 'rtl', textAlign: 'right' }} 
                    itemStyle={{ color: '#fff', fontSize: '0.875rem' }}
                    labelStyle={{ color: '#cbd5e1', marginBottom: '0.25rem' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'Vazirmatn', fontSize: '13px', paddingTop: '10px' }} />
                  
                  {itemTrends.topItems.map((item, index) => {
                    const colors = ['#22c55e', '#3b82f6', '#8b5cf6'];
                    return <Line key={`top-${item}`} type="monotone" name={`${item} (پرفروش)`} dataKey={item} stroke={colors[index] || '#22c55e'} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />;
                  })}
                  
                  {itemTrends.bottomItems.map((item, index) => {
                    const colors = ['#ef4444', '#f97316', '#f43f5e'];
                    return <Line key={`bottom-${item}`} type="monotone" name={`${item} (کم‌فروش)`} dataKey={item} stroke={colors[index] || '#ef4444'} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} activeDot={{ r: 5 }} />;
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Seasonal Comparison Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 print:hidden mb-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800">مقایسه فروش فصل جاری و گذشته</h3>
              <p className="text-sm text-slate-500 mt-1">مقایسه روند درآمد (تومان) در ۱۲ هفته اخیر نسبت به ۱۲ هفته پیش از آن</p>
            </div>
          </div>
          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seasonComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Vazirmatn' }} />
                <YAxis tickFormatter={(val) => `${(val / 1000).toLocaleString()}`} tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Vazirmatn' }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatPrice(value), name === 'current' ? 'فصل جاری' : 'فصل گذشته']}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '8px', textAlign: 'right', fontFamily: 'Vazirmatn' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontFamily: 'Vazirmatn' }}
                />
                <Legend formatter={(value) => <span className="text-slate-700 font-medium ml-2" style={{ fontFamily: 'Vazirmatn' }}>{value === 'current' ? 'فصل جاری' : 'فصل گذشته'}</span>} />
                <Line type="monotone" dataKey="current" name="current" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="previous" name="previous" stroke="#cbd5e1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
      ) : activeTab === 'expenses' ? (
      <div className="print:hidden space-y-6">
        <h3 className="font-bold text-lg text-slate-800 -mb-2">ثبت هزینه جدید</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">عنوان هزینه</label>
              <input 
                type="text" 
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                placeholder="مثال: خرید مرغ و گوشت"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">مبلغ (تومان)</label>
              <input 
                type="text" 
                value={expenseAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/D/g, '');
                  setExpenseAmount(val ? parseInt(val).toLocaleString() : '');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold tracking-wider text-left"
                placeholder="0"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">دسته‌بندی</label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              >
                <option value="supplies">مواد اولیه</option>
                <option value="salary">حقوق پرسنل</option>
                <option value="rent">اجاره مکان</option>
                <option value="waste">ضایعات مواد اولیه</option>
                <option value="other">سایر هزینه‌ها</option>
              </select>
            </div>
            <div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                ثبت هزینه
              </button>
            </div>
          </form>
        </div>

        <h3 className="font-bold text-lg text-slate-800 -mb-2">فهرست هزینه‌های ثبت شده</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-r-xl border-b border-slate-100">عنوان</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">دسته‌بندی</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">مبلغ (تومان)</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-l-xl border-b border-slate-100 w-1/4">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      هیچ هزینه‌ای در این بازه زمانی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(expense => (
                    <tr key={expense.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-slate-800 font-medium">
                        {expense.title}
                      </td>
                      <td className="py-4 px-4">
                        {expense.category === 'supplies' && <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"><ShoppingCart size={14} />مواد اولیه</span>}
                        {expense.category === 'salary' && <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"><UserIcon size={14} />حقوق پرسنل</span>}
                        {expense.category === 'rent' && <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"><Wallet size={14} />اجاره</span>}
                        {expense.category === 'waste' && <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"><Trash2 size={14} />ضایعات</span>}
                        {expense.category === 'other' && <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5"><CircleDollarSign size={14} />سایر</span>}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {formatPrice(expense.amount)}
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        {new Intl.DateTimeFormat('fa-IR', { 
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        }).format(new Date(expense.date))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      ) : activeTab === 'cheques' ? (
      <div className="print:hidden space-y-6">
        <h3 className="font-bold text-lg text-slate-800 -mb-2">ثبت چک جدید</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6">
          <form onSubmit={handleAddCheque} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نوع چک</label>
              <select
                value={chequeType}
                onChange={(e) => setChequeType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              >
                <option value="received">دریافتی (مشتری)</option>
                <option value="paid">پرداختی (تامین‌کننده)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">مبلغ (تومان)</label>
              <input 
                type="text" 
                value={chequeAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setChequeAmount(val ? parseInt(val).toLocaleString() : '');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold tracking-wider text-left"
                placeholder="0"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تاریخ سررسید</label>
              <input 
                type="date"
                value={chequeDueDate}
                onChange={(e) => setChequeDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-left"
                dir="ltr"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">نام بانک</label>
              <input 
                type="text"
                value={chequeBank}
                onChange={(e) => setChequeBank(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                placeholder="مثال: ملی، ملت"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">شماره صیادی / فیزیکی</label>
              <input 
                type="text"
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-left"
                dir="ltr"
                placeholder="---"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">بابت / طرف حساب</label>
              <input 
                type="text"
                value={chequeDescription}
                onChange={(e) => setChequeDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                placeholder="توضیحات کوتاه..."
              />
            </div>
            <div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                ثبت چک
              </button>
            </div>
          </form>
        </div>

        <h3 className="font-bold text-lg text-slate-800 -mb-2">دفترچه چک‌ها</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-r-xl border-b border-slate-100">نوع / بابت</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">مبلغ (تومان)</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100 w-1/4">تاریخ سررسید</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">گزارش بانک</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-l-xl border-b border-slate-100 text-center">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {cheques.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      هیچ چکی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  // Sort cheques by date closest to due
                  [...cheques].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(cheque => {
                    const daysToDue = Math.ceil((new Date(cheque.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                    return (
                    <tr key={cheque.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-bold w-max inline-block",
                            cheque.type === 'received' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {cheque.type === 'received' ? 'دریافتی' : 'پرداختی'}
                          </span>
                          <span className="text-sm font-medium text-slate-800">{cheque.description || 'بدون توضیحات'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {formatPrice(cheque.amount)}
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-slate-700 font-mono text-xs">{new Intl.DateTimeFormat('fa-IR', { 
                            year: 'numeric', month: 'short', day: 'numeric' 
                          }).format(new Date(cheque.dueDate))}</span>
                          {cheque.status === 'pending' && (
                            <span className={cn(
                              "text-[11px] font-bold",
                              daysToDue < 0 ? "text-red-500" : daysToDue <= 3 ? "text-amber-500" : "text-slate-500"
                            )}>
                              {daysToDue < 0 ? `(${Math.abs(daysToDue)} روز گذشته)` : daysToDue === 0 ? "(امروز)" : `(${daysToDue} روز تا سررسید)`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        <div className="flex flex-col">
                          <span>{cheque.bankName}</span>
                          <span className="text-slate-400 font-mono text-xs mt-1">{cheque.chequeNumber}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {cheque.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                             <button
                               onClick={() => onUpdateChequeStatus && onUpdateChequeStatus(cheque.id, 'cleared')}
                               className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 p-2 rounded-lg transition-colors"
                               title="ثبت پاس شده"
                             >
                                <CheckCircle size={16} />
                             </button>
                             <button
                               onClick={() => onUpdateChequeStatus && onUpdateChequeStatus(cheque.id, 'bounced')}
                               className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                               title="ثبت برگشت خورده"
                             >
                                <Ban size={16} />
                             </button>
                          </div>
                        ) : cheque.status === 'cleared' ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                            <CheckCircle size={14} /> پاس شده
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold">
                            <AlertCircle size={14} /> برگشت خورده
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                 })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      ) : activeTab === 'taxes' ? (
      <div className="print:hidden space-y-6">
        <h3 className="font-bold text-lg text-slate-800 -mb-2">گزارش مالیاتی فصلی</h3>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-r-xl border-b border-slate-100">فصل مالیاتی</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">کل درآمد</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">کل هزینه</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">سود ناخالص</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">مالیات برآورد شده (۲۵٪ سود)</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-l-xl border-b border-slate-100">سود خالص</th>
                </tr>
              </thead>
              <tbody>
                {seasonalTaxReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      داده‌ای برای نمایش گزارش مالیاتی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  seasonalTaxReports.map(report => (
                    <tr key={report.season} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm">
                      <td className="py-4 px-4 font-bold text-slate-800">{report.season}</td>
                      <td className="py-4 px-4 font-medium text-emerald-600">{formatPrice(report.income)} تومان</td>
                      <td className="py-4 px-4 font-medium text-rose-600">{formatPrice(report.expense)} تومان</td>
                      <td className="py-4 px-4 font-bold text-slate-700">{formatPrice(report.grossProfit)} تومان</td>
                      <td className="py-4 px-4 font-bold text-amber-600">{formatPrice(report.taxAmount)} تومان</td>
                      <td className="py-4 px-4 font-black text-indigo-700">{formatPrice(report.netProfit)} تومان</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Tax calculation logic info */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mt-4 text-indigo-800 text-sm leading-relaxed">
          <strong>یادداشت مالیاتی:</strong> این گزارش با فرض کسر مقادیر <b>هزینه ثبت شده</b> از <b>درآمدهای تکمیل شده</b> برای هر فصل، اقدام به محاسبه <i>سود ناخالص</i> می‌کند و ۲۵٪ آن را به عنوان مالیات برآورد کرده (ویژه اشخاص حقوقی)، و در نهایت <i>سود خالص پس از کسر مالیات</i> را نمایش می‌دهد.
        </div>
      </div>
      ) : activeTab === 'weekly-reports' ? (
      <div className="space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <h3 className="font-bold text-lg text-slate-800 -mb-2">گزارش‌های دوره‌ای هفتگی</h3>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl font-medium hover:bg-amber-100 transition-colors shadow-sm leading-none"
            >
              <Printer size={18} /> چاپ (PDF)
            </button>
            <button
              onClick={exportWeeklyCSV}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm leading-none"
            >
              <Download size={18} /> خروجی CSV
            </button>
          </div>
        </div>
        
        {/* Weekly Reports Print Header */}
        <div className="hidden print:block text-center mb-8 border-b-2 border-slate-200 pb-6">
          <h1 className="text-3xl font-black text-slate-800 mb-2">گزارش هفتگی دوره‌ای</h1>
          <p className="text-slate-600 font-bold text-lg">
            تاریخ خروجی: {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
          </p>
        </div>

        <div className="bg-white rounded-3xl print:rounded-none p-6 print:p-0 shadow-sm print:shadow-none border border-slate-100 print:border-none overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse print:border print:border-slate-300">
              <thead>
                <tr className="bg-slate-50 print:bg-slate-100">
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-r-xl print:rounded-none border-b border-slate-100 print:border-slate-300 print:border">بازه زمانی (هفته)</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100 print:border-slate-300 print:border">کل درآمد (تومان)</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100 print:border-slate-300 print:border">کل هزینه (تومان)</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-l-xl print:rounded-none border-b border-slate-100 print:border-slate-300 print:border">سود ناخالص (تومان)</th>
                </tr>
              </thead>
              <tbody>
                {weeklyReports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 print:border print:border-slate-300">
                      داده‌ای برای نمایش گزارش هفتگی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  weeklyReports.map(report => (
                    <tr key={report.timestamp} className="border-b border-slate-50 print:border-slate-300 hover:bg-slate-50/50 transition-colors text-sm">
                      <td className="py-4 px-4 font-bold text-slate-800 dir-rtl whitespace-nowrap print:border print:border-slate-300">{report.weekLabel}</td>
                      <td className="py-4 px-4 font-medium text-emerald-600 print:text-black print:border print:border-slate-300">{formatPrice(report.income)}</td>
                      <td className="py-4 px-4 font-medium text-rose-600 print:text-black print:border print:border-slate-300">{formatPrice(report.expense)}</td>
                      <td className="py-4 px-4 font-bold text-indigo-700 print:text-black print:border print:border-slate-300">{formatPrice(report.profit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      ) : activeTab === 'profit-loss' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 print:hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">گزارش سود و زیان (P&L)</h2>
              <p className="text-sm text-slate-500 mt-1">مشاهده روند فروش، بهای تمام شده، هزینه‌ها و سود خالص</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPlPeriod('monthly')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  plPeriod === 'monthly' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                )}
              >
                ماهانه
              </button>
              <button
                onClick={() => setPlPeriod('daily')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  plPeriod === 'daily' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                )}
              >
                روزانه
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plData[plPeriod]} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} angle={plPeriod === 'daily' ? -45 : 0} textAnchor={plPeriod === 'daily' ? "end" : "middle"} dx={plPeriod === 'daily' ? -10 : 0} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(value) => value.toLocaleString('fa-IR')} width={80} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    cursor={{fill: '#F8FAFC'}}
                    formatter={(value: number) => [`${formatPrice(value)}`, '']}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="grossProfit" name="سود ناخالص" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netProfit" name="سود خالص" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="py-4 px-4 font-semibold text-slate-600 rounded-tr-xl border-b border-slate-100">بازه زمانی</th>
                    <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">درآمد کل</th>
                    <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">بهای تمام شده (مواد و ضایعات)</th>
                    <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">سود ناخالص</th>
                    <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">سایر هزینه‌ها (عملیاتی)</th>
                    <th className="py-4 px-4 font-semibold text-slate-600 rounded-tl-xl border-b border-slate-100">سود خالص</th>
                  </tr>
                </thead>
                <tbody>
                  {plData[plPeriod].map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-sm">
                      <td className="py-4 px-4 font-bold text-slate-800">{row.label}</td>
                      <td className="py-4 px-4 font-medium text-slate-700">{formatPrice(row.totalRevenue)}</td>
                      <td className="py-4 px-4 font-medium text-rose-500">{formatPrice(row.totalCogs)}</td>
                      <td className="py-4 px-4 font-bold text-emerald-600">{formatPrice(row.grossProfit)}</td>
                      <td className="py-4 px-4 font-medium text-amber-500">{formatPrice(row.totalOpEx)}</td>
                      <td className="py-4 px-4 font-bold text-blue-600">{formatPrice(row.netProfit)}</td>
                    </tr>
                  ))}
                  {plData[plPeriod].length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        داده‌ای برای نمایش یافت نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* Print View for Daily Report - Hidden by default, visible on print */}
      {activeTab !== 'weekly-reports' && (
      <div className="hidden print:block w-full text-black" style={{ margin: 0, padding: '1rem' }}>
        <div className="text-center mb-8 border-b-2 border-slate-200 pb-6">
          {restaurantInfo?.logo ? (
             <img src={restaurantInfo.logo} alt={restaurantInfo.name} className="h-20 mx-auto mb-4" />
          ) : null}
          <h1 className="text-3xl font-black text-slate-800 mb-2">گزارش فروش {restaurantInfo?.name || 'رستوران'}</h1>
          <p className="text-slate-600 font-bold text-lg">
            نوع گزارش: {
              period === 'daily' ? 'روزانه' : 
              period === 'weekly' ? 'هفتگی (۷ روز اخیر)' : 
              period === 'monthly' ? 'ماهانه (۳۰ روز اخیر)' : 'گزارش کل'
            } | تاریخ ثبت: {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
          </p>
          {restaurantInfo?.address && <p className="text-sm text-slate-500 mt-2">{restaurantInfo.address}</p>}
          {restaurantInfo?.phone && <p className="text-sm text-slate-500">تلفن: {restaurantInfo.phone}</p>}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="border border-slate-200 p-4 rounded-xl">
            <p className="text-slate-500 font-medium mb-1">جمع کل فروش</p>
            <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
          </div>
          <div className="border border-slate-200 p-4 rounded-xl">
            <p className="text-slate-500 font-medium mb-1">تعداد سفارشات تکمیل شده</p>
            <p className="text-2xl font-bold">{formatNumber(stats.completedOrders)} سفارش</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">فهرست سفارشات</h2>
        
        <table className="w-full text-right border-collapse text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="py-3 px-4 border border-slate-200 font-bold">شماره سفارش</th>
              <th className="py-3 px-4 border border-slate-200 font-bold">زمان</th>
              <th className="py-3 px-4 border border-slate-200 font-bold">مبلغ (تومان)</th>
              <th className="py-3 px-4 border border-slate-200 font-bold">روش پرداخت</th>
            </tr>
          </thead>
          <tbody>
            {completedFilteredOrders.map(order => (
              <tr key={order.id} className="border-b border-slate-200">
                <td className="py-3 px-4 border border-slate-200 font-medium">{order.id}</td>
                <td className="py-3 px-4 border border-slate-200">
                  {new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.date))}
                </td>
                <td className="py-3 px-4 border border-slate-200 font-bold">{formatPrice(order.total)}</td>
                <td className="py-3 px-4 border border-slate-200">{order.paymentMethod === 'card' ? 'کارت خوان' : 'نقدی'}</td>
              </tr>
            ))}
            {completedFilteredOrders.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500 border border-slate-200">
                  هیچ سفارشی در این بازه زمانی ثبت نشده است.
                </td>
              </tr>
            )}
          </tbody>
          {completedFilteredOrders.length > 0 && (
            <tfoot className="bg-slate-50 font-bold text-base">
              <tr>
                <td colSpan={2} className="py-3 px-4 border border-slate-200 text-left">جمع کل:</td>
                <td colSpan={2} className="py-3 px-4 border border-slate-200 text-amber-600">{formatPrice(stats.totalRevenue)}</td>
              </tr>
            </tfoot>
          )}
        </table>
        
        <div className="mt-12 text-center text-sm text-slate-500 print-footer">
          <p>این سند به صورت خودکار توسط سیستم صادر شده است.</p>
        </div>
      </div>
      )}
    </div>
  );
}
