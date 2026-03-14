/**
 * SuggestedEventCard — Shows an AI-extracted event with confirm button.
 */

import { Calendar, MapPin, Clock, Check } from 'lucide-react';
import { useConfirmEvent } from '../../api/useCalendar';
import { useUIStore } from '../../store/uiStore';
import type { SuggestedEvent } from '../../api/useEmails';

interface SuggestedEventCardProps {
  event: SuggestedEvent;
}

export function SuggestedEventCard({ event }: SuggestedEventCardProps) {
  const confirmMutation = useConfirmEvent();
  const isConfirmed = !!event.confirmed_at;

  const startDate = new Date(event.start_datetime);
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null;

  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const timeStr = event.is_all_day
    ? 'All day'
    : startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }) +
      (endDate
        ? ` – ${endDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}`
        : '');

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl transition-all"
      style={{
        background: isConfirmed
          ? 'rgba(16, 185, 129, 0.08)'
          : 'var(--uni-surface-elevated)',
        border: isConfirmed
          ? '1px solid rgba(16, 185, 129, 0.2)'
          : '1px solid var(--uni-border-subtle)',
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: isConfirmed
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(6, 182, 212, 0.15)',
        }}
      >
        {isConfirmed ? (
          <Check size={16} style={{ color: 'var(--uni-success)' }} />
        ) : (
          <Calendar size={16} style={{ color: 'var(--uni-cyan-400)' }} />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: 'var(--uni-text-primary)' }}
        >
          {event.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span
            className="text-xs flex items-center gap-1"
            style={{ color: 'var(--uni-text-muted)' }}
          >
            <Clock size={10} />
            {dateStr} · {timeStr}
          </span>
          {event.location && (
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--uni-text-subtle)' }}
            >
              <MapPin size={10} />
              {event.location}
            </span>
          )}
        </div>
      </div>

      {/* Confirm Button */}
      {!isConfirmed && (
        <button
          onClick={() =>
            confirmMutation.mutate({ eventId: event.id })
          }
          disabled={confirmMutation.isPending}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
          style={{
            background: 'var(--uni-gradient-primary)',
            color: 'var(--uni-text-primary)',
            opacity: confirmMutation.isPending ? 0.7 : 1,
          }}
        >
          {confirmMutation.isPending ? 'Syncing...' : 'Add to Calendar'}
        </button>
      )}
    </div>
  );
}
