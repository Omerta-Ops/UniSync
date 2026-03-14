/**
 * Settings Page — Link accounts, manage preferences.
 */

import { useState } from 'react';
import { Shell } from '../components/layout/Shell';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useLinkGmail, useLinkOutlook, useHealthCheck } from '../api/useSync';
import {
  Mail,
  Link2,
  Shield,
  Activity,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const linkedAccounts = useAuthStore((s) => s.linkedAccounts);
  const linkGmail = useLinkGmail();
  const linkOutlook = useLinkOutlook();
  const { data: health } = useHealthCheck();
  const navigate = useNavigate();

  return (
    <Shell>
      <div className="h-full overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--uni-text-muted)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--uni-text-primary)' }}
          >
            Settings
          </h1>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* ── Profile Section ──────────────────────────────────── */}
          <SettingsSection title="Profile" icon={Mail}>
            <div className="space-y-3">
              <InfoRow label="Name" value={user?.fullName || '—'} />
              <InfoRow label="Email" value={user?.email || '—'} />
            </div>
          </SettingsSection>

          {/* ── Linked Accounts ──────────────────────────────────── */}
          <SettingsSection title="Linked Accounts" icon={Link2}>
            <div className="space-y-3">
              {linkedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: 'var(--uni-surface-elevated)',
                    border: '1px solid var(--uni-border-subtle)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: account.isActive
                          ? 'var(--uni-success)'
                          : 'var(--uni-error)',
                      }}
                    />
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--uni-text-primary)' }}
                      >
                        {account.emailAddress}
                      </p>
                      <p
                        className="text-xs capitalize"
                        style={{ color: 'var(--uni-text-subtle)' }}
                      >
                        {account.provider}
                        {account.lastSyncAt &&
                          ` · Synced ${new Date(account.lastSyncAt).toLocaleTimeString()}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {linkedAccounts.length === 0 && (
                <p
                  className="text-sm py-2"
                  style={{ color: 'var(--uni-text-muted)' }}
                >
                  No accounts linked yet. Connect your email to get started.
                </p>
              )}

              {/* Link Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => linkGmail.mutate()}
                  disabled={linkGmail.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: 'var(--uni-surface-glass)',
                    color: 'var(--uni-text-primary)',
                    border: '1px solid var(--uni-border-glass)',
                  }}
                >
                  <img
                    src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_32dp.png"
                    alt="Gmail"
                    className="w-5 h-5"
                  />
                  {linkGmail.isPending ? 'Connecting...' : 'Connect Gmail'}
                </button>
                <button
                  onClick={() => linkOutlook.mutate()}
                  disabled={linkOutlook.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: 'var(--uni-surface-glass)',
                    color: 'var(--uni-text-primary)',
                    border: '1px solid var(--uni-border-glass)',
                  }}
                >
                  <img
                    src="https://img.icons8.com/color/32/microsoft-outlook-2019.png"
                    alt="Outlook"
                    className="w-5 h-5"
                  />
                  {linkOutlook.isPending ? 'Connecting...' : 'Connect Outlook'}
                </button>
              </div>
            </div>
          </SettingsSection>

          {/* ── System Status ────────────────────────────────────── */}
          <SettingsSection title="System Status" icon={Activity}>
            {health ? (
              <div className="space-y-2">
                <StatusRow
                  label="Overall"
                  status={health.status === 'healthy'}
                  value={health.status}
                />
                {Object.entries(health.services).map(([key, value]) => (
                  <StatusRow
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    status={value === 'healthy' || value === 'configured'}
                    value={value}
                  />
                ))}
                <p
                  className="text-xs mt-2"
                  style={{ color: 'var(--uni-text-subtle)' }}
                >
                  Version: {health.version} · {health.environment}
                </p>
              </div>
            ) : (
              <p
                className="text-sm"
                style={{ color: 'var(--uni-text-muted)' }}
              >
                Checking system status...
              </p>
            )}
          </SettingsSection>
        </div>
      </div>
    </Shell>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--uni-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} style={{ color: 'var(--uni-cyan-400)' }} />
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--uni-text-secondary)' }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: 'var(--uni-text-muted)' }}>
        {label}
      </span>
      <span className="text-sm font-medium" style={{ color: 'var(--uni-text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

function StatusRow({
  label,
  status,
  value,
}: {
  label: string;
  status: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: 'var(--uni-text-muted)' }}>
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {status ? (
          <CheckCircle size={14} style={{ color: 'var(--uni-success)' }} />
        ) : (
          <XCircle size={14} style={{ color: 'var(--uni-error)' }} />
        )}
        <span
          className="text-xs capitalize"
          style={{ color: status ? 'var(--uni-success)' : 'var(--uni-error)' }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
