/**
 * TanStack Query hooks for calendar operations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import type { SuggestedEvent } from './useEmails';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

interface CalendarEventsResponse {
  events: SuggestedEvent[];
}

/**
 * Fetch suggested calendar events.
 */
export function useSuggestedEvents(confirmed?: boolean) {
  const confirmedParam = confirmed !== undefined ? `&confirmed=${confirmed}` : '';

  return useQuery<CalendarEventsResponse>({
    queryKey: ['calendar', 'suggested', confirmed],
    queryFn: () =>
      apiFetch<CalendarEventsResponse>(
        `/calendar/suggested-events?limit=50${confirmedParam}`
      ),
  });
}

/**
 * Confirm and sync an event to Google Calendar.
 */
export function useConfirmEvent() {
  const qc = useQueryClient();
  const pushToast = useUIStore.getState().pushToast;

  return useMutation({
    mutationFn: async ({
      eventId,
      overrides,
    }: {
      eventId: string;
      overrides?: {
        title?: string;
        start_datetime?: string;
        end_datetime?: string;
        location?: string;
      };
    }) => {
      return apiFetch(`/calendar/confirm/${eventId}`, {
        method: 'POST',
        body: JSON.stringify(overrides || {}),
      });
    },
    onSuccess: () => {
      pushToast({
        message: 'Event sent to Google Calendar!',
        type: 'success',
      });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
    onError: () => {
      pushToast({
        message: 'Failed to sync event. Please try again.',
        type: 'error',
      });
    },
  });
}
