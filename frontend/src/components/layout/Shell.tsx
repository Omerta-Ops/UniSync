/**
 * Application Shell — 3-column responsive layout.
 * Sidebar (accounts/filters) | Main (email list) | Detail panel
 */

import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useUIStore } from '../../store/uiStore';

interface ShellProps {
  children: ReactNode;
  detailPanel?: ReactNode;
}

export function Shell({ children, detailPanel }: ShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const selectedEmailId = useUIStore((s) => s.selectedEmailId);

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{
        background: 'var(--uni-gradient-bg)',
        fontFamily: 'var(--uni-font-family)',
      }}
    >
      {/* Top Bar */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className="transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0"
          style={{
            width: sidebarOpen ? '280px' : '0px',
          }}
        >
          <Sidebar />
        </div>

        {/* Email List */}
        <div
          className="flex-1 min-w-0 overflow-hidden border-r"
          style={{ borderColor: 'var(--uni-border-subtle)' }}
        >
          {children}
        </div>

        {/* Detail Panel */}
        {selectedEmailId && detailPanel && (
          <div
            className="hidden lg:block overflow-hidden"
            style={{
              width: '480px',
              flexShrink: 0,
            }}
          >
            {detailPanel}
          </div>
        )}
      </div>
    </div>
  );
}
