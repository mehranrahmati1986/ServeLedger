import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgePercent,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Info,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { Expense, Order, RestaurantInfo } from '../types';
import { cn, formatNumber, formatPrice } from '../lib/utils';

type AuditYear = '1404' | '1405';
type AuditTab = 'summary' | 'vat' | 'payroll' | 'risks' | 'rules';

type PayrollBracket = {
  from: number;
  to: number | null;
  rate: number;
};

type TaxRuleSet = {
  label: string;
  vatRate: number;
  incomeTaxRate: number;
  monthlySalaryExemption: number;
  payrollBrackets: PayrollBracket[];
  note: string;
};

const MILLION = 1_000_000;

const TAX_RULES: Record<AuditYear, TaxRuleSet> = {
  '1404': {
    label: 'سال مالی ۱۴۰۴',
    vatRate: 10,
    incomeTaxRate: 25,
    monthlySalaryExemption: 24 * MILLION,
    payrollBrackets: [
      { from: 0, to: 24 * MILLION, rate: 0 },
      { from: 24 * MILLION, to: 30 * MILLION, rate: 10 },
      { from: 30 * MILLION, to: 38 * MILLION, rate: 15 },
      { from: 38 * MILLION, to: 50 * MILLION, rate: 20 },
      { from: 50 * MILLION, to: 66_700_000, rate: 25 },
      { from: 66_700_000, to: null, rate: 30 }
    ],
    note: 'در ۱۴۰۴ سقف معافیت حقوق ماهانه ۲۴ میلیون تومان و نرخ عمومی ارزش افزوده برای اغلب کالاها و خدمات ۱۰٪ در نظر گرفته شده است.'
  },
  '1405': {
    label: 'سال مالی ۱۴۰۵',
    vatRate: 10,
    incomeTaxRate: 25,
    monthlySalaryExemption: 40 * MILLION,
    payrollBrackets: [
      { from: 0, to: 40 * MILLION, rate: 0 },
      { from: 40 * MILLION, to: 80 * MILLION, rate: 10 },
      { from: 80 * MILLION, to: 100 * MILLION, rate: 15 },
      { from: 100 * MILLION, to: 120 * MILLION, rate: 20 },
      { from: 120 * MILLION, to: 140 * MILLION, rate: 25 },
      { from: 140 * MILLION, to: null, rate: 30 }
    ],
    note: 'در ۱۴۰۵ سقف معافیت حقوق ماهانه ۴۰ میلیون تومان لحاظ شده و طبقات حقوق به صورت پلکانی قابل کنترل است.'
  }
};

const formatPlainNumber = (value: number) => Number.isFinite(value) ? Math.round(value).toString() : '0';

const parseMoney = (value: string) => {
  const normalized = value.replace(/[^\d]/g, '');
  return normalized ? Number(normalized) : 0;
};

const getPersianYear = (date: string) => {
  const value = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric' }).format(new Date(date));
  return value.replace(/[^\d]/g, '');
};

const getPersianQuarter = (date: string) => {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', { month: 'numeric' }).formatToParts(new Date(date));
  const month = Number(parts.find(part => part.type === 'month')?.value || 1);

  if (month <= 3) return 'بهار';
  if (month <= 6) return 'تابستان';
  if (month <= 9) return 'پاییز';
  return 'زمستان';
};

const calculateProgressiveTax = (monthlyIncome: number, brackets: PayrollBracket[]) => {
  return brackets.reduce((sum, bracket) => {
    const upper = bracket.to ?? monthlyIncome;
    const taxableSlice = Math.max(0, Math.min(monthlyIncome, upper) - bracket.from);
    return sum + taxableSlice * (bracket.rate / 100);
  }, 0);
};

