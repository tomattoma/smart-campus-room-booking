import { describe, it, expect } from 'vitest';
import { validateBooking } from '@/utils/booking';
import { StandardCampusPolicy, StrictExamPeriodPolicy, slotsOverlap } from '@/utils/bookingRules';
import { rooms as fixtureRooms, initialBookings as fixtureBookings } from '@/data/mockData';
import type { Room, Booking } from '@/types';

const baseRoom: Room = {
  id: 'rm-test',
  name: 'Test Room',
  code: 'T-001',
  type: 'Study Room',
  capacity: 10,
  building: 'Test Block',
  floor: 1,
  amenities: ['Whiteboard'],
  blocked: false,
};

const blockedRoom: Room = { ...baseRoom, id: 'rm-blocked', blocked: true, blockedReason: 'Maintenance' };

const NOON = 720;
const ONE_PM = 780;

function withBooking(b: Booking): Booking[] {
  return [b];
}

describe('slotsOverlap', () => {
  it('detects partial overlap', () => {
    expect(slotsOverlap(600, 660, 630, 690)).toBe(true);
  });

  it('allows touching boundaries (end === start)', () => {
    expect(slotsOverlap(600, 660, 660, 720)).toBe(false);
  });

  it('rejects identical ranges', () => {
    expect(slotsOverlap(600, 660, 600, 660)).toBe(true);
  });
});

describe('AC1 — blocked rooms cannot be booked', () => {
  it('rejects any slot on a blocked room', () => {
    const res = validateBooking(blockedRoom, ONE_PM, ONE_PM + 60, [], NOON - 10);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /blocked/i.test(m.text))).toBe(true);
  });

  it('still rejects even when the time would otherwise be valid', () => {
    const res = validateBooking(blockedRoom, ONE_PM, ONE_PM + 30, [], NOON - 10);
    expect(res.available).toBe(false);
  });
});

describe('AC2 — times within 0–1440 minute range', () => {
  it('rejects a start below 0', () => {
    const res = validateBooking(baseRoom, -10, 60, [], NOON - 10);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /between/i.test(m.text))).toBe(true);
  });

  it('rejects an end above 1440', () => {
    const res = validateBooking(baseRoom, 1400, 1500, [], NOON - 10);
    expect(res.available).toBe(false);
  });

  it('accepts boundary values 0 and 1440 when otherwise valid', () => {
    const res = validateBooking(baseRoom, 1400, 1440, [], NOON - 10);
    expect(res.available).toBe(true);
  });
});

describe('AC3 — start must be strictly before end', () => {
  it('rejects start === end', () => {
    const res = validateBooking(baseRoom, ONE_PM, ONE_PM, [], NOON - 10);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /identical|strictly before/i.test(m.text))).toBe(true);
  });

  it('rejects start > end', () => {
    const res = validateBooking(baseRoom, ONE_PM + 60, ONE_PM, [], NOON - 10);
    expect(res.available).toBe(false);
  });
});

describe('AC4 — start must be after the current time', () => {
  it('rejects a start at or before current time', () => {
    const res = validateBooking(baseRoom, NOON, NOON + 60, [], NOON);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /after the current time/i.test(m.text))).toBe(true);
  });

  it('accepts a start strictly after the current time', () => {
    const res = validateBooking(baseRoom, NOON + 10, NOON + 70, [], NOON);
    expect(res.available).toBe(true);
  });
});

describe('AC5 — maximum slot duration is 120 minutes', () => {
  it('rejects a slot longer than 120 minutes', () => {
    const res = validateBooking(baseRoom, ONE_PM, ONE_PM + 121, [], NOON - 10);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /120 minutes/i.test(m.text))).toBe(true);
  });

  it('accepts a slot of exactly 120 minutes', () => {
    const res = validateBooking(baseRoom, ONE_PM, ONE_PM + 120, [], NOON - 10);
    expect(res.available).toBe(true);
  });

  it('accepts a slot shorter than 120 minutes', () => {
    const res = validateBooking(baseRoom, ONE_PM, ONE_PM + 60, [], NOON - 10);
    expect(res.available).toBe(true);
  });
});

