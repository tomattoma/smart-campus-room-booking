export type RoomType = 'Lecture Hall' | 'Lab' | 'Study Room' | 'Conference Room' | 'Auditorium';

export interface Room {
  id: string;
  name: string;
  code: string;
  type: RoomType;
  capacity: number;
  building: string;
  floor: number;
  amenities: string[];
  blocked: boolean;
  blockedReason?: string;
}

export interface Booking {
  id: string;
  roomId: string;
  startMin: number;
  endMin: number;
  title: string;
  bookedBy: string;
}

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationMessage {
  severity: ValidationSeverity;
  text: string;
}

export interface ValidationResult {
  available: boolean;
  messages: ValidationMessage[];
  overlapBookingIds: string[];
}
