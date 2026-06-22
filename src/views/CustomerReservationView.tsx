import React, { useState } from 'react';
import { Table } from '../types';
import { CalendarDays, Clock, Users, CheckCircle2 } from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';

interface CustomerReservationViewProps {
  tables: Table[];
  onReserve: (tableId: string, customerName: string, phone: string, date: string, time: string) => void;
}

export function CustomerReservationView({ tables, onReserve }: CustomerReservationViewProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: ''
  });

  const [isSuccess, setIsSuccess] = useState(false);

  const availableTables = tables.filter(t => t.status === 'available');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !formData.name || !formData.phone || !formData.date || !formData.time) return;
    
    onReserve(selectedTable, formData.name, formData.phone, formData.date, formData.time);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">رزرو با موفقیت ثبت شد</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            منتظر دیدار شما در تاریخ {formData.date} ساعت {formData.time} هستیم.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-8 pb-20 px-4 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">رزرو آنلاین میز</h1>
          <p className="text-slate-500">برای رزرو میز مورد نظر خود اطلاعات زیر را تکمیل کنید</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="flex border-b border-slate-100">
             <div className={cn("flex-1 text-center py-4 font-bold border-b-2 text-sm md:text-base transition-colors", step === 1 ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 bg-slate-50")}>
               ۱. زمان حضور و اطلاعات تماس
             </div>
             <div className={cn("flex-1 text-center py-4 font-bold border-b-2 text-sm md:text-base transition-colors", step === 2 ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 bg-slate-50")}>
               ۲. انتخاب میز
             </div>
           </div>

           <div className="p-6 md:p-8">
             {step === 1 && (
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">نام و نام خانوادگی</label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all text-slate-700"
                          placeholder="مثال: علی محمدی"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">شماره تماس</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all text-slate-700 font-mono text-left"
                          dir="ltr"
                          placeholder="09123456789"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><CalendarDays size={16}/> تاریخ</label>
                        <input
                          type="date"
                          required
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all text-slate-700 font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Clock size={16}/> ساعت</label>
                        <input
                          type="time"
                          required
                          value={formData.time}
                          onChange={e => setFormData({...formData, time: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all text-slate-700 font-mono"
                          dir="ltr"
                        />
                      </div>
                   </div>

                   <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
                      <button 
                         type="button"
                         onClick={() => {
                           if (formData.name && formData.phone && formData.date && formData.time) {
                             setStep(2);
                           } else {
                             alert('لطفا تمامی اطلاعات را تکمیل کنید.');
                           }
                         }}
                         className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors shadow-sm"
                      >
                         مرحله بعد: انتخاب میز
                      </button>
                   </div>
                </div>
             )}

             {step === 2 && (
                <form onSubmit={handleSubmit}>
                   <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <Users size={20} className="text-amber-500" />
                     میزهای قابل رزرو در {formData.date}
                   </h3>
                   {availableTables.length === 0 ? (
                     <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500">متاسفانه برای زمان انتخاب شده میز خالی موجود نیست.</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {availableTables.map(table => (
                          <button
                            type="button"
                            key={table.id}
                            onClick={() => setSelectedTable(table.id)}
                            className={cn(
                              "p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2",
                              selectedTable === table.id 
                                ? "bg-amber-50 border-amber-500 ring-1 ring-amber-500" 
                                : "bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30"
                            )}
                          >
                             <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-1", selectedTable === table.id ? "bg-amber-200 text-amber-800" : "bg-slate-100 text-slate-600")}>
                               <Users size={20} />
                             </div>
                             <div className="font-bold text-slate-800">میز {formatNumber(table.number)}</div>
                             <div className="text-xs font-medium text-slate-500">ظرفیت: {formatNumber(table.capacity)} نفر</div>
                          </button>
                        ))}
                     </div>
                   )}

                   <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
                      <button 
                         type="button"
                         onClick={() => setStep(1)}
                         className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                      >
                         مرحله قبل
                      </button>
                      <button 
                         type="submit"
                         disabled={!selectedTable}
                         className="px-8 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                         ثبت نهایی رزرو
                      </button>
                   </div>
                </form>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
