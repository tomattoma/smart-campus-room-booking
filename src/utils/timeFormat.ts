// Pure time-formatting helpers. This module knows nothing about bookings,
// rooms, or validation rules — it only converts between minutes-of-day and
// human-readable clock strings. Keeping it separate from the booking domain
// establishes a clean modular boundary so rule logic can never silently
// acquire formatting dependencies (and vice versa).

export function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

export function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function generateTimeOptions(): { value: number; label: string }[] {
  const options: { value: number; label: string }[] = [];
  for (let min = 0; min <= 1440; min += 5) {
    options.push({ value: min, label: minToTime(min) });
  }
  return options;
}
