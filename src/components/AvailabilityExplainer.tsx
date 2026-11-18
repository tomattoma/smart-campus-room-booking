import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Info } from 'lucide-react';
import { explainAvailability, deriveReasonCode } from '@/utils/explainAvailability';
import { minToTime } from '@/utils/timeFormat';
import type { Room, ValidationResult } from '@/types';

interface AvailabilityExplainerProps {
  room: Room;
  startMin: number;
  endMin: number;
  validation: ValidationResult;
}

export function AvailabilityExplainer({ room, startMin, endMin, validation }: AvailabilityExplainerProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExplain = () => {
    setLoading(true);
    setError(null);
    setExplanation(null);

    const reasonCode = deriveReasonCode(validation);
    const result = explainAvailability({
      roomLabel: room.name,
      startTime: minToTime(startMin),
      endTime: minToTime(endMin),
      isAvailable: validation.available,
      reasonCode,
    });

    setExplanation(result.explanation);
    setLoading(false);
  };

  const handleReset = () => {
    setExplanation(null);
    setError(null);
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Sparkles className="h-4 w-4 text-violet-500" /> AI Availability Explainer
        </h3>
        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
          Mock · optional
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        This is a simulated explanation and is separate from the confirmed availability result above. Always rely on the badge and validation messages for booking decisions.
      </p>

      <div className="mt-4 flex items-center gap-2">
        {!explanation && !loading && (
          <button
            type="button"
            onClick={handleExplain}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <Sparkles className="h-4 w-4" /> Explain availability
          </button>
        )}
        {loading && (
          <span className="inline-flex items-center gap-2 rounded-lg bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </span>
        )}
        {explanation && !loading && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {explanation && !error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-violet-100 bg-white/70 px-3 py-3 text-sm text-gray-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
          <p className="leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}
