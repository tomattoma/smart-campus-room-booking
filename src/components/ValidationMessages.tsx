import { Clock, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';
import type { ValidationMessage } from '@/types';

interface ValidationMessagesProps {
  messages: ValidationMessage[];
}

export function ValidationMessages({ messages }: ValidationMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center text-sm text-gray-400">
        Select a room and time range to see availability.
      </div>
    );
  }

  const iconFor = (s: ValidationMessage['severity']) => {
    if (s === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (s === 'warning') return <AlertCircle className="h-4 w-4 text-amber-500" />;
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  const bgFor = (s: ValidationMessage['severity']) => {
    if (s === 'error') return 'bg-red-50 border-red-100';
    if (s === 'warning') return 'bg-amber-50 border-amber-100';
    return 'bg-blue-50 border-blue-100';
  };

  const textFor = (s: ValidationMessage['severity']) => {
    if (s === 'error') return 'text-red-700';
    if (s === 'warning') return 'text-amber-700';
    return 'text-blue-700';
  };

  return (
    <div className="space-y-1.5">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${bgFor(msg.severity)}`}
        >
          <span className="mt-0.5 shrink-0">{iconFor(msg.severity)}</span>
          <span className={textFor(msg.severity)}>{msg.text}</span>
        </div>
      ))}
    </div>
  );
}

interface StatusBadgeProps {
  available: boolean | null;
}

export function StatusBadge({ available }: StatusBadgeProps) {
  if (available === null) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-500">
        <Clock className="h-4 w-4" /> Pending
      </span>
    );
  }

  return available ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-emerald-200">
      <CheckCircle2 className="h-4 w-4" /> Available
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-red-200">
      <X className="h-4 w-4" /> Unavailable
    </span>
  );
}
