/**
 * TanStack Query hooks for sync and account management.
 * Gmail/Outlook linking uses Supabase OAuth directly (no backend needed).
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { supabase } from '../lib/supabaseClient';

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

/**
 * Initiate Gmail OAuth linking via Supabase.
 * Uses Supabase's built-in Google OAuth flow — no backend call needed.
 */
export function useLinkGmail() {
  const setLinking = useAuthStore.getState().setLinking;
  const pushToast = useUIStore.getState().pushToast;

  return useMutation({
    mutationFn: async () => {
      setLinking(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'https://www.googleapis.com/auth/gmail.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Supabase handles the redirect automatically
      return data;
    },
    onError: (error) => {
      setLinking(false);
      pushToast({
        message: error instanceof Error
          ? error.message
          : 'Failed to connect Gmail. Check your Supabase Google OAuth settings.',
        type: 'error',
      });
    },
  });
}

/**
 * Initiate Outlook OAuth linking via Supabase.
 * Uses Supabase's built-in Azure/Microsoft OAuth flow.
 */
export function useLinkOutlook() {
  const setLinking = useAuthStore.getState().setLinking;
  const pushToast = useUIStore.getState().pushToast;

  return useMutation({
    mutationFn: async () => {
      setLinking(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid email profile Mail.Read offline_access',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onError: (error) => {
      setLinking(false);
      pushToast({
        message: error instanceof Error
          ? error.message
          : 'Failed to connect Outlook. Check your Supabase Azure OAuth settings.',
        type: 'error',
      });
    },
  });
}

/**
 * Verify Supabase token and get internal JWT.
 */
export function useVerifyToken() {
  const { setInternalToken } = useAuthStore.getState();

  return useMutation({
    mutationFn: async (accessToken: string) => {
      return apiFetch<{
        internal_token: string;
        user_id: string;
        email: string;
        expires_at: string;
      }>('/auth/verify-token', {
        method: 'POST',
        body: JSON.stringify({ access_token: accessToken }),
      });
    },
    onSuccess: (data) => {
      setInternalToken(data.internal_token);
    },
  });
}

/**
 * Health check query — gracefully handles backend being down.
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      try {
        return await apiFetch<{
          status: string;
          version: string;
          environment: string;
          services: Record<string, string>;
        }>('/health');
      } catch {
        // Backend not running — return a default status
        return {
          status: 'offline',
          version: '1.0.0',
          environment: 'development',
          services: {
            backend: 'offline',
            redis: 'unknown',
            supabase: 'unknown',
            ai: 'unknown',
          },
        };
      }
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: false,
  });
}
