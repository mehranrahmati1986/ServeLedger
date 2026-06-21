import React, { useRef, useState } from 'react';
import { Download, Upload, ShieldCheck, DatabaseBackup, Store, Save, ToggleLeft, ToggleRight, LayoutList } from 'lucide-react';
import { RestaurantInfo, Product } from '../types';
import { cn } from '../lib/utils';

interface SettingsViewProps {
  restaurantInfo: RestaurantInfo;
  onUpdateRestaurantInfo: (info: RestaurantInfo) => void;
  onBackup: () => void;
  onRestore: (jsonData: string) => void;
  products: Product[];
  onUpdateProduct: (product: Product) => void;
}

export function SettingsView({ restaurantInfo, onUpdateRestaurantInfo, onBackup, onRestore, products, onUpdateProduct }: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [info, setInfo] = useState<RestaurantInfo>(restaurantInfo);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith('.json')) {
      alert("لطفا یک فایل JSON معتبر انتخاب کنید.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        onRestore(result);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset input
        }
      } catch (err) {
        alert("خطا در خواندن فایل.");
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreClick = () => {
    const confirmation = confirm("هشدار: بازیابی اطلاعات باعث جایگزینی داده‌های فعلی با اطلاعات فایل پشتیبان می‌شود. آیا مطمئن هستید؟");
    if (confirmation && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRestaurantInfo(info);
    alert('اطلاعات رستوران با موفقیت ذخیره شد.');
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم فایل نباید بیشتر از ۲ مگابایت باشد.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setInfo({ ...info, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-8">
      <div className="shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">تنظیمات</h2>
          <p className="text-slate-500 mt-1">مدیریت اطلاعات رستوران و تهیه نسخه پشتیبان</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Store size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">اطلاعات رستوران</h3>
            <p className="text-sm text-slate-500">این اطلاعات در فاکتورهای چاپی و منوی دیجیتال نمایش داده می‌شود</p>
          </div>
        </div>

        <form onSubmit={handleSaveInfo} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">نام رستوران</label>
            <input
              type="text"
              required
              value={info.name}
              onChange={e => setInfo({...info, name: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-700 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">لوگوی رستوران</label>
            <div className="flex items-center gap-4">
              {info.logo && (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm flex items-center justify-center">
                  <img src={info.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
              <div className="flex-1 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full bg-slate-50 border border-slate-200 border-dashed rounded-xl py-3 px-4 flex items-center justify-center text-slate-600 font-medium hover:bg-slate-100 transition-colors">
                  <Upload size={18} className="ml-2" />
                  آپلود تصویر جدید
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">شماره تماس</label>
            <input
              type="text"
              value={info.phone}
              onChange={e => setInfo({...info, phone: e.target.value})}
              dir="ltr"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-700 font-medium text-left"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">آدرس فیزیکی</label>
            <input
              type="text"
              value={info.address}
              onChange={e => setInfo({...info, address: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-700 font-medium"
            />
          </div>
          
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
              <Save size={18} /> ذخیره اطلاعات
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-start gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Download size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">تهیه نسخه پشتیبان (Backup)</h3>
            <p className="text-sm text-slate-500 mt-2 mb-4 leading-relaxed">
              با استفاده از این امکان تمامی اطلاعات سیستم شامل محصولات، سفارش‌ها، مشتریان، پرسنل و وضعیت میزها به صورت یک فایل یکپارچه (JSON) ذخیره می‌شود. پیشنهاد می‌شود به صورت دوره‌ای اقدام به تهیه نسخه پشتیبان کنید.
            </p>
            <button 
              onClick={onBackup}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl font-bold shadow-sm transition-all text-sm w-full sm:w-auto"
            >
              <DatabaseBackup size={18} />
              دانلود فایل پشتیبان 
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-start gap-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <Upload size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">بازیابی اطلاعات (Restore)</h3>
            <p className="text-sm text-slate-500 mt-2 mb-4 leading-relaxed">
              این قابلیت به شما کمک می‌کند تا اطلاعات قبلی خود را که قالب فایل (JSON) ذخیره کرده‌اید برگردانید. 
              <br /> 
              <span className="font-bold text-rose-600 inline-flex items-center gap-1 mt-1"><ShieldCheck size={14}/> بازگردانی باعث حذف اطلاعات فعلی می‌شود.</span>
            </p>
            
            <input 
              type="file" 
              accept=".json,application/json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            <button 
              onClick={handleRestoreClick}
              className="flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 py-3 px-6 rounded-xl font-bold shadow-sm transition-all text-sm w-full sm:w-auto"
            >
              <DatabaseBackup size={18} className="rotate-180" />
              بازیابی از فایل 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
