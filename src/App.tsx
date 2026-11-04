import { useState, useMemo, useEffect, useCallback } from 'react';
import { GraduationCap, Sparkles, Info, CheckCircle2, CalendarCheck } from 'lucide-react';
import { rooms, initialBookings } from '@/data/mockData';
import { validateBooking } from '@/utils/booking';
import { getCurrentMinutes, minToTime } from '@/utils/timeFormat';
import { defaultPolicy } from '@/utils/bookingRules';
import type { Room } from '@/types';
import { RoomSelector } from '@/components/RoomSelector';
import { BookingForm } from '@/components/BookingForm';
import { ScheduleTimeline } from '@/components/ScheduleTimeline';
import { ValidationMessages, StatusBadge } from '@/components/ValidationMessages';

function App() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [startMin, setStartMin] = useState(600);
  const [endMin, setEndMin] = useState(660);
  const [currentMin, setCurrentMin] = useState(getCurrentMinutes());

  // Tick current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentMin(getCurrentMinutes()), 60000);
    return () => clearInterval(interval);
  }, []);

  const validation = useMemo(() => {
    if (!selectedRoom) return null;
    return validateBooking(selectedRoom, startMin, endMin, initialBookings, currentMin);
  }, [selectedRoom, startMin, endMin, currentMin]);

  const available = validation?.available ?? null;

  const handleSelectRoom = useCallback((room: Room) => {
    setSelectedRoom(room);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight text-gray-900 sm:text-lg">Smart Campus</h1>
              <p className="text-xs text-gray-500">Room Booking Checker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" /> Prototype · Mock Data
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Find the perfect room for your next session.
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-gray-600 sm:text-base">
            Select a room, pick a start and end time, and instantly see if the slot is available. Overlaps are rejected but touching boundaries are allowed.
          </p>
        </div>

        {/* Step 1: Room Selection */}
        <section className="mb-6 sm:mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">Choose a Room</h3>
          </div>
          <RoomSelector rooms={rooms} selectedRoomId={selectedRoom?.id ?? null} onSelect={handleSelectRoom} />
        </section>

        {/* Step 2: Time + Schedule */}
        {selectedRoom && (
          <section className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">Check Availability</h3>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {/* Left: Form + validation */}
              <div className="space-y-4">
                <BookingForm
                  room={selectedRoom}
                  startMin={startMin}
                  endMin={endMin}
                  currentMin={currentMin}
                  bookings={initialBookings}
                  validation={validation}
                  onStartTimeChange={setStartMin}
                  onEndTimeChange={setEndMin}
                />

                {/* Status + Validation */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Availability Check</h2>
                    <StatusBadge available={available} />
                  </div>
                  <div className="mt-3">
                    {validation ? (
                      <ValidationMessages messages={validation.messages} />
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center text-sm text-gray-400">
                        Select a room and time range to see availability.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Timeline */}
              <div className="space-y-4">
                <ScheduleTimeline
                  room={selectedRoom}
                  bookings={initialBookings}
                  pendingStart={startMin}
                  pendingEnd={endMin}
                  pendingAvailable={available}
                />

                {/* Rules card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                      <Info className="h-4 w-4 text-blue-500" /> Booking Rules
                    </h3>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                      {defaultPolicy.label}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Times are in minutes (0–1440). Start must be strictly before end.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Start time must be after the current time ({minToTime(currentMin)}).
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Maximum slot duration is {defaultPolicy.maxDurationMinutes} minutes.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Blocked rooms cannot be booked.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Overlapping slots are rejected — but touching boundaries (e.g. 600–660 and 660–720) are allowed.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Empty state prompt when no room selected */}
        {!selectedRoom && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-8 text-center">
            <CalendarCheck className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              Select a room above to start checking availability.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/70 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-gray-400 sm:px-6">
          <p>Smart Campus Room Booking Checker — Interactive UI Prototype. All data is fictional and stored in memory only.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
