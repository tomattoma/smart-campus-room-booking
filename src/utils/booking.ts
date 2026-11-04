import type { Room, Booking, ValidationResult } from '@/types';
import { defaultPolicy } from '@/utils/bookingRules';

// Thin facade over the active booking policy. The live app calls this so the
// default policy can be swapped without touching call sites.
export function validateBooking(
  room: Room,
  startMin: number,
  endMin: number,
  bookings: Booking[],
  currentMin: number
): ValidationResult {
  return defaultPolicy.validate(room, startMin, endMin, bookings, currentMin);
}
