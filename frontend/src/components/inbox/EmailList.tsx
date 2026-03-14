/**
 * EmailList — Virtualized, infinite-scroll email list.
 * Uses @tanstack/react-virtual for 60fps with 5000+ emails.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EmailCard } from './EmailCard';
import { useEmails, useArchiveEmail, usePrefetchEmail } from '../../api/useEmails';
import { useUIStore } from '../../store/uiStore';

export function EmailList() {
  const selectedEmailId = useUIStore((s) => s.selectedEmailId);
  const selectEmail = useUIStore((s) => s.selectEmail);
  const pendingArchives = useUIStore((s) => s.pendingArchives);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useEmails();

  const archiveMutation = useArchiveEmail();
  const prefetchEmail = usePrefetchEmail();

  // Flatten all pages into a single array of emails
  const allEmails = data?.pages.flatMap((p) => p.emails) ?? [];

  // Filter out pending archives for optimistic UI
  const visibleEmails = allEmails.filter(
    (e) => !pendingArchives.has(e.id)
  );

  // Scroll container ref
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtual list
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? visibleEmails.length + 1 : visibleEmails.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88, // Estimated row height
    overscan: 10,
  });

  // Infinite scroll: fetch next page when we're near the bottom
  useEffect(() => {
    const items = rowVirtualizer.getVirtualItems();
    const lastItem = items[items.length - 1];

    if (
      lastItem &&
      lastItem.index >= visibleEmails.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    rowVirtualizer.getVirtualItems(),
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    visibleEmails.length,
  ]);

  const handleSelect = useCallback(
    (id: string) => selectEmail(id),
    [selectEmail]
  );

  const handleArchive = useCallback(
    (id: string) => archiveMutation.mutate(id),
    [archiveMutation]
  );

  const handlePrefetch = useCallback(
    (id: string) => prefetchEmail(id),
    [prefetchEmail]
  );

  // ── Loading State ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonEmailCard key={i} />
        ))}
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div
            className="text-4xl mb-4"
            style={{ color: 'var(--uni-error)' }}
          >
            ⚠️
          </div>
          <p
            className="text-sm mb-3"
            style={{ color: 'var(--uni-text-muted)' }}
          >
            {(error as Error)?.message || 'Failed to load emails'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'var(--uni-gradient-primary)',
              color: 'var(--uni-text-primary)',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Empty State ──────────────────────────────────────────────────────
  if (visibleEmails.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-5xl mb-4"></div>
          <p
            className="text-lg font-medium mb-1"
            style={{ color: 'var(--uni-text-primary)' }}
          >
            Your inbox is Empty
          </p>
          <p
            className="text-sm"
            style={{ color: 'var(--uni-text-muted)' }}
          >
            All caught up! New emails will appear here.
          </p>
        </div>
      </div>
    );
  }

  // ── Email List ───────────────────────────────────────────────────────
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= visibleEmails.length;
          if (isLoaderRow) {
            return (
              <div
                key="loader"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="flex items-center justify-center py-4">
                  <div
                    className="animate-spin w-5 h-5 border-2 rounded-full"
                    style={{
                      borderColor: 'var(--uni-border-subtle)',
                      borderTopColor: 'var(--uni-cyan-400)',
                    }}
                  />
                </div>
              </div>
            );
          }

          const email = visibleEmails[virtualRow.index];
          return (
            <div
              key={email.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <EmailCard
                email={email}
                isSelected={selectedEmailId === email.id}
                onSelect={handleSelect}
                onArchive={handleArchive}
                onPrefetch={handlePrefetch}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Skeleton Loader ────────────────────────────────────────────────────

function SkeletonEmailCard() {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3"
      style={{ borderBottom: '1px solid var(--uni-border-subtle)' }}
    >
      {/* Avatar skeleton */}
      <div
        className="w-10 h-10 rounded-full animate-pulse flex-shrink-0"
        style={{ background: 'var(--uni-surface-elevated)' }}
      />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div
            className="h-3.5 rounded animate-pulse"
            style={{
              background: 'var(--uni-surface-elevated)',
              width: '120px',
            }}
          />
          <div
            className="h-3 rounded animate-pulse"
            style={{
              background: 'var(--uni-surface-elevated)',
              width: '40px',
            }}
          />
        </div>
        <div
          className="h-3.5 rounded animate-pulse"
          style={{
            background: 'var(--uni-surface-elevated)',
            width: '80%',
          }}
        />
        <div
          className="h-3 rounded animate-pulse"
          style={{
            background: 'var(--uni-surface-elevated)',
            width: '60%',
          }}
        />
      </div>
    </div>
  );
}
