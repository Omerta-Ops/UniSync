/**
 * TopBar — Search, toggle sidebar, user menu.
 */

import { Menu, Search, Bell, LogOut, User, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export function TopBar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const zustandLogout = useAuthStore((s) => s.logout);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    zustandLogout();
    navigate('/');
  };

  const handleSettings = () => {
    setShowUserMenu(false);
    navigate('/settings');
  };

  return (
    <header
      className="flex items-center justify-between px-4 py-3 flex-shrink-0"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'var(--uni-backdrop-blur)',
        borderBottom: '1px solid var(--uni-border-subtle)',
        zIndex: 'var(--uni-z-topbar)',
      }}
    >
      {/* Left: Menu + Search */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--uni-text-muted)' }}
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div
          className="relative flex items-center max-w-md flex-1"
        >
          <Search
            size={16}
            className="absolute left-3"
            style={{ color: 'var(--uni-text-subtle)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm transition-all focus:outline-none"
            style={{
              background: 'var(--uni-surface-elevated)',
              color: 'var(--uni-text-primary)',
              border: '1px solid var(--uni-border-subtle)',
              fontFamily: 'var(--uni-font-family)',
            }}
          />
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 rounded-lg transition-colors relative"
          style={{ color: 'var(--uni-text-muted)' }}
        >
          <Bell size={18} />
          {/* Notification dot */}
          <div
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--uni-cyan-400)' }}
          />
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-2 rounded-lg transition-colors"
            style={{ color: 'var(--uni-text-muted)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{
                background: 'var(--uni-gradient-primary)',
                color: 'var(--uni-text-primary)',
              }}
            >
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl py-2"
              style={{
                background: 'rgba(17, 24, 39, 0.95)',
                backdropFilter: 'var(--uni-backdrop-blur-xl)',
                border: '1px solid var(--uni-border-glass)',
                boxShadow: 'var(--uni-shadow-card)',
                zIndex: 100,
              }}
            >
              <div className="px-4 py-2 mb-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--uni-text-primary)' }}
                >
                  {user?.fullName || 'User'}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--uni-text-muted)' }}
                >
                  {user?.email}
                </p>
              </div>
              <div
                className="mx-2 mb-1"
                style={{ height: '1px', background: 'var(--uni-border-subtle)' }}
              />
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                style={{ color: 'var(--uni-text-muted)' }}
              >
                <Settings size={14} />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                style={{ color: 'var(--uni-error)' }}
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