describe('AC6 — overlaps rejected, touching boundaries allowed', () => {
  it('rejects a slot overlapping an existing booking', () => {
    const existing = withBooking({ id: 'b1', roomId: 'rm-test', startMin: ONE_PM, endMin: ONE_PM + 60, title: 'Class', bookedBy: 'Prof' });
    const res = validateBooking(baseRoom, ONE_PM + 30, ONE_PM + 90, existing, NOON - 10);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /Overlaps/i.test(m.text))).toBe(true);
  });

  it('allows a slot ending exactly when an existing booking starts (touching boundary)', () => {
    const existing = withBooking({ id: 'b1', roomId: 'rm-test', startMin: ONE_PM, endMin: ONE_PM + 60, title: 'Class', bookedBy: 'Prof' });
    const res = validateBooking(baseRoom, ONE_PM - 60, ONE_PM, existing, NOON - 10);
    expect(res.available).toBe(true);
    expect(res.messages.some((m) => m.severity === 'info' && /touch/i.test(m.text))).toBe(true);
  });

  it('allows a slot starting exactly when an existing booking ends (touching boundary)', () => {
    const existing = withBooking({ id: 'b1', roomId: 'rm-test', startMin: ONE_PM, endMin: ONE_PM + 60, title: 'Class', bookedBy: 'Prof' });
    const res = validateBooking(baseRoom, ONE_PM + 60, ONE_PM + 120, existing, NOON - 10);
    expect(res.available).toBe(true);
    expect(res.messages.some((m) => m.severity === 'info' && /touch/i.test(m.text))).toBe(true);
  });

  it('ignores bookings for a different room', () => {
    const otherRoomBooking = withBooking({ id: 'b2', roomId: 'rm-other', startMin: ONE_PM, endMin: ONE_PM + 60, title: 'Other', bookedBy: 'X' });
    const res = validateBooking(baseRoom, ONE_PM, ONE_PM + 60, otherRoomBooking, NOON - 10);
    expect(res.available).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Strategy Pattern — direct policy tests
// ---------------------------------------------------------------------------

const standard = new StandardCampusPolicy();
const strict = new StrictExamPeriodPolicy();

describe('StandardCampusPolicy — AC1–AC6 via the BookingPolicy interface', () => {
  it('AC1: rejects a blocked room', () => {
    const res = standard.validate(blockedRoom, ONE_PM, ONE_PM + 60, [], NOON - 10);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /blocked/i.test(m.text))).toBe(true);
  });

  it('AC2: rejects out-of-range times', () => {
    expect(standard.validate(baseRoom, -10, 60, [], NOON - 10).available).toBe(false);
    expect(standard.validate(baseRoom, 1400, 1500, [], NOON - 10).available).toBe(false);
    expect(standard.validate(baseRoom, 1400, 1440, [], NOON - 10).available).toBe(true);
  });

  it('AC3: rejects start >= end', () => {
    expect(standard.validate(baseRoom, ONE_PM, ONE_PM, [], NOON - 10).available).toBe(false);
    expect(standard.validate(baseRoom, ONE_PM + 60, ONE_PM, [], NOON - 10).available).toBe(false);
  });

  it('AC4: rejects start at/before current time', () => {
    expect(standard.validate(baseRoom, NOON, NOON + 60, [], NOON).available).toBe(false);
    expect(standard.validate(baseRoom, NOON + 10, NOON + 70, [], NOON).available).toBe(true);
  });

  it('AC5: enforces the 120-minute maximum', () => {
    expect(standard.validate(baseRoom, ONE_PM, ONE_PM + 121, [], NOON - 10).available).toBe(false);
    expect(standard.validate(baseRoom, ONE_PM, ONE_PM + 120, [], NOON - 10).available).toBe(true);
  });

  it('AC6: rejects overlaps and allows touching boundaries', () => {
    const existing = withBooking({ id: 'b1', roomId: 'rm-test', startMin: ONE_PM, endMin: ONE_PM + 60, title: 'Class', bookedBy: 'Prof' });
    expect(standard.validate(baseRoom, ONE_PM + 30, ONE_PM + 90, existing, NOON - 10).available).toBe(false);
    expect(standard.validate(baseRoom, ONE_PM - 60, ONE_PM, existing, NOON - 10).available).toBe(true);
    expect(standard.validate(baseRoom, ONE_PM + 60, ONE_PM + 120, existing, NOON - 10).available).toBe(true);
  });

  it('exposes its policy identity', () => {
    expect(standard.id).toBe('standard-campus');
    expect(standard.maxDurationMinutes).toBe(120);
  });
});

