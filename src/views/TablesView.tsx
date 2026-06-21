import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Armchair,
  Ban,
  CheckCircle2,
  Clock,
  Grid3X3,
  Layers3,
  Link as LinkIcon,
  Maximize2,
  MousePointer2,
  Plus,
  ScanLine,
  Sparkles,
  Unlink,
  Users,
  X
} from 'lucide-react';
import { Room, Table } from '../types';
import { cn, formatNumber } from '../lib/utils';

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

const DEFAULT_ROOM_ID = 'default-room';
const CANVAS_PADDING = 64;
const GRID_STEP = 24;
const BASE_TABLE_WIDTH = 84;
const TABLE_HEIGHT = 96;

const getTableSize = (capacity: number) => ({
  width: Math.max(BASE_TABLE_WIDTH, BASE_TABLE_WIDTH * Math.max(1, capacity)),
  height: TABLE_HEIGHT
});

const getDefaultPosition = (index: number, capacity: number) => {
  const size = getTableSize(capacity);
  const row = Math.floor(index / 3);
  const col = index % 3;

  return {
    x: CANVAS_PADDING + col * 320,
    y: CANVAS_PADDING + row * (size.height + 86)
  };
};

const getStatusCopy = (status: Table['status']) => {
  if (status === 'available') return 'آزاد';
  if (status === 'reserved') return 'رزرو شده';
  return 'در حال استفاده';
};

const getStatusClasses = (status: Table['status']) => {
  if (status === 'available') {
    return {
      card: 'border-emerald-200 bg-emerald-50/70',
      accent: 'bg-emerald-400',
      icon: 'bg-emerald-100 text-emerald-700',
      pill: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      canvas: 'from-emerald-50 to-white border-emerald-300',
      text: 'text-emerald-700'
    };
  }

  if (status === 'reserved') {
    return {
      card: 'border-sky-200 bg-sky-50/70',
      accent: 'bg-sky-400',
      icon: 'bg-sky-100 text-sky-700',
      pill: 'bg-sky-100 text-sky-700 border-sky-200',
      canvas: 'from-sky-50 to-white border-sky-300',
      text: 'text-sky-700'
    };
  }

  return {
    card: 'border-amber-200 bg-amber-50/80',
    accent: 'bg-amber-400',
    icon: 'bg-amber-100 text-amber-700',
    pill: 'bg-amber-100 text-amber-800 border-amber-200',
    canvas: 'from-amber-50 to-white border-amber-300',
    text: 'text-amber-700'
  };
};

const renderSeatDots = (capacity: number, status: Table['status']) => {
  const visibleSeats = Math.min(capacity, 12);
  const topSeats = Math.ceil(visibleSeats / 2);
  const bottomSeats = visibleSeats - topSeats;
  const statusClass = getStatusClasses(status).accent;

  return (
    <>
      <div className="absolute -top-2 left-4 right-4 flex justify-around">
        {Array.from({ length: topSeats }).map((_, index) => (
          <span key={`top-${index}`} className={cn('h-4 w-4 rounded-full border-2 border-white shadow-sm', statusClass)} />
        ))}
      </div>
      <div className="absolute -bottom-2 left-4 right-4 flex justify-around">
        {Array.from({ length: bottomSeats }).map((_, index) => (
          <span key={`bottom-${index}`} className={cn('h-4 w-4 rounded-full border-2 border-white shadow-sm', statusClass)} />
        ))}
      </div>
    </>
  );
};

