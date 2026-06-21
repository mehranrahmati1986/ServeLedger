import React, { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageUploadModalProps {
  onClose: () => void;
  onUpload: (url: string) => void;
}

export function ImageUploadModal({ onClose, onUpload }: ImageUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onUpload(e.target.result as string);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    } else {
      alert("لطفا یک فایل تصویر معتبر انتخاب کنید.");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">آپلود تصویر</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div 
            className={cn(
              "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors",
              isDragging ? "border-amber-500 bg-amber-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-slate-200/50 flex items-center justify-center mb-4 text-slate-400">
              <UploadCloud size={32} />
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">برای انتخاب تصویر کلیک کنید</p>
            <p className="text-xs text-slate-500">یا فایل را اینجا رها کنید (Drag & Drop)</p>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
