import { Clock, ArrowRight, CalendarClock } from 'lucide-react';
import type { Room, Booking, ValidationResult } from '@/types';
import { minToTime, generateTimeOptions } from '@/utils/timeFormat';

interface BookingFormProps {
  room: Room;
  startMin: number;
  endMin: number;
  currentMin: number;
  bookings: Booking[];
  validation: ValidationResult | null;
  onStartTimeChange: (min: number) => void;
  onEndTimeChange: (min: number) => void;
}

export function BookingForm({
  room,
  startMin,
  endMin,
  currentMin,
  bookings,
  validation,
  onStartTimeChange,
  onEndTimeChange,
}: BookingFormProps) {
  const timeOptions = generateTimeOptions();
  const duration = endMin - startMin;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Check a Time Slot</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            For <span className="font-semibold text-gray-700">{room.name}</span> ({room.code})
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-600">
          <CalendarClock className="h-4 w-4 text-gray-400" /> Now: {minToTime(currentMin)}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start-time" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4 text-gray-400" /> Start Time
          </label>
          <select
            id="start-time"
            value={startMin}
            onChange={(e) => onStartTimeChange(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {timeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="end-time" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4 text-gray-400" /> End Time
          </label>
          <select
            id="end-time"
            value={endMin}
            onChange={(e) => onEndTimeChange(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {timeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-4 py-3">
        <span className="text-sm text-gray-600">
          {minToTime(startMin)} <ArrowRight className="inline h-3.5 w-3.5 text-gray-400" /> {minToTime(endMin)}
        </span>
        <span className={`text-sm font-semibold ${validation?.available ? 'text-gray-700' : 'text-red-600'}`}>
          {duration > 0 ? `${duration} min` : '—'}
        </span>
      </div>

      {bookings.filter((b) => b.roomId === room.id).length > 0 && (
        <div className="mt-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Existing Bookings ({bookings.filter((b) => b.roomId === room.id).length})
          </h3>
          <ul className="space-y-1.5">
            {bookings
              .filter((b) => b.roomId === room.id)
              .sort((a, b) => a.startMin - b.startMin)
              .map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2"
                >
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{b.title}</span>
                    <span className="ml-2 text-xs text-gray-400">{b.bookedBy}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-gray-500">
                    {minToTime(b.startMin)} – {minToTime(b.endMin)}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
