/**
 * EmailDetail — Full email view with summary, risk analysis, and events.
 */

import { X, Calendar, ExternalLink, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useEmailDetail } from '../../api/useEmails';
import { useUIStore } from '../../store/uiStore';
import { SummaryCard } from '../ai/SummaryCard';
import { RiskBanner } from '../ai/RiskBanner';
import { SuggestedEventCard } from '../calendar/SuggestedEventCard';

export function EmailDetail() {
  const selectedEmailId = useUIStore((s) => s.selectedEmailId);
  const selectEmail = useUIStore((s) => s.selectEmail);
  const { data: email, isLoading } = useEmailDetail(selectedEmailId);

  if (!selectedEmailId) return null;

  if (isLoading || !email) {
    return (
      <div
        className="h-full p-6 overflow-y-auto"
        style={{ background: 'rgba(0, 0, 0, 0.2)' }}
      >
        {/* Skeleton */}
        <div className="space-y-4 animate-pulse">
          <div
            className="h-6 rounded"
            style={{ background: 'var(--uni-surface-elevated)', width: '70%' }}
          />
          <div
            className="h-4 rounded"
            style={{ background: 'var(--uni-surface-elevated)', width: '40%' }}
          />
          <div className="space-y-2 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-3 rounded"
                style={{
                  background: 'var(--uni-surface-elevated)',
                  width: `${80 - i * 5}%`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: 'rgba(0, 0, 0, 0.2)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--uni-border-subtle)' }}
      >
        <div className="min-w-0 flex-1">
          <h3
            className="text-lg font-semibold truncate"
            style={{ color: 'var(--uni-text-primary)' }}
          >
            {email.subject || '(No Subject)'}
          </h3>
          <p
            className="text-sm"
            style={{ color: 'var(--uni-text-muted)' }}
          >
            From: {email.sender_name || email.sender}
          </p>
        </div>
        <button
          onClick={() => selectEmail(null)}
          className="p-2 rounded-lg transition-colors flex-shrink-0 ml-2"
          style={{ color: 'var(--uni-text-muted)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Risk Banner */}
        {email.risk_score === 'high' && email.risk_reasons && (
          <RiskBanner reasons={email.risk_reasons} />
        )}

        {/* Summary Card */}
        {email.summary_bullets && email.summary_bullets.length > 0 && (
          <SummaryCard bullets={email.summary_bullets} />
        )}

        {/* Processing Status */}
        {(email.processing_status === 'pending' || email.processing_status === 'processing') && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl"
            style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
            }}
          >
            <div
              className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{
                borderColor: 'var(--uni-border-subtle)',
                borderTopColor: 'var(--uni-cyan-400)',
              }}
            />
            <p
              className="text-sm"
              style={{ color: 'var(--uni-cyan-400)' }}
            >
              Analyzing email... This may take a few seconds.
            </p>
          </div>
        )}

        {/* Suggested Events */}
        {email.suggested_events && email.suggested_events.length > 0 && (
          <div>
            <p
              className="text-xs font-medium uppercase tracking-wider mb-2"
              style={{ color: 'var(--uni-text-subtle)' }}
            >
              📅 Suggested Events
            </p>
            <div className="space-y-2">
              {email.suggested_events.map((event) => (
                <SuggestedEventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Email Body */}
        <div>
          <p
            className="text-xs font-medium uppercase tracking-wider mb-2"
            style={{ color: 'var(--uni-text-subtle)' }}
          >
            Message
          </p>
          <div
            className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              background: 'var(--uni-surface-elevated)',
              color: 'var(--uni-text-secondary)',
              border: '1px solid var(--uni-border-subtle)',
            }}
          >
            {email.body_text || '(No content)'}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-1">
          <p className="text-xs" style={{ color: 'var(--uni-text-subtle)' }}>
            Received: {new Date(email.received_at).toLocaleString()}
          </p>
          {email.recipients.length > 0 && (
            <p className="text-xs" style={{ color: 'var(--uni-text-subtle)' }}>
              To: {email.recipients.join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
