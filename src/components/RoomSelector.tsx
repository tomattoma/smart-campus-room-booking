import { Building2, DoorClosed, Users, Layers, CheckCircle2, Lock, MapPin } from 'lucide-react';
import type { Room } from '@/types';

interface RoomSelectorProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelect: (room: Room) => void;
}

const typeStyles: Record<string, string> = {
  'Lecture Hall': 'bg-blue-50 text-blue-700 border-blue-200',
  Lab: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Study Room': 'bg-amber-50 text-amber-700 border-amber-200',
  'Conference Room': 'bg-rose-50 text-rose-700 border-rose-200',
  Auditorium: 'bg-cyan-50 text-cyan-700 border-cyan-200',
};

export function RoomSelector({ rooms, selectedRoomId, onSelect }: RoomSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => {
        const selected = room.id === selectedRoomId;
        return (
          <button
            key={room.id}
            onClick={() => onSelect(room)}
            disabled={room.blocked}
            aria-pressed={selected}
            className={[
              'group relative text-left rounded-2xl border-2 p-4 transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
              room.blocked
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                : selected
                ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:shadow-gray-100 cursor-pointer',
            ].join(' ')}
          >
            {selected && (
              <span className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm ring-2 ring-white">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            )}

            {room.blocked && (
              <span className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-sm ring-2 ring-white">
                <Lock className="h-3.5 w-3.5" />
              </span>
            )}

            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 leading-tight">{room.name}</h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" /> {room.building} · Floor {room.floor}
                </p>
              </div>
              <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeStyles[room.type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {room.type}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <DoorClosed className="h-3.5 w-3.5 text-gray-400" /> {room.code}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-gray-400" /> {room.capacity}
              </span>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-gray-400" /> {room.amenities.length} amenities
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {room.amenities.slice(0, 3).map((a) => (
                <span key={a} className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                  {a}
                </span>
              ))}
              {room.amenities.length > 3 && (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400">
                  +{room.amenities.length - 3}
                </span>
              )}
            </div>

            {room.blocked && (
              <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                <Building2 className="h-3.5 w-3.5" /> {room.blockedReason}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
