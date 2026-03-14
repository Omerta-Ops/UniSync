import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../store/authStore';

export interface AuthState {
  user: { id: string; email: string; fullName: string } | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Wraps a promise with a timeout.
 * Safari blocks third-party cookies and can cause Supabase calls to hang.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms)
    ),
  ]);
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
  });

  const setZustandUser = useAuthStore((s) => s.setUser);
  const zustandLogout = useAuthStore((s) => s.logout);

  // ── Login (directly via Supabase Auth) ─────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000 // 10 second timeout
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Login failed — no user returned');
      }

      const user = {
        id: data.user.id,
        email: data.user.email || email,
        fullName: data.user.user_metadata?.full_name || '',
      };

      setAuthState({ user, isLoading: false, error: null });
      setZustandUser(user);
      return { success: true, user };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [setZustandUser]);

  // ── Register (directly via Supabase Auth) ──────────────────────────
  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
            },
          }),
          10000
        );

        if (error) {
          throw new Error(error.message);
        }

        if (!data.user) {
          throw new Error('Registration failed — no user returned');
        }

        const user = {
          id: data.user.id,
          email: data.user.email || email,
          fullName,
        };

        setAuthState({ user, isLoading: false, error: null });
        setZustandUser(user);
        return { success: true, user };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Registration failed';
        setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },
    [setZustandUser],
  );

  // ── Logout ───────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await withTimeout(supabase.auth.signOut(), 5000);
    } catch {
      // Ignore timeout on sign out
    }
    setAuthState({ user: null, isLoading: false, error: null });
    zustandLogout();
  }, [zustandLogout]);

  // ── Forgot password ──────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email),
        10000
      );

      if (error) {
        throw new Error(error.message);
      }

      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send reset email';
      setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // ── Reset password ───────────────────────────────────────────────────
  const resetPassword = useCallback(
    async (_token: string, password: string) => {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const { error } = await withTimeout(
          supabase.auth.updateUser({ password }),
          10000
        );

        if (error) {
          throw new Error(error.message);
        }

        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Password reset failed';
        setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        return { success: false, error: errorMessage };
      }
    },
    [],
  );

  return {
    ...authState,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
  };
};
