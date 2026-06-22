import React, { useState } from 'react';
import { Table, SMSMessage } from '../types';
import { CalendarDays, Clock, Users, Phone, X, Check, Search, Calendar as CalendarIcon, ChevronRight, ChevronLeft, MessageSquare, History } from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { simulateSMS, MANAGER_PHONE } from '../lib/sms';

interface ReservationsViewProps {
  tables: Table[];
  smsMessages?: SMSMessage[];
  onUpdateTableStatus: (tableId: string, status: 'available' | 'occupied' | 'reserved', clearReservation?: boolean) => void;
  onLogEvent?: (msg: string, type: string) => void;
}

export function ReservationsView({ tables, smsMessages = [], onUpdateTableStatus, onLogEvent }: ReservationsViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'sms'>('calendar');
  
  // All reserved tables
  const reservedTables = tables.filter(t => t.status === 'reserved' && t.reservation);
  
  // Extract unique dates from reservations
  const reservedDates = Array.from(new Set(reservedTables.map(t => t.reservation?.date || '')));

  // Get current month details
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  
  // Adjusted for standard visualization (assuming Monday to Sunday or Sunday to Saturday, let's keep Sun-Sat for simplicity)
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const [selectedDate, setSelectedDate] = useState<string>(
    currentDate.toISOString().split('T')[0]
  );

  const formatLocalDate = (year: number, month: number, day: number) => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const dayNames = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  const monthNames = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];

  const selectedReservations = reservedTables.filter(t => t.reservation?.date === selectedDate).sort((a, b) => {
    if (a.reservation?.time && b.reservation?.time) {
      return a.reservation.time.localeCompare(b.reservation.time);
    }
    return 0;
  });

  const handleApprove = (table: Table) => {
    if (confirm('آیا از حضور مشتری و تغییر وضعیت به "در حال استفاده" اطمینان دارید؟')) {
      onUpdateTableStatus(table.id, 'occupied', true);
      if (onLogEvent) {
        onLogEvent(`رزرو میز ${table.number} تایید و مشتری حاضر شد.`, 'table');
      }
      simulateSMS(table.reservation!.phone, `مشتری گرامی، حضور شما ثبت شد. خوش آمدید!`);
    }
  };

  const handleCancel = (table: Table) => {
    if (confirm('آیا از لغو این رزرو اطمینان دارید؟')) {
      onUpdateTableStatus(table.id, 'available', true);
      if (onLogEvent) {
        onLogEvent(`رزرو میز ${table.number} لغو شد.`, 'table');
      }
      simulateSMS(table.reservation!.phone, `مشتری گرامی، رزرو شما متاسفانه لغو گردید.`);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">تقویم رزروها و پیامک‌ها</h2>
          <p className="text-slate-500 mt-1">مدیریت هماهنگی میزها و بازبینی تاریخچه پیامک‌های خودکار</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('calendar')}
            className={cn(
              "px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === 'calendar' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
            )}
          >
            <CalendarDays size={18} />
            تقویم رزروها
          </button>
          <button
             onClick={() => setActiveTab('sms')}
             className={cn(
               "px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-semibold transition-all",
               activeTab === 'sms' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
             )}
          >
            <History size={18} />
            تاریخچه پیامک‌ها
          </button>
          <button
             onClick={() => window.open(window.location.origin + '/reserve', '_blank')}
             className="px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
             title="مشاهده صفحه عمومی رزرو"
          >
            <Users size={18} />
            لینک عمومی
          </button>
        </div>
      </div>

      {activeTab === 'calendar' ? (
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Calendar Section */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
           <div className="flex items-center justify-between mb-4">
             <button onClick={prevMonth} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
               <ChevronRight size={20} />
             </button>
             <h3 className="font-bold text-lg text-slate-800" dir="ltr">
               {monthNames[currentMonth]} {currentYear}
             </h3>
             <button onClick={nextMonth} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
               <ChevronLeft size={20} />
             </button>
           </div>
           
           <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-semibold text-slate-400">
             {dayNames.map(day => (
               <div key={day} className="py-2">{day}</div>
             ))}
           </div>
           
           <div className="grid grid-cols-7 gap-2">
             {blanksArray.map(b => (
               <div key={`blank-${b}`} className="aspect-square"></div>
             ))}
             {daysArray.map(day => {
               const dateStr = formatLocalDate(currentYear, currentMonth, day);
               const isSelected = selectedDate === dateStr;
               const hasReservation = reservedDates.includes(dateStr);
               
               return (
                 <button 
                   key={day}
                   onClick={() => setSelectedDate(dateStr)}
                   className={cn(
                     "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all border",
                     isSelected ? "bg-amber-500 text-white border-amber-500 font-bold shadow-md transform scale-105" : "bg-white text-slate-700 hover:bg-slate-50 border-slate-100 hover:border-slate-300"
                   )}
                 >
                   <span>{day}</span>
                   {hasReservation && (
                     <div className={cn("w-2 h-2 rounded-full absolute bottom-2", isSelected ? "bg-white" : "bg-amber-500")}></div>
                   )}
                 </button>
               );
             })}
           </div>
           
           <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
             <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><CalendarIcon size={16} /> راهنمای تقویم</h4>
             <ul className="text-xs text-slate-500 space-y-2">
               <li className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> روزهای دارای رزرو</li>
               <li className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-amber-500 bg-amber-500 text-white rounded-full flex items-center justify-center p-[2px]"></div> روز انتخاب شده</li>
             </ul>
           </div>
        </div>

        {/* Reservations List for Selected Date */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 overflow-y-auto">
          <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-4 mb-2 flex items-center gap-2">
             <CalendarDays size={20} className="text-amber-500" />
             رزروهای <span dir="ltr">{selectedDate}</span>
          </h3>

          {selectedReservations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
              <CalendarDays size={48} className="mb-4 opacity-20" />
              <p>در این تاریخ هیچ رزروی ثبت نشده است.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedReservations.map(table => (
                <div key={table.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 hover:border-amber-300 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-100 text-amber-600 font-black rounded-xl flex items-center justify-center text-lg shadow-sm">
                        {formatNumber(table.number)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{table.reservation?.customerName}</h4>
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Phone size={12} className="text-slate-400" /> {table.reservation?.phone}</span>
                          <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> {formatNumber(table.capacity)} نفر</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-700 shadow-sm">
                      <Clock size={16} className="text-amber-500" />
                      <span dir="ltr">{table.reservation?.time}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-200/60 mt-3">
                    <button 
                      onClick={() => handleApprove(table)}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Check size={16} /> مشتری حاضر شد
                    </button>
                    <button 
                      onClick={() => handleCancel(table)}
                      className="py-2.5 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <X size={16} /> لغو
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-r-xl border-b border-slate-100">گیرنده</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100 w-1/2">متن پیامک</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">تاریخ و زمان</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-l-xl border-b border-slate-100">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {smsMessages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      هیچ پیامکی تاکنون ارسال نشده است.
                    </td>
                  </tr>
                ) : (
                  // Sort messages by descending date
                  [...smsMessages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sms => (
                    <tr key={sms.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-slate-800 font-medium" dir="ltr">
                        {sms.phoneNumber}
                      </td>
                      <td className="py-4 px-4 text-slate-600 whitespace-normal">
                         <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm leading-relaxed max-w-full">
                           {sms.message}
                         </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap" dir="ltr">
                        {new Intl.DateTimeFormat('fa-IR', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(sms.date))}
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 w-max">
                          <Check size={14} /> ارسال شده
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
