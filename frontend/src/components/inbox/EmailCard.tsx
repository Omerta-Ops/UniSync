/**
 * EmailCard — Individual email row in the list.
 * React.memo wrapped for performance.
 * Shows sender, subject, preview, risk badge, processing state.
 */

import { memo, useCallback, useRef } from 'react';
import { Archive, Star, Clock } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import type { EmailSummary } from '../../api/useEmails';

interface EmailCardProps {
  email: EmailSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onArchive: (id: string) => void;
  onPrefetch: (id: string) => void;
}

export const EmailCard = memo(function EmailCard({
  email,
  isSelected,
  onSelect,
  onArchive,
  onPrefetch,
}: EmailCardProps) {
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => {
      onPrefetch(email.id);
    }, 200);
  }, [email.id, onPrefetch]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  // Sender initials
  const initials = (email.sender_name || email.sender)
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isPending = email.processing_status === 'pending' || email.processing_status === 'processing';

  // Risk badge color
  const riskColor = email.risk_score === 'high'
    ? 'var(--uni-risk-high)'
    : email.risk_score === 'medium'
    ? 'var(--uni-risk-medium)'
    : 'var(--uni-risk-low)';

  // Format time
  const timeStr = formatRelativeTime(email.received_at);

  return (
    <div
      onClick={() => onSelect(email.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group flex items-start gap-3 px-4 py-3 cursor-pointer transition-all"
      style={{
        background: isSelected
          ? 'rgba(6, 182, 212, 0.1)'
          : 'transparent',
        borderLeft: isSelected
          ? '3px solid var(--uni-cyan-400)'
          : '3px solid transparent',
        borderBottom: '1px solid var(--uni-border-subtle)',
      }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
        style={{
          background: email.is_read
            ? 'var(--uni-surface-elevated)'
            : 'var(--uni-gradient-primary)',
          color: 'var(--uni-text-primary)',
        }}
      >
        {initials || '?'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p
            className="text-sm truncate"
            style={{
              color: 'var(--uni-text-primary)',
              fontWeight: email.is_read ? 400 : 600,
            }}
          >
            {email.sender_name || email.sender}
          </p>
          <span
            className="text-xs flex-shrink-0 ml-2"
            style={{ color: 'var(--uni-text-subtle)' }}
          >
            {timeStr}
          </span>
        </div>

        <p
          className="text-sm truncate mb-0.5"
          style={{
            color: email.is_read
              ? 'var(--uni-text-muted)'
              : 'var(--uni-text-secondary)',
            fontWeight: email.is_read ? 400 : 500,
          }}
        >
          {email.subject || '(No Subject)'}
        </p>

        <p
          className="text-xs truncate"
          style={{ color: 'var(--uni-text-subtle)' }}
        >
          {email.snippet || ''}
        </p>

        {/* Bottom row: risk badge + summary preview */}
        <div className="flex items-center gap-2 mt-1.5">
          {/* Risk dot */}
          {email.risk_score && (
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: riskColor }}
              />
              <span
                className="text-xs capitalize"
                style={{ color: riskColor }}
              >
                {email.risk_score}
              </span>
            </div>
          )}

          {/* Processing state */}
          {isPending && (
            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--uni-cyan-400)' }}
            >
              <Clock size={10} className="animate-pulse" />
              <span className="animate-pulse">Analyzing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive(email.id);
          }}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--uni-text-subtle)' }}
          title="Archive"
        >
          <Archive size={14} />
        </button>
      </div>
    </div>
  );
});

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
