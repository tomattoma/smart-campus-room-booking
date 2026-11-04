import type { Room, Booking, ValidationResult, ValidationMessage } from '@/types';
import { minToTime } from '@/utils/timeFormat';

// Overlap predicate for two half-open minute ranges. Belongs with the booking
// rules (not the formatting module) because it encodes a domain invariant:
// ranges that only touch at an endpoint do NOT overlap.
export function slotsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export interface BookingPolicy {
  readonly id: string;
  readonly label: string;
  readonly maxDurationMinutes: number;
  validate(
    room: Room,
    startMin: number,
    endMin: number,
    bookings: Booking[],
    currentMin: number
  ): ValidationResult;
}

function pushError(messages: ValidationMessage[], text: string): void {
  messages.push({ severity: 'error', text });
}

function pushInfo(messages: ValidationMessage[], text: string): void {
  messages.push({ severity: 'info', text });
}

abstract class CampusPolicyBase implements BookingPolicy {
  abstract readonly id: string;
  abstract readonly label: string;
  abstract readonly maxDurationMinutes: number;

  validate(
    room: Room,
    startMin: number,
    endMin: number,
    bookings: Booking[],
    currentMin: number
  ): ValidationResult {
    const messages: ValidationMessage[] = [];
    let available = true;

    if (room.blocked) {
      pushError(
        messages,
        `${room.name} is currently blocked — ${room.blockedReason ?? 'not available for booking'}.`
      );
      available = false;
    }

    if (startMin < 0 || startMin > 1440 || endMin < 0 || endMin > 1440) {
      pushError(messages, 'Times must be between 00:00 (0) and 24:00 (1440) minutes.');
      available = false;
    }

    if (startMin >= endMin) {
      pushError(
        messages,
        startMin === endMin
          ? 'Start and end times are identical — the slot must have a positive duration.'
          : 'Start time must be strictly before end time.'
      );
      available = false;
    }

    if (startMin <= currentMin && !room.blocked) {
      pushError(messages, `Start time must be after the current time (${minToTime(currentMin)}).`);
      available = false;
    }

    const duration = endMin - startMin;
    if (duration > this.maxDurationMinutes) {
      pushError(
        messages,
        `Slot duration is ${duration} minutes — maximum allowed is ${this.maxDurationMinutes} minutes.`
      );
      available = false;
    }

    if (available && !room.blocked) {
      const roomBookings = bookings.filter((b) => b.roomId === room.id);
      const overlaps = roomBookings.filter((b) => slotsOverlap(startMin, endMin, b.startMin, b.endMin));
      if (overlaps.length > 0) {
        available = false;
        overlaps.forEach((b) => {
          pushError(messages, `Overlaps with "${b.title}" (${minToTime(b.startMin)} – ${minToTime(b.endMin)}).`);
        });
        pushInfo(messages, 'Touching boundaries (e.g. ending at 11:00 and starting at 11:00) are allowed.');
      } else {
        const touching = roomBookings.filter((b) => b.endMin === startMin || b.startMin === endMin);
        if (touching.length > 0) {
          const labels = touching.map(
            (b) => `"${b.title}" (${minToTime(b.startMin)} – ${minToTime(b.endMin)})`
          );
          pushInfo(messages, `Touches ${labels.join(', ')} at an exact boundary — this is allowed.`);
        }
        pushInfo(messages, `Slot ${minToTime(startMin)} – ${minToTime(endMin)} (${duration} min) is available.`);
      }
    }

    return { available, messages };
  }
}

export class StandardCampusPolicy extends CampusPolicyBase {
  readonly id = 'standard-campus';
  readonly label = 'Standard Campus';
  readonly maxDurationMinutes = 120;
}

export class StrictExamPeriodPolicy extends CampusPolicyBase {
  readonly id = 'strict-exam-period';
  readonly label = 'Strict Exam Period';
  readonly maxDurationMinutes = 60;
}

export const defaultPolicy: BookingPolicy = new StandardCampusPolicy();
