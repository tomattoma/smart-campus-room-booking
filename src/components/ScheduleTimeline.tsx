import { CalendarDays } from 'lucide-react';
import type { Room, Booking } from '@/types';
import { minToTime } from '@/utils/timeFormat';
import { slotsOverlap } from '@/utils/bookingRules';

interface ScheduleTimelineProps {
  room: Room;
  bookings: Booking[];
  pendingStart: number | null;
  pendingEnd: number | null;
  pendingAvailable: boolean | null;
}

const DAY_START = 420; // 7:00 AM
const DAY_END = 1260; // 9:00 PM
const RANGE = DAY_END - DAY_START;

export function ScheduleTimeline({ room, bookings, pendingStart, pendingEnd, pendingAvailable }: ScheduleTimelineProps) {
  const roomBookings = bookings.filter((b) => b.roomId === room.id).sort((a, b) => a.startMin - b.startMin);
  const hours: number[] = [];
  for (let h = DAY_START; h <= DAY_END; h += 60) hours.push(h);

  const pendingLeft = pendingStart !== null ? Math.max(0, ((Math.max(pendingStart, DAY_START) - DAY_START) / RANGE) * 100) : 0;
  const pendingWidth = pendingStart !== null && pendingEnd !== null
    ? Math.min(100 - pendingLeft, ((Math.min(pendingEnd, DAY_END) - Math.max(pendingStart, DAY_START)) / RANGE) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <CalendarDays className="h-5 w-5 text-blue-500" /> Today's Schedule
        </h2>
        <span className="text-sm text-gray-500">{minToTime(DAY_START)} – {minToTime(DAY_END)}</span>
      </div>

      <p className="mt-1 text-sm text-gray-500">
        Visual timeline of existing bookings and your requested slot for <span className="font-semibold text-gray-700">{room.name}</span>.
      </p>

      <div className="mt-4 relative">
        {/* Hour axis */}
        <div className="relative h-6">
          {hours.map((h) => {
            const left = ((h - DAY_START) / RANGE) * 100;
            return (
              <div key={h} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${left}%` }}>
                <span className="text-[10px] font-medium text-gray-400">{minToTime(h)}</span>
              </div>
            );
          })}
        </div>

        {/* Track */}
        <div className="relative h-12 rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100/50">
          {/* Hour grid lines */}
          {hours.map((h) => {
            const left = ((h - DAY_START) / RANGE) * 100;
            return <div key={h} className="absolute top-0 bottom-0 w-px bg-gray-200/80" style={{ left: `${left}%` }} />;
          })}

          {/* Existing bookings */}
          {roomBookings.map((b) => {
            const left = ((Math.max(b.startMin, DAY_START) - DAY_START) / RANGE) * 100;
            const width = ((Math.min(b.endMin, DAY_END) - Math.max(b.startMin, DAY_START)) / RANGE) * 100;
            const isPendingOverlap =
              pendingStart !== null && pendingEnd !== null && slotsOverlap(pendingStart, pendingEnd, b.startMin, b.endMin);

            return (
              <div
                key={b.id}
                className={[
                  'group absolute top-1 bottom-1 rounded-md px-2 flex items-center overflow-hidden cursor-default transition-shadow',
                  isPendingOverlap ? 'bg-red-400/90 ring-2 ring-red-300' : 'bg-blue-400/80',
                ].join(' ')}
                style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%` }}
                title={`${b.title} — ${minToTime(b.startMin)} to ${minToTime(b.endMin)}`}
              >
                <span className="truncate text-[10px] font-semibold text-white">{b.title}</span>
              </div>
            );
          })}

          {/* Pending slot overlay */}
          {pendingStart !== null && pendingEnd !== null && pendingWidth > 0 && (
            <div
              className={[
                'absolute top-1 bottom-1 rounded-md border-2 border-dashed flex items-center justify-center px-1',
                pendingAvailable
                  ? 'bg-emerald-300/40 border-emerald-500'
                  : 'bg-red-300/30 border-red-500',
              ].join(' ')}
              style={{ left: `${pendingLeft}%`, width: `${pendingWidth}%` }}
              title={`Requested: ${minToTime(pendingStart)} – ${minToTime(pendingEnd)}`}
            >
              <span className={`text-[10px] font-bold ${pendingAvailable ? 'text-emerald-700' : 'text-red-700'}`}>
                {pendingWidth > 6 ? 'Your slot' : ''}
              </span>
            </div>
          )}

          {/* Empty state */}
          {roomBookings.length === 0 && pendingStart === null && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              No bookings yet — pick a time slot below.
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-blue-400/80" /> Existing booking
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border-2 border-dashed border-emerald-500 bg-emerald-300/40" /> Your slot (available)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border-2 border-dashed border-red-500 bg-red-300/30" /> Your slot (unavailable)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-red-400/90 ring-1 ring-red-300" /> Overlapping
          </span>
        </div>
      </div>
    </div>
  );
}
