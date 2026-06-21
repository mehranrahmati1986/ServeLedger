import React, { useMemo, useState, useRef } from 'react';
import { Table, Room } from '../types';
import { cn } from '../lib/utils';
import { Users, Armchair, Plus, X, Link as LinkIcon, Unlink, CheckCircle2, Clock, Ban, LayoutGrid, DragHandleDots2Icon, MousePointer2 } from 'lucide-react';

interface TablesViewProps {
  tables: Table[];
  rooms?: Room[];
  onAddTable?: (capacity: number, tableNumber: number, roomId?: string) => void;
  onMergeTables?: (masterTableId: string, mergedTableId: string) => void;
  onUnmergeTables?: (tableId: string) => void;
  onUpdateTablePosition?: (id: string, x: number, y: number) => void;
  onAddRoom?: (name: string) => void;
  onUpdateTableRoom?: (tableId: string, roomId: string) => void;
}

export function TablesView({ tables, rooms = [], onAddTable, onMergeTables, onUnmergeTables, onUpdateTablePosition, onAddRoom, onUpdateTableRoom }: TablesViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState<string>('');
  const [newTableCapacity, setNewTableCapacity] = useState<string>('4');
  
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeMasterId, setMergeMasterId] = useState<string>('');
  const [mergeChildId, setMergeChildId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'canvas'>('grid');
  const [zoom, setZoom] = useState<number>(1);
  
  const [activeRoomId, setActiveRoomId] = useState<string>(rooms[0]?.id || '');
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  React.useEffect(() => {
    if (!activeRoomId && rooms.length > 0) {
      setActiveRoomId(rooms[0].id);
    }
  }, [rooms, activeRoomId]);

  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const dragOffset = useRef<{x: number, y: number} | null>(null);

  const stats = useMemo(() => {
    return {
      total: tables.length,
      free: tables.filter(t => t.status === 'available').length,
      reserved: tables.filter(t => t.status === 'reserved').length,
      occupied: tables.filter(t => t.status === 'occupied').length,
    };
  }, [tables]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber || !newTableCapacity) return;
    
    if (onAddTable) {
      onAddTable(parseInt(newTableCapacity, 10), parseInt(newTableNumber, 10), activeRoomId || undefined);
    }
    
    setIsAddModalOpen(false);
    setNewTableNumber('');
    setNewTableCapacity('4');
  };

  const handleAddRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName || !onAddRoom) return;
    onAddRoom(newRoomName);
    setIsAddRoomModalOpen(false);
    setNewRoomName('');
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">وضعیت میزها</h2>
          <p className="text-slate-500 mt-1">مدیریت و مشاهده وضعیت پر و خالی بودن میزهای رستوران</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 shadow-inner mr-4">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                viewMode === 'grid' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <LayoutGrid size={18} />
              نمایش شبکه‌ای
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                viewMode === 'canvas' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <MousePointer2 size={18} />
              چیدمان روی نقشه
            </button>
          </div>
          <button 
            onClick={() => setIsMergeModalOpen(true)}
            className="bg-white border border-slate-200 text-slate-700 flex items-center gap-2 px-5 py-3 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm"
          >
            <LinkIcon size={20} />
            ادغام میزها
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-zinc-900 text-white flex items-center gap-2 px-5 py-3 rounded-xl hover:bg-zinc-800 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            میز جدید
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Armchair size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">کل میزها</p>
            <p className="text-xl font-black text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 shadow-sm border border-emerald-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-700">آزاد</p>
            <p className="text-xl font-black text-emerald-900">{stats.free}</p>
          </div>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 shadow-sm border border-blue-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700">رزرو شده</p>
            <p className="text-xl font-black text-blue-900">{stats.reserved}</p>
          </div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 shadow-sm border border-amber-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Ban size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-700">در حال استفاده</p>
            <p className="text-xl font-black text-amber-900">{stats.occupied}</p>
          </div>
        </div>
      </div>

      {/* Controls & Legend */}
      <div className="flex flex-wrap items-center justify-between w-full pb-2 gap-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 text-sm font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-sm border border-emerald-500"></span> آزاد
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-400 shadow-sm border border-blue-500"></span> رزرو شده
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm border border-amber-500"></span> در حال استفاده
          </div>
        </div>

        {/* Buttons & Zoom */}
        <div className="flex items-center gap-3">
          {viewMode === 'grid' && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all",
                    activeRoomId === room.id 
                      ? "bg-white text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  )}
                >
                  {room.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-slate-200 px-2 h-11">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors">
              <span className="text-xl leading-none font-bold">-</span>
            </button>
            <span className="text-sm font-bold text-slate-700 w-12 text-center" dir="ltr">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors">
              <span className="text-xl leading-none font-bold">+</span>
            </button>
          </div>

          <button
            onClick={() => setIsAddRoomModalOpen(true)}
            className="flex items-center justify-center h-11 px-5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 font-bold text-sm gap-2 shadow-sm whitespace-nowrap"
            title="افزودن سالن جدید"
          >
            <Plus size={18} />
            سالن جدید
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 origin-top-right transition-transform"
          style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
        >
          {tables.filter(t => t.roomId === activeRoomId || (!t.roomId && rooms[0]?.id === activeRoomId)).map(table => {
            const isOccupied = table.status === 'occupied';
            const isReserved = table.status === 'reserved';
            return (
              <div 
                key={table.id}
                className={cn(
                  "rounded-3xl p-6 shadow-sm border transition-all flex flex-col items-center justify-center relative overflow-hidden",
                  isOccupied 
                    ? "bg-amber-50 border-amber-200" 
                    : isReserved
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-slate-200 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                  isOccupied ? "bg-amber-500 text-amber-900" 
                     : isReserved ? "bg-blue-500 text-blue-900" 
                     : "bg-slate-100 text-slate-500"
                )}>
                  <Armchair size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">میز {table.number}</h3>
                <div className="flex items-center gap-1 text-sm font-medium text-slate-500">
                  <Users size={16} />
                  <span>{table.capacity} نفر</span>
                </div>
                
                <div className="mt-4 flex flex-col w-full gap-2 relative z-10">
                  <div className={cn(
                    "py-2 px-3 rounded-xl text-center text-sm font-bold",
                    isOccupied ? "bg-amber-200/50 text-amber-800" 
                       : isReserved ? "bg-blue-200/50 text-blue-800" 
                       : "bg-emerald-100 text-emerald-700"
                  )}>
                    {isOccupied ? 'در حال استفاده' : isReserved ? 'رزرو شده' : 'آزاد'}
                  </div>
                </div>

                {table.mergedWith && table.mergedWith.length > 0 && (
                  <div className="mt-2 flex flex-col w-full gap-2 relative z-10">
                    <div className="py-2 px-3 rounded-xl text-center text-xs font-bold bg-indigo-100 text-indigo-700 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <LinkIcon size={14} />
                        ادغام با: {tables.filter(t => table.mergedWith?.includes(t.id)).map(t => t.number).join(', ')}
                      </div>
                      {onUnmergeTables && (
                         <button onClick={(e) => { e.stopPropagation(); onUnmergeTables(table.id); }} className="hover:text-indigo-900" title="لغو ادغام">
                            <Unlink size={16} />
                         </button>
                      )}
                    </div>
                  </div>
                )}

                {isReserved && table.reservation && (
                  <div className="mt-3 text-center text-xs font-medium text-blue-700 bg-blue-100 px-3 py-2 rounded-xl w-full">
                     <p className="font-bold">{table.reservation.customerName}</p>
                     <p dir="ltr" className="font-mono mt-1">{table.reservation.date} - {table.reservation.time}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {rooms.map(room => (
            <div key={room.id} className="flex flex-col min-h-[300px] border-2 border-slate-200 rounded-3xl overflow-hidden shrink-0 bg-slate-50 relative">
              {/* Floating Room Label */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-3 bg-white/95 backdrop-blur border border-slate-200 shadow-sm rounded-xl px-4 py-2">
                 <span className="font-black text-slate-800 text-lg">{room.name}</span>
                 <div className="w-px h-4 bg-slate-300"></div>
                 <span className="text-xs font-bold text-slate-500">
                   {tables.filter(t => t.roomId === room.id || (!t.roomId && rooms[0]?.id === room.id)).length} میز
                 </span>
              </div>
              
              {/* Canvas Area */}
              <div 
                className="flex-1 relative overflow-hidden bg-slate-50"
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!draggingTable || !onUpdateTablePosition) return;
                  
                  const targetWrapper = (e.currentTarget.firstChild as HTMLElement);
                  const rect = targetWrapper.getBoundingClientRect();
                  
                  let x, y;
                  if (dragOffset.current) {
                    x = (e.clientX - rect.left - dragOffset.current.x) / zoom;
                    y = (e.clientY - rect.top - dragOffset.current.y) / zoom;
                  } else {
                    x = (e.clientX - rect.left - 75 * zoom) / zoom;
                    y = (e.clientY - rect.top - 75 * zoom) / zoom;
                  }
                  
                  // Auto-align (snap to grid)
                  x = Math.max(0, Math.round(x / 30) * 30);
                  y = Math.max(0, Math.round(y / 30) * 30);
                  
                  onUpdateTablePosition(draggingTable, x, y);
                  if (onUpdateTableRoom) {
                    onUpdateTableRoom(draggingTable, room.id);
                  }
                  
                  setDraggingTable(null);
                  dragOffset.current = null;
                }}
              >
                <div 
                  className="absolute inset-0 origin-top-left transition-transform duration-200" 
                  style={{ 
                    transform: `scale(${zoom})`, 
                    width: `${100 / zoom}%`, 
                    height: `${100 / zoom}%` 
                  }}
                >
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
                  {tables.filter(t => t.roomId === room.id || (!t.roomId && rooms[0]?.id === room.id)).map((table, index) => {
                  const isOccupied = table.status === 'occupied';
                  const isReserved = table.status === 'reserved';
                  const tableWidth = Math.max(120, 100 + table.capacity * 10);
                  
                  // Calculate a default deterministic grid position
                  const cols = 4;
                  const defaultX = (index % cols) * 160 + 50;
                  const defaultY = Math.floor(index / cols) * 160 + 50;
                  
                  return (
                    <div
                      key={table.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggingTable(table.id);
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        dragOffset.current = {
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top
                        };
                      }}
                      onDragEnd={() => setDraggingTable(null)}
                      className={cn(
                        "absolute cursor-grab active:cursor-grabbing p-4 shadow-md border-2 transition-colors flex flex-col items-center justify-center rounded-2xl select-none",
                        isOccupied 
                          ? "bg-amber-50 border-amber-300" 
                          : isReserved
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white border-slate-300 hover:border-slate-400"
                      )}
                      style={{
                        left: table.position?.x ?? defaultX,
                        top: table.position?.y ?? defaultY,
                        width: `${tableWidth}px`,
                        zIndex: draggingTable === table.id ? 50 : 10,
                        opacity: draggingTable === table.id ? 0.8 : 1
                      }}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="font-bold text-slate-800 text-sm">میز {table.number}</span>
                        <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          <Users size={12} />
                          <span>{table.capacity}</span>
                        </div>
                      </div>
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mb-2",
                        isOccupied ? "bg-amber-100 text-amber-700" 
                           : isReserved ? "bg-blue-100 text-blue-700" 
                           : "bg-slate-100 text-slate-500"
                      )}>
                        <Armchair size={24} />
                      </div>
                      <div className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-md text-center w-full truncate",
                        isOccupied ? "bg-amber-200 text-amber-800" 
                           : isReserved ? "bg-blue-200 text-blue-800" 
                           : "bg-emerald-100 text-emerald-700"
                      )}>
                        {isOccupied ? 'در حال استفاده' : isReserved ? table.reservation?.customerName || 'رزرو شده' : 'آزاد'}
                      </div>
                      {table.mergedWith && table.mergedWith.length > 0 && (
                        <div className="absolute -top-3 -right-3 bg-indigo-100 text-indigo-700 border border-indigo-200 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                          <LinkIcon size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merge Tables Modal */}
      {isMergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">ادغام میزها</h2>
              <button 
                onClick={() => {
                  setIsMergeModalOpen(false);
                  setMergeMasterId('');
                  setMergeChildId('');
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (onMergeTables && mergeMasterId && mergeChildId && mergeMasterId !== mergeChildId) {
                onMergeTables(mergeMasterId, mergeChildId);
                setIsMergeModalOpen(false);
                setMergeMasterId('');
                setMergeChildId('');
              }
            }} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">میز اصلی (میز رزرو شده یا اصلی)</label>
                  <select
                    required
                    value={mergeMasterId}
                    onChange={e => setMergeMasterId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-700"
                  >
                    <option value="">انتخاب میز اصلی...</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>میز {t.number} (ظرفیت: {t.capacity})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">میز دوم جهت ادغام</label>
                  <select
                    required
                    value={mergeChildId}
                    onChange={e => setMergeChildId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-700"
                  >
                    <option value="">انتخاب میز دوم...</option>
                    {tables.filter(t => t.id !== mergeMasterId).map(t => (
                      <option key={t.id} value={t.id}>میز {t.number} (ظرفیت: {t.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!mergeMasterId || !mergeChildId || mergeMasterId === mergeChildId}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                >
                  <LinkIcon size={18} /> تایید و ادغام میزها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">تعریف سالن/بخش جدید</h2>
              <button 
                onClick={() => setIsAddRoomModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddRoomSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">نام سالن/بخش</label>
                  <input
                    type="text"
                    required
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow text-slate-700"
                    placeholder="مثال: تراس، روف گاردن، سالن VIP"
                  />
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!newRoomName}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  افزودن سالن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">تعریف میز جدید</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">شماره میز</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTableNumber}
                    onChange={e => setNewTableNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 text-left"
                    dir="ltr"
                    placeholder="مثال: 12"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">ظرفیت (نفر)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTableCapacity}
                    onChange={e => setNewTableCapacity(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 text-left"
                    dir="ltr"
                    placeholder="مثال: 4"
                  />
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                >
                  افزودن میز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
