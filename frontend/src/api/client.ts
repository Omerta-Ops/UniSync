import { supabase } from '../lib/supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ── Public types consumed by the rest of the app ────────────────────────
export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Map a Supabase user object into our app-level User shape. */
function mapUser(supaUser: SupabaseUser): User {
  return {
    id: supaUser.id,
    email: supaUser.email ?? '',
    fullName:
      (supaUser.user_metadata?.full_name as string) ??
      (supaUser.user_metadata?.fullName as string) ??
      '',
    createdAt: supaUser.created_at,
  };
}

// ── API client (Supabase-backed) ────────────────────────────────────────
export const apiClient = {
  // ─── Auth ───────────────────────────────────────────────────────────

  async register(
    email: string,
    password: string,
    fullName: string,
  ): Promise<ApiResponse<AuthResponse>> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (!data.user) {
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }

    return {
      success: true,
      message: 'Account created successfully! Please check your email to confirm.',
      data: { user: mapUser(data.user) },
    };
  },

  async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<AuthResponse>> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (!data.user) {
      return { success: false, message: 'Login failed. Please try again.' };
    }

    return {
      success: true,
      message: 'Logged in successfully.',
      data: { user: mapUser(data.user) },
    };
  },

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Password reset email sent. Check your inbox.',
    };
  },

  async resetPassword(
    _token: string,
    newPassword: string,
  ): Promise<ApiResponse<null>> {
    // Supabase handles the token via the URL redirect –
    // by the time the user lands on /reset-password the session is already set.
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Password updated successfully.' };
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  // ─── Session helpers ────────────────────────────────────────────────

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, message: error?.message ?? 'Not authenticated' };
    }

    return { success: true, message: 'OK', data: mapUser(user) };
  },
};
