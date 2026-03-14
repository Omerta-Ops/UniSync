/**
 * Sidebar — Account switcher, navigation, and filters.
 */

import {
  Mail,
  Shield,
  Calendar,
  Settings,
  Inbox,
  Eye,
  AlertTriangle,
  Archive,
  Link,
  LinkIcon,
} from 'lucide-react';
import { useUIStore, type FilterType } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';

const filters: { key: FilterType; label: string; icon: typeof Inbox }[] = [
  { key: 'all', label: 'All Mail', icon: Inbox },
  { key: 'unread', label: 'Unread', icon: Eye },
  { key: 'high_risk', label: 'High Risk', icon: AlertTriangle },
  { key: 'archived', label: 'Archived', icon: Archive },
];

export function Sidebar() {
  const activeFilter = useUIStore((s) => s.activeFilter);
  const setFilter = useUIStore((s) => s.setFilter);
  const linkedAccounts = useAuthStore((s) => s.linkedAccounts);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="h-full flex flex-col py-4 px-3 overflow-y-auto"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'var(--uni-backdrop-blur)',
        borderRight: '1px solid var(--uni-border-subtle)',
      }}
    >
      {/* Brand / User */}
      <div className="px-3 mb-6">
        <h2
          className="text-lg font-semibold mb-1"
          style={{ color: 'var(--uni-text-primary)' }}
        >
          UniSync
        </h2>
        {user && (
          <p
            className="text-xs truncate"
            style={{ color: 'var(--uni-text-muted)' }}
          >
            {user.email}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-1 mb-6">
        <NavItem
          icon={Mail}
          label="Inbox"
          active={location.pathname === '/dashboard'}
          onClick={() => navigate('/dashboard')}
        />
        <NavItem
          icon={Calendar}
          label="Calendar"
          active={false}
          onClick={() => {}}
        />
        <NavItem
          icon={Settings}
          label="Settings"
          active={location.pathname === '/settings'}
          onClick={() => navigate('/settings')}
        />
      </nav>

      {/* Divider */}
      <div
        className="mx-3 mb-4"
        style={{
          height: '1px',
          background: 'var(--uni-border-subtle)',
        }}
      />

      {/* Filters */}
      <div className="px-3 mb-3">
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--uni-text-subtle)' }}
        >
          Filters
        </p>
      </div>
      <div className="space-y-1 mb-6">
        {filters.map((f) => (
          <NavItem
            key={f.key}
            icon={f.icon}
            label={f.label}
            active={activeFilter === f.key && location.pathname === '/dashboard'}
            onClick={() => {
              setFilter(f.key);
              navigate('/dashboard');
            }}
          />
        ))}
      </div>

      {/* Divider */}
      <div
        className="mx-3 mb-4"
        style={{
          height: '1px',
          background: 'var(--uni-border-subtle)',
        }}
      />

      {/* Linked Accounts */}
      <div className="px-3 mb-3">
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--uni-text-subtle)' }}
        >
          Accounts
        </p>
      </div>
      <div className="space-y-2 flex-1">
        {linkedAccounts.length === 0 ? (
          <div className="px-3 py-2">
            <p
              className="text-xs"
              style={{ color: 'var(--uni-text-subtle)' }}
            >
              No accounts linked yet.
            </p>
            <button
              onClick={() => navigate('/settings')}
              className="mt-2 text-xs flex items-center gap-1.5 transition-colors"
              style={{ color: 'var(--uni-cyan-400)' }}
            >
              <LinkIcon size={12} />
              Link an account
            </button>
          </div>
        ) : (
          linkedAccounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: 'var(--uni-surface-elevated)',
              }}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: account.isActive
                    ? 'var(--uni-success)'
                    : 'var(--uni-text-subtle)',
                }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: 'var(--uni-text-secondary)' }}
                >
                  {account.emailAddress}
                </p>
                <p
                  className="text-xs capitalize"
                  style={{ color: 'var(--uni-text-subtle)' }}
                >
                  {account.provider}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Nav Item Component ─────────────────────────────────────────────────

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Inbox;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
      style={{
        background: active
          ? 'rgba(6, 182, 212, 0.15)'
          : 'transparent',
        color: active
          ? 'var(--uni-cyan-400)'
          : 'var(--uni-text-muted)',
        borderLeft: active
          ? '2px solid var(--uni-cyan-400)'
          : '2px solid transparent',
      }}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}