export function TablesView({
  tables,
  rooms = [],
  onAddTable,
  onMergeTables,
  onUnmergeTables,
  onUpdateTablePosition,
  onAddRoom,
  onUpdateTableRoom
}: TablesViewProps) {
  const displayRooms = rooms.length > 0 ? rooms : [{ id: DEFAULT_ROOM_ID, name: 'سالن اصلی' }];
  const [activeRoomId, setActiveRoomId] = useState<string>(displayRooms[0]?.id || DEFAULT_ROOM_ID);
  const [viewMode, setViewMode] = useState<'grid' | 'canvas'>('canvas');
  const [zoom, setZoom] = useState<number>(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');
  const [newRoomName, setNewRoomName] = useState('');
  const [mergeMasterId, setMergeMasterId] = useState('');
  const [mergeChildId, setMergeChildId] = useState('');
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!displayRooms.some(room => room.id === activeRoomId)) {
      setActiveRoomId(displayRooms[0]?.id || DEFAULT_ROOM_ID);
    }
  }, [activeRoomId, displayRooms]);

  const stats = useMemo(() => ({
    total: tables.length,
    seats: tables.reduce((sum, table) => sum + table.capacity, 0),
    free: tables.filter(table => table.status === 'available').length,
    reserved: tables.filter(table => table.status === 'reserved').length,
    occupied: tables.filter(table => table.status === 'occupied').length
  }), [tables]);

  const getRoomTables = (roomId: string) => tables.filter(table => {
    const isDefaultRoom = roomId === displayRooms[0]?.id;
    return table.roomId === roomId || (!table.roomId && isDefaultRoom);
  });

  const getPosition = (table: Table, index: number) => table.position || getDefaultPosition(index, table.capacity);

  const getCanvasSize = (roomTables: Table[]) => {
    const max = roomTables.reduce((acc, table, index) => {
      const position = getPosition(table, index);
      const size = getTableSize(table.capacity);
      return {
        x: Math.max(acc.x, position.x + size.width + CANVAS_PADDING),
        y: Math.max(acc.y, position.y + size.height + CANVAS_PADDING)
      };
    }, { x: 1120, y: 620 });

    return {
      width: Math.ceil(max.x / GRID_STEP) * GRID_STEP,
      height: Math.ceil(max.y / GRID_STEP) * GRID_STEP
    };
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber || !newTableCapacity || !onAddTable) return;

    const roomId = activeRoomId === DEFAULT_ROOM_ID ? undefined : activeRoomId;
    onAddTable(parseInt(newTableCapacity, 10), parseInt(newTableNumber, 10), roomId);
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

  const handleDropOnRoom = (event: React.DragEvent<HTMLDivElement>, room: Room) => {
    event.preventDefault();
    if (!draggingTable || !onUpdateTablePosition) return;

    const layer = event.currentTarget.querySelector('[data-canvas-layer="true"]') as HTMLElement | null;
    if (!layer) return;

    const roomTables = getRoomTables(room.id);
    const dragged = tables.find(table => table.id === draggingTable);
    if (!dragged) return;

    const layerRect = layer.getBoundingClientRect();
    const offset = dragOffset.current || { x: getTableSize(dragged.capacity).width / 2, y: TABLE_HEIGHT / 2 };
    let x = (event.clientX - layerRect.left) / zoom - offset.x;
    let y = (event.clientY - layerRect.top) / zoom - offset.y;

    x = Math.round(x / GRID_STEP) * GRID_STEP;
    y = Math.round(y / GRID_STEP) * GRID_STEP;

    const leftOverflow = Math.min(0, x - CANVAS_PADDING);
    const topOverflow = Math.min(0, y - CANVAS_PADDING);
    const shiftX = leftOverflow < 0 ? Math.abs(leftOverflow) + CANVAS_PADDING : 0;
    const shiftY = topOverflow < 0 ? Math.abs(topOverflow) + CANVAS_PADDING : 0;

    if (shiftX || shiftY) {
      roomTables.forEach((table, index) => {
        if (table.id === draggingTable) return;
        const position = getPosition(table, index);
        onUpdateTablePosition(table.id, position.x + shiftX, position.y + shiftY);
      });
    }

    onUpdateTablePosition(draggingTable, Math.max(CANVAS_PADDING, x + shiftX), Math.max(CANVAS_PADDING, y + shiftY));
    if (onUpdateTableRoom && room.id !== DEFAULT_ROOM_ID) {
      onUpdateTableRoom(draggingTable, room.id);
    }

    setDraggingTable(null);
    dragOffset.current = null;
  };

  return (
    <div className="h-full overflow-y-auto pb-8">
      <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-950/12">
        <div className="relative p-5 sm:p-6">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),transparent_36%),linear-gradient(220deg,rgba(20,184,166,0.18),transparent_38%)]" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-amber-200">
                <Layers3 size={14} />
                طراحی پلان سالن
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">چیدمان هوشمند میزها</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-white/62">
                میزها بر اساس ظرفیت، عرض طبیعی می‌گیرند؛ بوم چیدمان هم با حرکت میز به هر جهت بزرگ‌تر می‌شود.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[34rem]">
              {[
                { label: 'میز', value: stats.total, icon: Armchair, tone: 'text-amber-200' },
                { label: 'صندلی', value: stats.seats, icon: Users, tone: 'text-cyan-200' },
                { label: 'آزاد', value: stats.free, icon: CheckCircle2, tone: 'text-emerald-200' },
                { label: 'مشغول', value: stats.occupied, icon: Ban, tone: 'text-rose-200' }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
                    <div className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10', item.tone)}>
                      <Icon size={19} />
                    </div>
                    <p className="text-2xl font-black">{formatNumber(item.value)}</p>
                    <p className="text-xs font-bold text-white/48">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/86 p-3 shadow-sm backdrop-blur xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setViewMode('canvas')}
              className={cn('flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-black transition', viewMode === 'canvas' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900')}
            >
              <MousePointer2 size={17} />
              پلان
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn('flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-black transition', viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900')}
            >
              <Grid3X3 size={17} />
              کارت‌ها
            </button>
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button onClick={() => setZoom(value => Math.max(0.55, value - 0.1))} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">-</button>
            <span className="w-14 text-center text-xs font-black text-slate-700" dir="ltr">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(value => Math.min(1.8, value + 0.1))} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">+</button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setIsMergeModalOpen(true)} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm hover:border-indigo-200 hover:text-indigo-700">
            <LinkIcon size={18} />
            ادغام میزها
          </button>
          <button onClick={() => setIsAddRoomModalOpen(true)} className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white">
            <Plus size={18} />
            سالن جدید
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-black text-white">
            <Plus size={18} />
            میز جدید
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {displayRooms.map(room => {
          const roomTables = getRoomTables(room.id);
          const isActive = activeRoomId === room.id;
          return (
            <button
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              className={cn(
                'flex min-h-11 shrink-0 items-center gap-3 rounded-xl border px-4 text-sm font-black transition',
                isActive ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/12' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300'
              )}
            >
              <span>{room.name}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-black', isActive ? 'bg-white/15 text-amber-200' : 'bg-slate-100 text-slate-500')}>
                {formatNumber(roomTables.length)}
              </span>
            </button>
          );
        })}
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {getRoomTables(activeRoomId).map((table, index) => {
            const status = getStatusClasses(table.status);
            const size = getTableSize(table.capacity);
            return (
              <article key={table.id} className={cn('overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/8', status.card)}>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Table</p>
                    <h3 className="mt-1 text-2xl font-black text-slate-950">میز {formatNumber(table.number)}</h3>
                  </div>
                  <span className={cn('rounded-full border px-3 py-1 text-xs font-black', status.pill)}>
                    {getStatusCopy(table.status)}
                  </span>
                </div>

                <div className="mb-5 overflow-x-auto rounded-2xl bg-white/65 p-4">
                  <div className="relative mx-auto" style={{ width: Math.min(size.width, 360), height: 74 }}>
                    <div className={cn('absolute inset-x-0 top-3 h-12 rounded-2xl border bg-gradient-to-br shadow-inner', status.canvas)} />
                    {renderSeatDots(Math.min(table.capacity, 8), table.status)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/72 p-3">
                    <p className="text-lg font-black text-slate-950">{formatNumber(table.capacity)}</p>
                    <p className="text-[11px] font-bold text-slate-400">ظرفیت</p>
                  </div>
                  <div className="rounded-xl bg-white/72 p-3">
                    <p className="text-lg font-black text-slate-950">{formatNumber(Math.round(size.width))}</p>
                    <p className="text-[11px] font-bold text-slate-400">عرض پلان</p>
                  </div>
                  <div className="rounded-xl bg-white/72 p-3">
                    <p className="text-lg font-black text-slate-950">{formatNumber(index + 1)}</p>
                    <p className="text-[11px] font-bold text-slate-400">ردیف</p>
                  </div>
                </div>

                {table.mergedWith && table.mergedWith.length > 0 && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">
                    <span>ادغام با میزهای {tables.filter(item => table.mergedWith?.includes(item.id)).map(item => item.number).join(', ')}</span>
                    {onUnmergeTables && (
                      <button onClick={() => onUnmergeTables(table.id)} className="rounded-lg p-1 hover:bg-indigo-100" title="لغو ادغام">
                        <Unlink size={15} />
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {displayRooms.map(room => {
            const roomTables = getRoomTables(room.id);
            const canvas = getCanvasSize(roomTables);

            return (
              <section key={room.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-950 px-5 py-4 text-white lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-amber-200">
                      <ScanLine size={21} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black">{room.name}</h3>
                      <p className="text-xs font-bold text-white/45">{formatNumber(roomTables.length)} میز در این سالن</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black text-white/65">
                    <span className="rounded-full bg-white/10 px-3 py-1">بوم {formatNumber(canvas.width)} × {formatNumber(canvas.height)}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1">مقیاس {formatNumber(Math.round(zoom * 100))}٪</span>
                  </div>
                </div>

                <div
                  className="relative h-[560px] overflow-auto bg-slate-100"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDropOnRoom(event, room)}
                >
                  <div className="relative" style={{ width: canvas.width * zoom, height: canvas.height * zoom }}>
                    <div
                      data-canvas-layer="true"
                      className="absolute left-0 top-0 overflow-hidden rounded-b-3xl"
                      style={{
                        width: canvas.width,
                        height: canvas.height,
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        backgroundImage: 'radial-gradient(rgba(100,116,139,0.32) 1.4px, transparent 1.4px)',
                        backgroundSize: `${GRID_STEP}px ${GRID_STEP}px`
                      }}
                    >
                      <div className="absolute inset-6 rounded-3xl border border-dashed border-slate-300/80" />
                      {roomTables.map((table, index) => {
                        const position = getPosition(table, index);
                        const size = getTableSize(table.capacity);
                        const status = getStatusClasses(table.status);

                        return (
                          <div
                            key={table.id}
                            draggable
                            onDragStart={(event) => {
                              setDraggingTable(table.id);
                              const rect = event.currentTarget.getBoundingClientRect();
                              dragOffset.current = {
                                x: (event.clientX - rect.left) / zoom,
                                y: (event.clientY - rect.top) / zoom
                              };
                              event.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                              setDraggingTable(null);
                              dragOffset.current = null;
                            }}
                            className={cn(
                              'absolute cursor-grab select-none rounded-2xl border-2 bg-gradient-to-br p-3 shadow-xl shadow-slate-950/10 transition active:cursor-grabbing',
                              status.canvas,
                              draggingTable === table.id && 'opacity-75 ring-4 ring-amber-300'
                            )}
                            style={{
                              left: position.x,
                              top: position.y,
                              width: size.width,
                              height: size.height,
                              zIndex: draggingTable === table.id ? 40 : 10
                            }}
                          >
                            {renderSeatDots(table.capacity, table.status)}
                            <div className="relative z-10 flex h-full items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-400">میز</p>
                                <h4 className="text-xl font-black text-slate-950">{formatNumber(table.number)}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn('rounded-full border px-2 py-1 text-[11px] font-black', status.pill)}>
                                  {getStatusCopy(table.status)}
                                </span>
                                <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-white/80 px-2 text-xs font-black text-slate-700 shadow-sm">
                                  <Users size={13} />
                                  {formatNumber(table.capacity)}
                                </span>
                              </div>
                            </div>

                            {table.mergedWith && table.mergedWith.length > 0 && (
                              <span className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 text-indigo-700 shadow-sm">
                                <LinkIcon size={15} />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {isMergeModalOpen && (
        <Modal title="ادغام میزها" onClose={() => setIsMergeModalOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (onMergeTables && mergeMasterId && mergeChildId && mergeMasterId !== mergeChildId) {
                onMergeTables(mergeMasterId, mergeChildId);
                setMergeMasterId('');
                setMergeChildId('');
                setIsMergeModalOpen(false);
              }
            }}
            className="space-y-4"
          >
            <SelectField label="میز اصلی" value={mergeMasterId} onChange={setMergeMasterId} placeholder="انتخاب میز اصلی" tables={tables} />
            <SelectField label="میز دوم" value={mergeChildId} onChange={setMergeChildId} placeholder="انتخاب میز دوم" tables={tables.filter(table => table.id !== mergeMasterId)} />
            <button disabled={!mergeMasterId || !mergeChildId || mergeMasterId === mergeChildId} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-black text-white disabled:opacity-45">
              <LinkIcon size={17} />
              تایید ادغام
            </button>
          </form>
        </Modal>
      )}

      {isAddRoomModalOpen && (
        <Modal title="سالن جدید" onClose={() => setIsAddRoomModalOpen(false)}>
          <form onSubmit={handleAddRoomSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">نام سالن</span>
              <input value={newRoomName} onChange={event => setNewRoomName(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100" placeholder="مثال: تراس، سالن VIP" />
            </label>
            <button disabled={!newRoomName} className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white disabled:opacity-45">افزودن سالن</button>
          </form>
        </Modal>
      )}

      {isAddModalOpen && (
        <Modal title="میز جدید" onClose={() => setIsAddModalOpen(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">شماره میز</span>
              <input value={newTableNumber} onChange={event => setNewTableNumber(event.target.value)} type="number" min="1" dir="ltr" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100" placeholder="12" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">ظرفیت</span>
              <input value={newTableCapacity} onChange={event => setNewTableCapacity(event.target.value)} type="number" min="1" dir="ltr" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100" placeholder="4" />
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 4, 6, 8, 10, 12, 16].map(capacity => (
                <button
                  key={capacity}
                  type="button"
                  onClick={() => setNewTableCapacity(String(capacity))}
                  className={cn('h-10 rounded-xl border text-sm font-black', newTableCapacity === String(capacity) ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600')}
                >
                  {formatNumber(capacity)}
                </button>
              ))}
            </div>
            <button disabled={!newTableNumber || !newTableCapacity} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-black text-white disabled:opacity-45">
              <Plus size={17} />
              افزودن میز
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  tables
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  tables: Table[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-700">{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100">
        <option value="">{placeholder}</option>
        {tables.map(table => (
          <option key={table.id} value={table.id}>
            میز {table.number} - ظرفیت {table.capacity}
          </option>
        ))}
      </select>
    </label>
  );
}
