import type { ValidationResult } from '@/types';

export type ReasonCode =
  | 'available'
  | 'touching'
  | 'blocked'
  | 'out-of-range'
  | 'start-after-end'
  | 'past-time'
  | 'too-long'
  | 'overlap';

export interface AvailabilityExplanationRequest {
  roomLabel: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reasonCode: ReasonCode;
}

export interface AvailabilityExplanationResponse {
  explanation: string;
}

const EXPLANATIONS: Record<ReasonCode, (req: AvailabilityExplanationRequest) => string> = {
  available: ({ roomLabel, startTime, endTime }) =>
    `Great news — ${roomLabel} is free from ${startTime} to ${endTime}, so you're all set to book it. Just confirm and you're done!`,
  touching: ({ roomLabel, startTime, endTime }) =>
    `${roomLabel} works for ${startTime} to ${endTime} — your slot touches another booking right at the edge, which is totally fine. Go ahead and book it!`,
  blocked: ({ roomLabel }) =>
    `${roomLabel} is currently blocked and can't be booked right now. Try picking a different room or check back later.`,
  'out-of-range': ({ roomLabel }) =>
    `The times you picked for ${roomLabel} fall outside the 00:00–24:00 window. Choose a start and end within the same day and try again.`,
  'start-after-end': ({ roomLabel }) =>
    `Your end time for ${roomLabel} needs to come after the start time. Double-check both fields and give it another go.`,
  'past-time': ({ roomLabel, startTime }) =>
    `${roomLabel} can't be booked starting at ${startTime} because that's already in the past. Pick a start time later than right now.`,
  'too-long': ({ roomLabel, startTime, endTime }) =>
    `Your ${startTime}–${endTime} slot in ${roomLabel} is longer than the 120-minute limit. Shorten it to two hours or less and it should go through.`,
  overlap: ({ roomLabel, startTime, endTime }) =>
    `${roomLabel} already has something scheduled during ${startTime}–${endTime}, so that slot won't work. Try a different time that doesn't overlap.`,
};

export function deriveReasonCode(validation: ValidationResult): ReasonCode {
  if (validation.available) {
    return validation.messages.some((m) => /touch/i.test(m.text)) ? 'touching' : 'available';
  }
  const errors = validation.messages.filter((m) => m.severity === 'error');
  if (errors.some((m) => /blocked/i.test(m.text))) return 'blocked';
  if (errors.some((m) => /between/i.test(m.text))) return 'out-of-range';
  if (errors.some((m) => /identical|strictly before/i.test(m.text))) return 'start-after-end';
  if (errors.some((m) => /after the current time/i.test(m.text))) return 'past-time';
  if (errors.some((m) => /maximum allowed|maximum allowed is/i.test(m.text))) return 'too-long';
  if (errors.some((m) => /overlaps/i.test(m.text))) return 'overlap';
  return 'overlap';
}

export function explainAvailability(req: AvailabilityExplanationRequest): AvailabilityExplanationResponse {
  const build = EXPLANATIONS[req.reasonCode] ?? EXPLANATIONS.available;
  return { explanation: build(req) };
}
