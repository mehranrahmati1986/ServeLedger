import React, { useState } from 'react';
import { Staff } from '../types';
import { formatNumber, cn } from '../lib/utils';
import { Users, UserPlus, Phone, ChefHat, CheckCircle2, X, CalendarClock, TrendingUp, Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export const weekDays = [
  { id: 'sat', label: 'شنبه' },
  { id: 'sun', label: 'یکشنبه' },
  { id: 'mon', label: 'دوشنبه' },
  { id: 'tue', label: 'سه‌شنبه' },
  { id: 'wed', label: 'چهارشنبه' },
  { id: 'thu', label: 'پنجشنبه' },
  { id: 'fri', label: 'جمعه' },
];

interface StaffViewProps {
  staff: Staff[];
  orders?: import('../types').Order[];
  restaurantInfo?: import('../types').RestaurantInfo;
  onAddStaff?: (staffInfo: Omit<Staff, 'id'>) => void;
  onToggleStatus?: (id: string) => void;
  onUpdateStaffShifts?: (staffId: string, shifts: Staff['shifts']) => void;
}

export function StaffView({ staff, orders = [], restaurantInfo, onAddStaff, onToggleStatus, onUpdateStaffShifts }: StaffViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [scheduleModalStaffId, setScheduleModalStaffId] = useState<string | null>(null);
  const [editingShifts, setEditingShifts] = useState<Staff['shifts']>({});
  const [performanceTimeRange, setPerformanceTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  
  const [newStaff, setNewStaff] = useState<Omit<Staff, 'id'>>({

    name: '',
    role: 'waiter',
    phone: '',
    isActive: true,
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.phone) return;

    if (onAddStaff) {
      onAddStaff(newStaff);
    }

    setIsAddModalOpen(false);
    setNewStaff({
      name: '',
      role: 'waiter',
      phone: '',
      isActive: true,
    });
  };

  const openScheduleModal = (person: Staff) => {
    setScheduleModalStaffId(person.id);
    setEditingShifts(person.shifts || {});
  };

  const handleSaveSchedule = () => {
    if (scheduleModalStaffId && onUpdateStaffShifts) {
      onUpdateStaffShifts(scheduleModalStaffId, editingShifts);
    }
    setScheduleModalStaffId(null);
  };

  const getRoleLabel = (role: Staff['role']) => {
    switch(role) {
      case 'waiter': return 'گارسون';
      case 'chef': return 'آشپز';
      case 'manager': return 'مدیر';
    }
  };

  const performanceData = React.useMemo(() => {
    const now = new Date();
    const filteredOrders = orders.filter(o => {
      if (o.status !== 'completed') return false;
      const oDate = new Date(o.date);
      if (performanceTimeRange === 'today') {
        return oDate.toDateString() === now.toDateString();
      } else if (performanceTimeRange === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return oDate >= weekAgo;
      } else if (performanceTimeRange === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return oDate >= monthAgo;
      }
      return true;
    });

    return staff.map((person) => {
      let weeklyHours = 0;
      let shiftOrders = 0;
      let shiftSales = 0;
      
      const shifts = person.shifts || {};
      
      // Calculate total weekly scheduled hours
      for (const day of weekDays) {
         const shift = shifts[day.id];
         if (shift && shift.isActive) {
            const [sH, sM] = shift.startTime.split(':').map(Number);
            const [eH, eM] = shift.endTime.split(':').map(Number);
            let diff = (eH + eM/60) - (sH + sM/60);
            if (diff < 0) diff += 24; 
            weeklyHours += diff;
         }
      }
      
      const dayMap: Record<number, string> = {
         0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat'
      };
      
      filteredOrders.forEach(order => {
         if (order.staffId === person.id) {
           shiftOrders++;
           shiftSales += order.total;
           return;
         }
         
         if (!order.staffId) {
           const d = new Date(order.date);
           const dayId = dayMap[d.getDay()];
           const shift = shifts[dayId];
           if (shift && shift.isActive) {
              const currentHour = d.getHours() + d.getMinutes() / 60;
              const [sH, sM] = shift.startTime.split(':').map(Number);
              const [eH, eM] = shift.endTime.split(':').map(Number);
              
              const sTime = sH + sM / 60;
              const eTime = eH + eM / 60;
              
              let isWorking = false;
              if (sTime <= eTime) {
                isWorking = currentHour >= sTime && currentHour <= eTime;
              } else {
                isWorking = currentHour >= sTime || currentHour <= eTime;
              }
              
              if (isWorking) {
                shiftOrders++;
                shiftSales += order.total;
              }
           }
         }
      });

      return {
        id: person.id,
        name: person.name,
        orders: shiftOrders,
        sales: shiftSales,
        role: person.role,
        weeklyHours: Math.round(weeklyHours * 10) / 10
      };
    });
  }, [staff, orders, performanceTimeRange]);

  return (
    <div className="h-full flex flex-col gap-6 relative print:h-auto print:block">
      <div className="flex items-center justify-between shrink-0 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">پرسنل رستوران</h2>
          <p className="text-slate-500 mt-1">مدیریت لیست کارکنان، نقش‌ها و اطلاعات تماس</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-zinc-900 text-white flex items-center gap-2 px-5 py-3 rounded-xl hover:bg-zinc-800 transition-colors font-medium shadow-sm"
        >
          <UserPlus size={20} />
          افزودن پرسنل جدید
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-6 print:hidden">
        {/* Performance Chart Section */}
        {staff.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col xl:flex-row gap-6 items-center">
            <div className="w-full xl:w-1/4 flex flex-col items-start gap-3 shrink-0">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">عملکرد پرسنل</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                گزارش تعداد سفارش‌های تکمیل شده و فروش موفق هر شخص.
              </p>
              
              <select
                value={performanceTimeRange}
                onChange={(e) => setPerformanceTimeRange(e.target.value as any)}
                className="mt-2 text-sm bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              >
                <option value="today">امروز</option>
                <option value="week">هفته اخیر</option>
                <option value="month">ماه اخیر</option>
                <option value="all">همه زمان‌ها</option>
              </select>

              <button 
                onClick={() => window.print()}
                className="mt-2 text-sm font-bold bg-indigo-50 text-indigo-700 px-4 py-2 border border-indigo-200 rounded-xl flex items-center gap-2 hover:bg-indigo-100 transition-colors w-full justify-center"
                title="چاپ گزارش کامل پرسنل"
              >
                <Printer size={16} /> چاپ گزارش عملکرد
              </button>
            </div>
            <div className="w-full xl:w-3/4 h-[300px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontFamily: 'inherit' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} yAxisId="left" orientation="left" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} yAxisId="right" orientation="right" tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`} />
                  <RechartsTooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontFamily: 'inherit', textAlign: 'right', direction: 'rtl' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'orders') return [`${value} سفارش`, 'تکمیل شده'];
                      if (name === 'sales') return [`${value.toLocaleString()} تومان`, 'مبلغ فروش'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} yAxisId="left" name="orders" />
                  <Bar dataKey="sales" fill="#10b981" radius={[6, 6, 0, 0]} yAxisId="right" name="sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {staff.map(person => {
          const perf = performanceData.find(p => p.id === person.id);
          return (
          <div key={person.id} className="bg-white border text-sm border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col hover:border-amber-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center shrink-0">
                {person.role === 'chef' ? <ChefHat size={24} /> : <Users size={24} />}
              </div>
              <span className={cn(
                "px-2 py-1 rounded text-xs font-bold",
                person.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
              )}>
                {person.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-1">{person.name}</h3>
            <p className="text-amber-600 font-bold mb-4">{getRoleLabel(person.role)}</p>
            
            {perf && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 grid grid-cols-2 gap-2 text-center text-xs">
                 <div>
                    <div className="text-slate-500 mb-1">تکمیل شده</div>
                    <div className="font-bold font-mono text-slate-800">{perf.orders}</div>
                 </div>
                 <div>
                    <div className="text-slate-500 mb-1">فروش</div>
                    <div className="font-bold relative flex justify-center text-emerald-600">
                      <span className="truncate">{((perf.sales || 0) / 1000).toLocaleString()}k</span>
                    </div>
                 </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-slate-500 mb-4 mt-auto">
              <Phone size={16} />
              <span dir="ltr" className="font-mono text-sm">{person.phone}</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => openScheduleModal(person)}
                className="w-full py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-bold border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <CalendarClock size={16} />
                زمان‌بندی شیفت
              </button>
              <button 
                onClick={() => onToggleStatus && onToggleStatus(person.id)}
                className={cn(
                  "w-full py-2 flex items-center justify-center gap-2 rounded-xl text-sm font-bold border transition-colors",
                  person.isActive 
                    ? "bg-white border-slate-200 text-slate-600 hover:bg-slate-50" 
                    : "bg-slate-800 border-slate-800 text-white hover:bg-slate-700"
                )}
              >
                {person.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
              </button>
            </div>
          </div>
        )})}
        {staff.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
             <Users size={48} className="mb-4 opacity-50" />
             <p className="text-lg">هیچ پرسنلی ثبت نشده است.</p>
          </div>
        )}
      </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">افزودن پرسنل جدید</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-staff-form" onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">نام و نام خانوادگی</label>
                  <input
                    type="text"
                    required
                    value={newStaff.name}
                    onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700"
                    placeholder="مثال: علی احمدی"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">نقش (سمت)</label>
                  <select
                    required
                    value={newStaff.role}
                    onChange={e => setNewStaff({...newStaff, role: e.target.value as Staff['role']})}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700"
                  >
                    <option value="waiter">گارسون</option>
                    <option value="chef">آشپز</option>
                    <option value="manager">مدیر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">شماره تماس</label>
                  <input
                    type="tel"
                    required
                    value={newStaff.phone}
                    onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 text-left"
                    dir="ltr"
                    placeholder="09123456789"
                  />
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto">
              <button
                type="submit"
                form="add-staff-form"
                className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors shadow-sm"
              >
                ثبت پرسنل
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Schedule Modal */}
      {scheduleModalStaffId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">برنامه زمان‌بندی شیفت</h2>
                <p className="text-sm text-slate-500 mt-1">تخصیص ساعات کاری در ایام هفته</p>
              </div>
              <button 
                onClick={() => setScheduleModalStaffId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                title="Bستن"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              {weekDays.map(day => {
                const dayShift = editingShifts?.[day.id] || { startTime: '08:00', endTime: '16:00', isActive: false };
                return (
                  <div key={day.id} className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border transition-colors",
                    dayShift.isActive ? "bg-amber-50/50 border-amber-200" : "bg-slate-50 border-slate-200"
                  )}>
                    <div className="flex items-center gap-3 w-32 shrink-0">
                      <input 
                        type="checkbox" 
                        id={`day-${day.id}`}
                        checked={dayShift.isActive}
                        onChange={(e) => {
                          setEditingShifts(prev => ({
                            ...prev,
                            [day.id]: { ...dayShift, isActive: e.target.checked }
                          }));
                        }}
                        className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                      />
                      <label htmlFor={`day-${day.id}`} className={cn(
                        "font-bold cursor-pointer select-none",
                        dayShift.isActive ? "text-amber-900" : "text-slate-500"
                      )}>
                        {day.label}
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1 flex flex-col gap-1 text-sm">
                        <label className={cn("font-medium", dayShift.isActive ? "text-amber-800" : "text-slate-400")}>از ساعت</label>
                        <input 
                          type="time" 
                          disabled={!dayShift.isActive}
                          value={dayShift.startTime}
                          onChange={(e) => {
                            setEditingShifts(prev => ({
                              ...prev,
                              [day.id]: { ...dayShift, startTime: e.target.value }
                            }));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50 disabled:bg-slate-100"
                          dir="ltr"
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-1 text-sm">
                        <label className={cn("font-medium", dayShift.isActive ? "text-amber-800" : "text-slate-400")}>تا ساعت</label>
                        <input 
                          type="time" 
                          disabled={!dayShift.isActive}
                          value={dayShift.endTime}
                          onChange={(e) => {
                            setEditingShifts(prev => ({
                              ...prev,
                              [day.id]: { ...dayShift, endTime: e.target.value }
                            }));
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 focus:ring-2 focus:ring-amber-500 outline-none disabled:opacity-50 disabled:bg-slate-100"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto flex gap-3">
               <button
                onClick={handleSaveSchedule}
                className="flex-1 py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors shadow-sm"
               >
                 ذخیره زمان‌بندی
               </button>
               <button
                onClick={() => setScheduleModalStaffId(null)}
                className="px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
               >
                 انصراف
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View for Staff Report - Hidden by default */}
      <div className="hidden print:block w-full text-black" style={{ margin: 0, padding: '1rem' }}>
        <div className="text-center mb-8 border-b-2 border-slate-200 pb-6">
          {restaurantInfo?.logo ? (
             <img src={restaurantInfo.logo} alt={restaurantInfo.name} className="h-20 mx-auto mb-4" />
          ) : null}
          <h1 className="text-3xl font-black text-slate-800 mb-2">گزارش عملکرد پرسنل {restaurantInfo?.name || ''}</h1>
          <p className="text-slate-600 font-bold text-lg">
            تاریخ ثبت گزارش: {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}
          </p>
          {restaurantInfo?.address && <p className="text-sm text-slate-500 mt-2">{restaurantInfo.address}</p>}
          {restaurantInfo?.phone && <p className="text-sm text-slate-500">تلفن: {restaurantInfo.phone}</p>}
        </div>

        <table className="w-full text-right border-collapse text-sm mb-8">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="py-3 px-4 border border-slate-200 font-bold">نام پرسنل</th>
              <th className="py-3 px-4 border border-slate-200 font-bold">سمت</th>
              <th className="py-3 px-4 border border-slate-200 font-bold">مجموع ساعات کاری (هفته)</th>
              <th className="py-3 px-4 border border-slate-200 font-bold">سفارش‌های تکمیل شده در شیفت</th>
            </tr>
          </thead>
          <tbody>
            {performanceData.map(data => (
              <tr key={data.id} className="border-b border-slate-200">
                <td className="py-3 px-4 border border-slate-200 font-medium text-slate-800">{data.name}</td>
                <td className="py-3 px-4 border border-slate-200">
                  {data.role === 'waiter' ? 'گارسون' : data.role === 'chef' ? 'آشپز' : 'مدیر'}
                </td>
                <td className="py-3 px-4 border border-slate-200" dir="ltr">{data.weeklyHours} ساعت</td>
                <td className="py-3 px-4 border border-slate-200 font-bold text-indigo-600">
                  {data.orders} سفارش
                </td>
              </tr>
            ))}
            {performanceData.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500 border border-slate-200">
                  هیچ پرسنلی یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div className="mt-12 text-center text-sm text-slate-500 print-footer">
          <p>این سند به صورت خودکار توسط سیستم صادر شده است.</p>
        </div>
      </div>
    </div>
  );
}