describe('StrictExamPeriodPolicy — stricter 60-minute ceiling, shared rules', () => {
  it('exposes its policy identity', () => {
    expect(strict.id).toBe('strict-exam-period');
    expect(strict.maxDurationMinutes).toBe(60);
  });

  it('AC5 (strict): rejects a 121-minute slot just like the standard policy', () => {
    expect(strict.validate(baseRoom, ONE_PM, ONE_PM + 121, [], NOON - 10).available).toBe(false);
  });

  it('AC5 (strict): rejects a slot between 61 and 120 minutes that the standard policy would allow', () => {
    const res = strict.validate(baseRoom, ONE_PM, ONE_PM + 90, [], NOON - 10);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /60 minutes/i.test(m.text))).toBe(true);
    // The standard policy accepts the same slot — proving the ceiling differs.
    expect(standard.validate(baseRoom, ONE_PM, ONE_PM + 90, [], NOON - 10).available).toBe(true);
  });

  it('AC5 (strict): accepts a slot of exactly 60 minutes', () => {
    expect(strict.validate(baseRoom, ONE_PM, ONE_PM + 60, [], NOON - 10).available).toBe(true);
  });

  it('AC5 (strict): accepts a slot shorter than 60 minutes', () => {
    expect(strict.validate(baseRoom, ONE_PM, ONE_PM + 30, [], NOON - 10).available).toBe(true);
  });

  it('AC1 (strict): still rejects a blocked room', () => {
    expect(strict.validate(blockedRoom, ONE_PM, ONE_PM + 30, [], NOON - 10).available).toBe(false);
  });

  it('AC2 (strict): still rejects out-of-range times', () => {
    expect(strict.validate(baseRoom, -10, 60, [], NOON - 10).available).toBe(false);
  });

  it('AC3 (strict): still rejects start >= end', () => {
    expect(strict.validate(baseRoom, ONE_PM, ONE_PM, [], NOON - 10).available).toBe(false);
  });

  it('AC4 (strict): still rejects a start at/before current time', () => {
    expect(strict.validate(baseRoom, NOON, NOON + 30, [], NOON).available).toBe(false);
  });

  it('AC6 (strict): still rejects overlaps and allows touching boundaries', () => {
    const existing = withBooking({ id: 'b1', roomId: 'rm-test', startMin: ONE_PM, endMin: ONE_PM + 30, title: 'Exam', bookedBy: 'Invigilator' });
    expect(strict.validate(baseRoom, ONE_PM + 15, ONE_PM + 45, existing, NOON - 10).available).toBe(false);
    expect(strict.validate(baseRoom, ONE_PM - 30, ONE_PM, existing, NOON - 10).available).toBe(true);
    expect(strict.validate(baseRoom, ONE_PM + 30, ONE_PM + 60, existing, NOON - 10).available).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Named regression suite — past time, reversed interval, 121-min duration,
// blocked room, overlap, touching endpoints, and fixture immutability.
// Each case maps to its governing acceptance criterion(s).
// ---------------------------------------------------------------------------

describe('Regression — named scenarios against AC1–AC6', () => {
  const room: Room = { ...baseRoom, id: 'rm-reg' };
  const NOW = 600; // 10:00 AM

  it('past time: a start at/earlier than NOW is rejected (AC4)', () => {
    // AC4 — the start must be strictly after the current wall-clock minute.
    // A start equal to NOW is not "after", so it must be rejected.
    const atNow = validateBooking(room, NOW, NOW + 60, [], NOW);
    expect(atNow.available).toBe(false);
    expect(atNow.messages.some((m) => m.severity === 'error' && /after the current time/i.test(m.text))).toBe(true);

    // A start before NOW is likewise in the past and must be rejected.
    const beforeNow = validateBooking(room, NOW - 30, NOW + 30, [], NOW);
    expect(beforeNow.available).toBe(false);
    expect(beforeNow.messages.some((m) => m.severity === 'error' && /after the current time/i.test(m.text))).toBe(true);

    // Sanity: a start strictly after NOW is accepted (proves the gate is not over-rejecting).
    const afterNow = validateBooking(room, NOW + 10, NOW + 70, [], NOW);
    expect(afterNow.available).toBe(true);
  });

  it('reversed interval: end earlier than start is rejected (AC3)', () => {
    // AC3 — start must be strictly before end. A reversed pair violates this.
    const res = validateBooking(room, NOW + 120, NOW + 60, [], NOW);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /strictly before/i.test(m.text))).toBe(true);

    // The identical-times edge is a distinct AC3 branch and is rejected too.
    const identical = validateBooking(room, NOW + 60, NOW + 60, [], NOW);
    expect(identical.available).toBe(false);
    expect(identical.messages.some((m) => m.severity === 'error' && /identical|strictly before/i.test(m.text))).toBe(true);
  });

  it('121-minute duration: one minute over the 120 cap is rejected (AC5)', () => {
    // AC5 — StandardCampusPolicy caps slot length at 120 minutes. 121 must fail.
    const res = validateBooking(room, NOW + 10, NOW + 131, [], NOW);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /120 minutes/i.test(m.text))).toBe(true);

    // Boundary: exactly 120 is accepted, so the cap is inclusive on the valid side.
    const exact = validateBooking(room, NOW + 10, NOW + 130, [], NOW);
    expect(exact.available).toBe(true);
  });

  it('blocked room: any otherwise-valid slot is rejected (AC1)', () => {
    // AC1 — a blocked room cannot be booked regardless of the chosen time.
    const res = validateBooking(blockedRoom, NOW + 10, NOW + 70, [], NOW);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /blocked/i.test(m.text))).toBe(true);

    // Even a short, future, non-overlapping slot is rejected purely because of the block.
    const shortFuture = validateBooking(blockedRoom, NOW + 10, NOW + 40, [], NOW);
    expect(shortFuture.available).toBe(false);
  });

  it('overlap: a slot crossing an existing booking is rejected (AC6)', () => {
    // AC6 — a requested slot that overlaps an existing booking for the same room fails.
    const existing = withBooking({ id: 'bk-reg', roomId: 'rm-reg', startMin: NOW + 60, endMin: NOW + 120, title: 'Seminar', bookedBy: 'Dept' });
    const res = validateBooking(room, NOW + 90, NOW + 150, existing, NOW);
    expect(res.available).toBe(false);
    expect(res.messages.some((m) => m.severity === 'error' && /Overlaps/i.test(m.text))).toBe(true);
    // The overlap hint about touching boundaries is surfaced as info alongside the error.
    expect(res.messages.some((m) => m.severity === 'info' && /touching boundaries/i.test(m.text))).toBe(true);
  });

  it('touching endpoints: both boundary directions are allowed (AC6)', () => {
    // AC6 — slots that only touch an existing booking at an exact endpoint do NOT overlap.
    const existing = withBooking({ id: 'bk-touch', roomId: 'rm-reg', startMin: NOW + 60, endMin: NOW + 120, title: 'Seminar', bookedBy: 'Dept' });

    // Ending exactly when the existing booking starts (back-to-back before it).
    // Start is strictly after NOW so AC4 does not interfere with the AC6 assertion.
    const before = validateBooking(room, NOW + 10, NOW + 60, existing, NOW);
    expect(before.available).toBe(true);
    expect(before.messages.some((m) => m.severity === 'info' && /touch/i.test(m.text))).toBe(true);

    // Starting exactly when the existing booking ends (back-to-back after it).
    const after = validateBooking(room, NOW + 120, NOW + 180, existing, NOW);
    expect(after.available).toBe(true);
    expect(after.messages.some((m) => m.severity === 'info' && /touch/i.test(m.text))).toBe(true);
  });

  it('overlap respects room scope: a booking for another room never blocks (AC6)', () => {
    // AC6 — overlap detection is per-room. An identical time on a different room is irrelevant.
    const otherRoom = withBooking({ id: 'bk-other', roomId: 'rm-other', startMin: NOW + 60, endMin: NOW + 120, title: 'Elsewhere', bookedBy: 'X' });
    const res = validateBooking(room, NOW + 60, NOW + 120, otherRoom, NOW);
    expect(res.available).toBe(true);
  });
});

