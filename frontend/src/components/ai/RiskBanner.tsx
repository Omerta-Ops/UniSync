/**
 * RiskBanner — High-risk phishing warning banner.
 */

import { ShieldAlert } from 'lucide-react';

interface RiskBannerProps {
  reasons: string[];
}

export function RiskBanner({ reasons }: RiskBannerProps) {
  if (!reasons || reasons.length === 0) return null;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
        border: '1px solid rgba(239, 68, 68, 0.3)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert size={16} style={{ color: 'var(--uni-risk-high)' }} />
        <p
          className="text-sm font-semibold"
          style={{ color: 'var(--uni-risk-high)' }}
        >
          ⚠️ High Risk — Potential Phishing Detected
        </p>
      </div>
      <ul className="space-y-1">
        {reasons.map((reason, i) => (
          <li
            key={i}
            className="text-xs flex items-start gap-1.5"
            style={{ color: 'var(--uni-text-muted)' }}
          >
            <span style={{ color: 'var(--uni-risk-high)' }}>•</span>
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
