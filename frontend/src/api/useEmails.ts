/**
 * TanStack Query hooks for email data.
 * Server-state management — cached, paginated, with optimistic updates.
 * Gracefully handles missing backend (shows empty state, not errors).
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useUIStore, type FilterType } from '../store/uiStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Types ──────────────────────────────────────────────────────────────

export interface EmailSummary {
  id: string;
  account_id: string;
  message_id: string;
  sender: string;
  sender_name: string | null;
  subject: string | null;
  snippet: string | null;
  received_at: string;
  is_read: boolean;
  is_archived: boolean;
  is_starred: boolean;
  risk_score: 'low' | 'medium' | 'high' | null;
  summary_bullets: string[] | null;
  processing_status: 'pending' | 'processing' | 'done' | 'failed';
  attachment_count?: number;
}

export interface EmailDetail extends EmailSummary {
  thread_id: string | null;
  recipients: string[];
  body_text: string | null;
  labels: string[];
  risk_reasons: string[] | null;
  raw_headers: Record<string, string> | null;
  processing_error: string | null;
  processed_at: string | null;
  suggested_events: SuggestedEvent[];
  attachments?: Attachment[];
  created_at: string;
}

export interface SuggestedEvent {
  id: string;
  email_id: string;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string | null;
  location: string | null;
  is_all_day: boolean;
  confirmed_at: string | null;
  gcal_event_id: string | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  download_url: string | null;
}

interface EmailListResponse {
  emails: EmailSummary[];
  next_cursor: string | null;
}

// ── Fetch Helper ───────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().internalToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!resp.ok) {
    const error = await resp.json().catch(() => ({ detail: resp.statusText }));
    throw new Error(error.detail || 'Request failed');
  }

  return resp.json();
}

// ── Hooks ──────────────────────────────────────────────────────────────

/** Filter → query params mapping */
function filterToParams(filter: FilterType): string {
  switch (filter) {
    case 'unread':
      return '&is_read=false';
    case 'high_risk':
      return '&risk_score=high';
    case 'archived':
      return '&is_archived=true';
    default:
      return '&is_archived=false';
  }
}

/**
 * Infinite query for the email list.
 * Cursor-based pagination with filter support.
 * Returns empty list on network error (backend not running) instead of error state.
 */
export function useEmails() {
  const filter = useUIStore((s) => s.activeFilter);

  return useInfiniteQuery<EmailListResponse>({
    queryKey: ['emails', filter],
    queryFn: async ({ pageParam }) => {
      try {
        const cursorParam = pageParam ? `&cursor=${pageParam}` : '';
        return await apiFetch<EmailListResponse>(
          `/emails?limit=50${filterToParams(filter)}${cursorParam}`
        );
      } catch (err) {
        // If backend is unreachable, return empty list instead of throwing
        if (
          err instanceof TypeError && err.message.includes('fetch') ||
          (err as any)?.message?.includes('Failed to fetch') ||
          (err as any)?.message?.includes('NetworkError') ||
          (err as any)?.message?.includes('Load failed')  // Safari specific
        ) {
          console.warn('[useEmails] Backend unreachable, returning empty list');
          return { emails: [], next_cursor: null };
        }
        throw err; // Re-throw real API errors (401, 500, etc.)
      }
    },
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    retry: (failureCount, error) => {
      // Don't retry network errors (backend not running)
      if (
        error instanceof TypeError ||
        (error as any)?.message?.includes('Failed to fetch') ||
        (error as any)?.message?.includes('Load failed')
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Single email detail query.
 * Auto-triggered when an email is selected.
 */
export function useEmailDetail(emailId: string | null) {
  return useQuery<EmailDetail>({
    queryKey: ['email', emailId],
    queryFn: () => apiFetch<EmailDetail>(`/emails/${emailId}`),
    enabled: !!emailId,
  });
}

/**
 * Prefetch email detail on hover.
 * Called after 200ms hover debounce.
 */
export function usePrefetchEmail() {
  const qc = useQueryClient();

  return (emailId: string) => {
    qc.prefetchQuery({
      queryKey: ['email', emailId],
      queryFn: () => apiFetch<EmailDetail>(`/emails/${emailId}`),
      staleTime: 60 * 1000,
    });
  };
}

/**
 * Archive email mutation with optimistic update.
 */
export function useArchiveEmail() {
  const qc = useQueryClient();
  const { addPendingArchive, removePendingArchive, pushToast } = useUIStore.getState();

  return useMutation({
    mutationFn: async (emailId: string) => {
      return apiFetch(`/emails/${emailId}/archive`, {
        method: 'POST',
        body: JSON.stringify({ is_archived: true }),
      });
    },
    onMutate: async (emailId) => {
      addPendingArchive(emailId);

      // Cancel outgoing refetches
      await qc.cancelQueries({ queryKey: ['emails'] });

      // Snapshot previous data
      const previous = qc.getQueryData(['emails']);

      // Optimistically remove from list
      qc.setQueriesData({ queryKey: ['emails'] }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: EmailListResponse) => ({
            ...page,
            emails: page.emails.filter((e) => e.id !== emailId),
          })),
        };
      });

      return { previous };
    },
    onError: (_err, emailId, context) => {
      // Rollback
      if (context?.previous) {
        qc.setQueriesData({ queryKey: ['emails'] }, context.previous);
      }
      removePendingArchive(emailId);
      pushToast({
        message: 'Failed to archive email. Please try again.',
        type: 'error',
      });
    },
    onSettled: (_data, _err, emailId) => {
      removePendingArchive(emailId);
      qc.invalidateQueries({ queryKey: ['emails'] });
    },
  });
}