function Field({
  label,
  value,
  suffix,
  onChange
}: {
  label: string;
  value: string;
  suffix?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-slate-500">{label}</span>
      <div className="relative">
        <input
          value={value}
          onChange={event => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 outline-none"
          inputMode="numeric"
        />
        {suffix ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">{suffix}</span>
        ) : null}
      </div>
    </label>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
  tone = 'slate'
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  tone?: 'slate' | 'emerald' | 'amber' | 'rose' | 'blue';
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    blue: 'bg-blue-50 text-blue-700'
  };

  return (
    <article className="app-card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-500">{title}</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-slate-950">{value}</h3>
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
          {icon}
        </div>
      </div>
      <p className="text-xs font-bold leading-6 text-slate-500">{description}</p>
    </article>
  );
}

export function TaxAuditView({
  orders,
  expenses,
  restaurantInfo
}: {
  orders: Order[];
  expenses: Expense[];
  restaurantInfo?: RestaurantInfo;
}) {
  const [auditYear, setAuditYear] = useState<AuditYear>('1404');
  const [activeTab, setActiveTab] = useState<AuditTab>('summary');
  const [vatRate, setVatRate] = useState(formatPlainNumber(TAX_RULES['1404'].vatRate));
  const [incomeTaxRate, setIncomeTaxRate] = useState(formatPlainNumber(TAX_RULES['1404'].incomeTaxRate));
  const [disallowedExpenseRate, setDisallowedExpenseRate] = useState('8');
  const [revenueAdjustment, setRevenueAdjustment] = useState('0');
  const [inputVatCredit, setInputVatCredit] = useState('0');
  const [monthlyPayroll, setMonthlyPayroll] = useState('35000000');
  const [activeQuarter, setActiveQuarter] = useState<'همه' | 'بهار' | 'تابستان' | 'پاییز' | 'زمستان'>('همه');

  const selectedRules = TAX_RULES[auditYear];

  const applyYearRules = (year: AuditYear) => {
    setAuditYear(year);
    setVatRate(formatPlainNumber(TAX_RULES[year].vatRate));
    setIncomeTaxRate(formatPlainNumber(TAX_RULES[year].incomeTaxRate));
  };

  const auditData = useMemo(() => {
    const completedOrders = orders.filter(order => order.status === 'completed' && getPersianYear(order.date) === auditYear);
    const yearExpenses = expenses.filter(expense => getPersianYear(expense.date) === auditYear);
    const quarterOrders = activeQuarter === 'همه' ? completedOrders : completedOrders.filter(order => getPersianQuarter(order.date) === activeQuarter);
    const quarterExpenses = activeQuarter === 'همه' ? yearExpenses : yearExpenses.filter(expense => getPersianQuarter(expense.date) === activeQuarter);

    const grossSales = quarterOrders.reduce((sum, order) => sum + order.total, 0);
    const expenseTotal = quarterExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const adjustment = parseMoney(revenueAdjustment);
    const disallowed = expenseTotal * (Number(disallowedExpenseRate || 0) / 100);
    const effectiveVatRate = Number(vatRate || 0);
    const effectiveIncomeTaxRate = Number(incomeTaxRate || 0);
    const taxableSalesBase = grossSales + adjustment;
    const salesWithoutVat = effectiveVatRate > 0 ? taxableSalesBase / (1 + effectiveVatRate / 100) : taxableSalesBase;
    const outputVat = Math.max(0, taxableSalesBase - salesWithoutVat);
    const deductibleVat = parseMoney(inputVatCredit);
    const vatPayable = Math.max(0, outputVat - deductibleVat);
    const taxableProfit = Math.max(0, salesWithoutVat - expenseTotal + disallowed);
    const incomeTax = taxableProfit * (effectiveIncomeTaxRate / 100);
    const netAfterTax = taxableProfit - incomeTax;
    const averageTicket = quarterOrders.length > 0 ? grossSales / quarterOrders.length : 0;

    const missingPayments = quarterOrders.filter(order => order.paymentMethod === 'unpaid').length;
    const cancelledOrders = orders.filter(order => getPersianYear(order.date) === auditYear && order.status === 'cancelled').length;
    const highExpenses = quarterExpenses.filter(expense => expense.amount > Math.max(averageTicket * 8, 15 * MILLION));
    const undocumentedExpenses = quarterExpenses.filter(expense => expense.category === 'other').length;
    const riskScore = Math.min(100, Math.round(
      missingPayments * 12 +
      cancelledOrders * 5 +
      undocumentedExpenses * 8 +
      highExpenses.length * 10 +
      (disallowed > 0 ? 10 : 0)
    ));

    return {
      completedOrders,
      yearExpenses,
      quarterOrders,
      quarterExpenses,
      grossSales,
      expenseTotal,
      adjustment,
      disallowed,
      taxableSalesBase,
      salesWithoutVat,
      outputVat,
      deductibleVat,
      vatPayable,
      taxableProfit,
      incomeTax,
      netAfterTax,
      averageTicket,
      missingPayments,
      cancelledOrders,
      highExpenses,
      undocumentedExpenses,
      riskScore
    };
  }, [activeQuarter, auditYear, disallowedExpenseRate, expenses, incomeTaxRate, inputVatCredit, orders, revenueAdjustment, vatRate]);

  const payrollTax = useMemo(() => {
    const monthlyIncome = parseMoney(monthlyPayroll);
    const monthlyTax = calculateProgressiveTax(monthlyIncome, selectedRules.payrollBrackets);
    return {
      monthlyIncome,
      monthlyTax,
      yearlyTax: monthlyTax * 12,
      effectiveRate: monthlyIncome > 0 ? (monthlyTax / monthlyIncome) * 100 : 0
    };
  }, [monthlyPayroll, selectedRules.payrollBrackets]);

  const auditChecks = [
    {
      title: 'تطبیق فروش با گزارش صندوق',
      status: auditData.completedOrders.length > 0 ? 'ok' : 'warn',
      detail: `${formatNumber(auditData.quarterOrders.length)} سفارش تکمیل شده در بازه انتخابی بررسی شد.`
    },
    {
      title: 'کنترل مالیات و عوارض فروش',
      status: Number(vatRate) === selectedRules.vatRate ? 'ok' : 'warn',
      detail: `نرخ اعمال شده ${formatNumber(Number(vatRate || 0))}٪ است و نرخ پیشنهادی سال ${auditYear} برابر ${formatNumber(selectedRules.vatRate)}٪ ثبت شده.`
    },
    {
      title: 'رسیدگی هزینه‌های غیرقابل قبول',
      status: auditData.disallowed > 0 ? 'warn' : 'ok',
      detail: `${formatPrice(auditData.disallowed)} به عنوان تعدیل هزینه در محاسبه عملکرد لحاظ شده است.`
    },
    {
      title: 'کنترل پرداخت‌های باز',
      status: auditData.missingPayments === 0 ? 'ok' : 'danger',
      detail: `${formatNumber(auditData.missingPayments)} سفارش بدون تسویه در بازه انتخابی دیده شد.`
    }
  ];

  const riskTone = auditData.riskScore >= 65 ? 'rose' : auditData.riskScore >= 35 ? 'amber' : 'emerald';

  return (
    <div className="h-full overflow-y-auto pb-8">
      <section className="tax-audit-hero mb-5">
        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">
              <ShieldCheck size={14} />
              پرونده رسیدگی مالیاتی
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              حسابرسی مالیاتی {restaurantInfo?.name || 'رستوران'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-white/64">
              محاسبات این صفحه بر اساس داده‌های فروش و هزینه سیستم انجام می‌شود و متغیرهای سالانه مثل نرخ ارزش افزوده، سقف معافیت حقوق، طبقات حقوق و درصد مالیات عملکرد قابل تغییر هستند.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[38rem]">
            <div className="rounded-xl border border-white/10 bg-white/10 p-3">
              <p className="text-2xl font-black text-white">{formatNumber(auditData.quarterOrders.length)}</p>
              <p className="text-xs font-bold text-white/52">فاکتور فروش</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-3">
              <p className="text-2xl font-black text-white">{formatNumber(auditData.quarterExpenses.length)}</p>
              <p className="text-xs font-bold text-white/52">سند هزینه</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-3">
              <p className="text-2xl font-black text-white">{formatNumber(auditData.riskScore)}٪</p>
              <p className="text-xs font-bold text-white/52">ریسک رسیدگی</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 p-3">
              <p className="text-2xl font-black text-white">{formatNumber(Number(vatRate || 0))}٪</p>
              <p className="text-xs font-bold text-white/52">نرخ ارزش افزوده</p>
            </div>
          </div>
        </div>
      </section>

      <section className="app-card mb-5 p-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="app-tabs">
            {([
              ['summary', 'خلاصه حسابرسی', Calculator],
              ['vat', 'ارزش افزوده', BadgePercent],
              ['payroll', 'حقوق و دستمزد', Users],
              ['risks', 'ریسک و چک‌لیست', ClipboardCheck],
              ['rules', 'متغیرهای قانونی', Settings2]
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn('app-tab', activeTab === id && 'app-tab-active')}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="app-tabs app-tabs-compact">
              {(['1404', '1405'] as AuditYear[]).map(year => (
                <button
                  key={year}
                  onClick={() => applyYearRules(year)}
                  className={cn('app-tab', auditYear === year && 'app-tab-active')}
                >
                  {year}
                </button>
              ))}
            </div>
            <select
              value={activeQuarter}
              onChange={event => setActiveQuarter(event.target.value as typeof activeQuarter)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none"
            >
              {['همه', 'بهار', 'تابستان', 'پاییز', 'زمستان'].map(quarter => (
                <option key={quarter} value={quarter}>{quarter}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {activeTab === 'summary' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="فروش مشمول بررسی" value={formatPrice(auditData.taxableSalesBase)} description="فروش تکمیل‌شده به همراه تعدیلات دستی درآمد." icon={<ReceiptText size={21} />} tone="blue" />
            <MetricCard title="سود مشمول عملکرد" value={formatPrice(auditData.taxableProfit)} description="فروش بدون ارزش افزوده منهای هزینه‌ها به‌علاوه هزینه غیرقابل قبول." icon={<TrendingUp size={21} />} tone="emerald" />
            <MetricCard title="مالیات عملکرد برآوردی" value={formatPrice(auditData.incomeTax)} description={`با نرخ ${formatNumber(Number(incomeTaxRate || 0))}٪ برای پرونده انتخابی محاسبه شده است.`} icon={<Calculator size={21} />} tone="amber" />
            <MetricCard title="مانده پس از مالیات" value={formatPrice(auditData.netAfterTax)} description="سود قابل انتظار پس از کسر مالیات عملکرد برآوردی." icon={<CheckCircle2 size={21} />} tone="slate" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_25rem]">
            <div className="app-card overflow-hidden p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-950">صورت محاسبه عملکرد</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500">برای مرور سریع پرونده قبل از ارسال اظهارنامه</p>
                </div>
                <span className={cn(
                  'rounded-xl px-3 py-2 text-xs font-black',
                  riskTone === 'rose' ? 'bg-rose-50 text-rose-700' : riskTone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                )}>
                  ریسک {formatNumber(auditData.riskScore)}٪
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr>
                      <th className="px-4 py-3">شرح</th>
                      <th className="px-4 py-3">اثر</th>
                      <th className="px-4 py-3">مبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold">
                    {[
                      ['فروش ثبت‌شده', '+', auditData.grossSales],
                      ['تعدیل درآمد', '+', auditData.adjustment],
                      ['فروش بدون ارزش افزوده', '=', auditData.salesWithoutVat],
                      ['هزینه‌های ثبت‌شده', '-', auditData.expenseTotal],
                      ['هزینه غیرقابل قبول', '+', auditData.disallowed],
                      ['مالیات عملکرد', '-', auditData.incomeTax]
                    ].map(([label, effect, amount]) => (
                      <tr key={String(label)}>
                        <td className="px-4 py-4 text-slate-700">{label}</td>
                        <td className="px-4 py-4 text-slate-400">{effect}</td>
                        <td className="px-4 py-4 text-slate-950">{formatPrice(Number(amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="app-card p-5">
              <h3 className="mb-4 text-lg font-black text-slate-950">ورودی‌های حسابرسی</h3>
              <div className="space-y-4">
                <Field label="نرخ مالیات عملکرد" value={incomeTaxRate} suffix="٪" onChange={setIncomeTaxRate} />
                <Field label="درصد هزینه غیرقابل قبول" value={disallowedExpenseRate} suffix="٪" onChange={setDisallowedExpenseRate} />
                <Field label="تعدیل درآمد فروش" value={revenueAdjustment} suffix="تومان" onChange={setRevenueAdjustment} />
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-800">
                  <Info size={16} className="mb-2" />
                  برای رسیدگی واقعی، تعدیل درآمد و هزینه غیرقابل قبول باید با اسناد، فاکتور رسمی، گزارش سامانه مودیان و دفاتر قانونی تطبیق داده شود.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'vat' ? (
        <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
          <div className="app-card p-5">
            <h3 className="mb-4 text-lg font-black text-slate-950">پارامتر ارزش افزوده</h3>
            <div className="space-y-4">
              <Field label="نرخ ارزش افزوده فروش" value={vatRate} suffix="٪" onChange={setVatRate} />
              <Field label="اعتبار ارزش افزوده خرید" value={inputVatCredit} suffix="تومان" onChange={setInputVatCredit} />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs font-bold leading-6 text-slate-600">
                اعتبار خرید را فقط در صورتی وارد کنید که فاکتور رسمی، شناسه مالیاتی و قابلیت پذیرش در سامانه مودیان کنترل شده باشد.
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard title="فروش با مالیات" value={formatPrice(auditData.taxableSalesBase)} description="مبنای کل فروش پس از تعدیل درآمد." icon={<ReceiptText size={21} />} tone="blue" />
            <MetricCard title="مالیات فروش خروجی" value={formatPrice(auditData.outputVat)} description="بخش ارزش افزوده استخراج‌شده از فروش ثبت‌شده." icon={<BadgePercent size={21} />} tone="amber" />
            <MetricCard title="قابل پرداخت" value={formatPrice(auditData.vatPayable)} description="مالیات خروجی منهای اعتبار خرید پذیرفته‌شده." icon={<ShieldCheck size={21} />} tone="emerald" />
          </div>
        </div>
      ) : null}

      {activeTab === 'payroll' ? (
        <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
          <div className="app-card p-5">
            <h3 className="mb-4 text-lg font-black text-slate-950">محاسبه نمونه حقوق</h3>
            <Field label="حقوق مشمول ماهانه" value={monthlyPayroll} suffix="تومان" onChange={setMonthlyPayroll} />
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs font-bold leading-6 text-blue-800">
              سقف معافیت ماهانه سال {auditYear}: {formatPrice(selectedRules.monthlySalaryExemption)}
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard title="حقوق مشمول" value={formatPrice(payrollTax.monthlyIncome)} description="ورودی نمونه برای کنترل محاسبه حقوق." icon={<Users size={21} />} tone="blue" />
              <MetricCard title="مالیات ماهانه" value={formatPrice(payrollTax.monthlyTax)} description="محاسبه پلکانی بر اساس طبقات سال انتخابی." icon={<Calculator size={21} />} tone="amber" />
              <MetricCard title="نرخ موثر" value={`${formatNumber(Number(payrollTax.effectiveRate.toFixed(1)))}٪`} description="نسبت مالیات ماهانه به حقوق مشمول." icon={<TrendingUp size={21} />} tone="emerald" />
            </div>

            <div className="app-card overflow-hidden p-5">
              <h3 className="mb-4 text-lg font-black text-slate-950">طبقات مالیات حقوق {auditYear}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr>
                      <th className="px-4 py-3">از</th>
                      <th className="px-4 py-3">تا</th>
                      <th className="px-4 py-3">نرخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRules.payrollBrackets.map((bracket, index) => (
                      <tr key={`${bracket.from}-${index}`} className="text-sm font-bold">
                        <td className="px-4 py-4">{formatPrice(bracket.from)}</td>
                        <td className="px-4 py-4">{bracket.to ? formatPrice(bracket.to) : 'مازاد'}</td>
                        <td className="px-4 py-4 text-slate-950">{formatNumber(bracket.rate)}٪</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'risks' ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
          <div className="app-card p-5">
            <h3 className="mb-4 text-lg font-black text-slate-950">چک‌لیست حسابرس</h3>
            <div className="grid gap-3">
              {auditChecks.map(check => (
                <div key={check.title} className="flex gap-3 rounded-xl border border-slate-200 bg-white/74 p-4">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    check.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : check.status === 'danger' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                  )}>
                    {check.status === 'ok' ? <CheckCircle2 size={19} /> : <AlertTriangle size={19} />}
                  </div>
                  <div>
                    <p className="font-black text-slate-900">{check.title}</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <MetricCard title="هزینه‌های بزرگ" value={formatNumber(auditData.highExpenses.length)} description="هزینه‌هایی که نسبت به میانگین فاکتور نیاز به سند پشتیبان دارند." icon={<FileSearch size={21} />} tone="amber" />
            <MetricCard title="هزینه سایر" value={formatNumber(auditData.undocumentedExpenses)} description="هزینه‌های دسته‌بندی نشده که بهتر است قبل از رسیدگی بازطبقه‌بندی شوند." icon={<AlertTriangle size={21} />} tone="rose" />
            <MetricCard title="سفارش تسویه نشده" value={formatNumber(auditData.missingPayments)} description="برای تطبیق فروش، وضعیت پرداخت این سفارش‌ها تعیین تکلیف شود." icon={<ReceiptText size={21} />} tone="blue" />
          </div>
        </div>
      ) : null}

      {activeTab === 'rules' ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
          <div className="app-card p-5">
            <h3 className="mb-2 text-lg font-black text-slate-950">متغیرهای قابل تغییر</h3>
            <p className="mb-5 text-sm font-bold leading-7 text-slate-500">
              این بخش برای این طراحی شده که تغییر قانون بین ۱۴۰۴ و ۱۴۰۵ یا بخشنامه‌های بعدی، بدون تغییر کد قابل کنترل باشد.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard title="ارزش افزوده پیش‌فرض" value={`${formatNumber(selectedRules.vatRate)}٪`} description="برای اغلب فروش‌های مشمول؛ معافیت‌ها باید جداگانه کنترل شوند." icon={<BadgePercent size={21} />} tone="blue" />
              <MetricCard title="عملکرد اشخاص حقوقی" value={`${formatNumber(selectedRules.incomeTaxRate)}٪`} description="نرخ پیش‌فرض قابل تغییر برای شبیه‌سازی پرونده." icon={<Calculator size={21} />} tone="amber" />
              <MetricCard title="معافیت حقوق ماهانه" value={formatPrice(selectedRules.monthlySalaryExemption)} description={`مبنای محاسبه حقوق سال ${auditYear}.`} icon={<Users size={21} />} tone="emerald" />
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950">
            <Sparkles size={22} className="mb-3" />
            <h3 className="font-black">یادداشت سال انتخابی</h3>
            <p className="mt-3 text-sm font-bold leading-7">{selectedRules.note}</p>
            <p className="mt-4 text-xs font-bold leading-6 text-cyan-800">
              این محاسبات برای کمک به آماده‌سازی حسابرس است و جایگزین رسیدگی نهایی، بخشنامه رسمی یا نظر مشاور مالیاتی نیست.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