describe('Regression — fixture data is never mutated by validation', () => {
  // Capture the original array references (for identity) and deep clones
  // (for content equality). AGENTS.md forbids mutating original booking
  // fixtures, so every validation call must leave them byte-identical and
  // the module exports must remain the same array objects.
  const roomsRef = fixtureRooms;
  const bookingsRef = fixtureBookings;
  const roomsClone = JSON.parse(JSON.stringify(fixtureRooms)) as Room[];
  const bookingsClone = JSON.parse(JSON.stringify(fixtureBookings)) as Booking[];

  it('rooms array is unchanged after validation runs against it', () => {
    // Run validation against the real fixture rooms/bookings (read-only consumption).
    const aRealRoom = fixtureRooms.find((r) => !r.blocked)!;
    validateBooking(aRealRoom, 600, 660, fixtureBookings, 540);
    expect(fixtureRooms).toEqual(roomsClone);
  });

  it('initialBookings array is unchanged after validation runs against it', () => {
    const aRealRoom = fixtureRooms.find((r) => !r.blocked)!;
    // Run several validations that read overlapping bookings.
    validateBooking(aRealRoom, 540, 600, fixtureBookings, 480);
    validateBooking(aRealRoom, 660, 720, fixtureBookings, 480);
    validateBooking(aRealRoom, 1140, 1200, fixtureBookings, 480);
    expect(fixtureBookings).toEqual(bookingsClone);
  });

  it('the arrays are still the same object references (no replacement)', () => {
    // The module exports must remain the identical arrays, not rebuilt copies.
    expect(fixtureRooms).toBe(roomsRef);
    expect(fixtureBookings).toBe(bookingsRef);
  });
});
