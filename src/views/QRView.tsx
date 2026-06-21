import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, ScanLine } from 'lucide-react';
import { cn, formatNumber } from '../lib/utils';
import { Table } from '../types';

interface QRViewProps {
  tables: Table[];
}

export function QRView({ tables }: QRViewProps) {
  const [selectedTable, setSelectedTable] = useState<number>(tables[0]?.number || 1);
  const [color, setColor] = useState('#18181b'); // zinc-900

  // The simulated URL for the digital menu
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://restaurant.app';
  const qrValue = `${appUrl}/menu?table=${selectedTable}`;

  const colors = [
    { name: 'مشکی', value: '#18181b' },
    { name: 'نارنجی/آمبر', value: '#d97706' },
    { name: 'سبز تیره', value: '#065f46' },
    { name: 'آبی تیره', value: '#1e3a8a' },
  ];

  return (
    <div className="h-full flex flex-col items-center py-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl overflow-hidden border border-slate-100 flex flex-col md:flex-row mb-8">
        
        {/* Settings Panel (Right side in RTL) */}
        <div className="w-full md:w-1/2 p-8 bg-slate-50 border-e border-slate-100 no-print">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ScanLine className="text-amber-500" /> تولید منوی دیجیتال
            </h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              با انتخاب میز موردنظر، رنگ بارکد را تعیین کرده و لیبل میزها را چاپ کنید. مشتریان با اسکن بارکد به منوی میز مشخص شده هدایت می‌شوند.
            </p>
          </div>

          <div className="space-y-6">
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-2">انتخاب میز</label>
               <select
                 value={selectedTable}
                 onChange={(e) => setSelectedTable(Number(e.target.value))}
                 className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700"
               >
                 {tables.map(table => (
                   <option key={table.id} value={table.number}>میز شماره {table.number}</option>
                 ))}
               </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">رنگ بارکد</label>
              <div className="flex gap-4">
                {colors.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    title={c.name}
                    className={cn(
                      "w-8 h-8 rounded-full shadow-sm ring-offset-2 transition-all",
                      color === c.value ? "ring-2 ring-amber-500 scale-110" : "hover:scale-110 border border-slate-200"
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-200">
               <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 rounded-xl font-bold text-white hover:bg-zinc-800 transition-colors">
                 <Printer size={20} /> چاپ و دریافت همه بارکدها
               </button>
            </div>
          </div>
        </div>

        {/* Preview Panel (Left side in RTL) */}
        <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center bg-white no-print">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-zinc-900/5 rounded-full blur-3xl" />
            
            <h3 className="text-xl font-bold text-slate-800 mb-1 z-10 relative">رستوران پلاس</h3>
            <p className="text-sm font-medium text-slate-500 mb-6 z-10 relative">برای مشاهده منو، اسکن کنید</p>
            
            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 z-10 relative">
              <QRCodeCanvas 
                value={qrValue}
                size={220}
                bgColor={"#ffffff"}
                fgColor={color}
                level={"H"}
                includeMargin={false}
              />
            </div>
            
            <div className="mt-6 inline-block bg-slate-100 px-6 py-2 rounded-full font-bold text-slate-700 text-lg z-10 relative border border-slate-200">
              میز شماره {formatNumber(selectedTable)}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden container for printing all QR codes */}
      <div className="hidden print:grid print:grid-cols-2 print:gap-8 print:w-full print:p-8" id="print-all-qrs">
        {tables.map(table => (
          <div key={table.id} className="border-2 border-slate-800 p-8 flex flex-col items-center text-center break-inside-avoid">
            <h3 className="text-3xl font-bold text-slate-800 mb-2">رستوران پلاس</h3>
            <p className="text-xl font-bold text-slate-600 mb-8 border-b-2 border-slate-200 pb-4 w-full">برای مشاهده منو، اسکن کنید</p>
            
            <QRCodeCanvas 
              value={`${appUrl}/menu?table=${table.number}`}
              size={300}
              bgColor={"#ffffff"}
              fgColor={color}
              level={"H"}
              includeMargin={false}
            />
            
            <div className="mt-8 font-bold text-slate-900 text-4xl bg-slate-100 px-8 py-3 rounded-full border-2 border-slate-300">
              میز {formatNumber(table.number)}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
