/**
 * SummaryCard — Displays AI-generated 3-bullet summary.
 */

import { Sparkles } from 'lucide-react';

interface SummaryCardProps {
  bullets: string[];
}

export function SummaryCard({ bullets }: SummaryCardProps) {
  if (!bullets || bullets.length === 0) return null;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(37, 99, 235, 0.08))',
        border: '1px solid rgba(6, 182, 212, 0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} style={{ color: 'var(--uni-cyan-400)' }} />
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--uni-cyan-400)' }}
        >
          AI Summary
        </p>
      </div>
      <ul className="space-y-2">
        {bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ background: 'var(--uni-cyan-400)' }}
            />
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--uni-text-secondary)' }}
            >
              {bullet}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
