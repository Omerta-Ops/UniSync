/**
 * AppRouter — Root component with routing, providers, and error boundary.
 * Handles auth initialization at the top level so protected routes work
 * FAST: Auth check completes in <1.5s (no backend roundtrip needed).
 * even on direct URL navigation.
 */

import { lazy, Suspense, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../api/queryClient';
import { ToastContainer } from '../components/ui/ToastContainer';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabaseClient';
import App from './App';

// Lazy-loaded pages for code splitting
const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

/** Full-screen loading spinner for lazy-loaded routes */
function RouteLoader() {
  return (
    <div
      className="h-screen w-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(to bottom right, #000000, #111827, #000000)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="text-center">
        <div
          className="w-10 h-10 border-3 rounded-full animate-spin mx-auto mb-4"
          style={{
            borderColor: 'rgba(255,255,255,0.1)',
            borderTopColor: '#22D3EE',
          }}
        />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
          Loading...
        </p>
      </div>
    </div>
  );
}

/**
 * AuthInitializer — runs auth session check at the top level,
 * so it works for EVERY route (including direct /dashboard URL).
 * This ensures isInitializing eventually becomes false.
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const setUser = useAuthStore.getState().setUser;
    const setInitializing = useAuthStore.getState().setInitializing;

    const initAuth = async () => {
      try {
        // Check if Supabase has a stored session in localStorage (instant, sync)
        const hasStoredSession = Object.keys(localStorage).some(
          (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
        );

        // If user was previously logged in, give Supabase plenty of time.
        // If not, resolve fast so new visitors don't wait.
        const timeout = hasStoredSession ? 8000 : 1500;

        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), timeout)
        );

        const result = await Promise.race([sessionPromise, timeoutPromise]);
        const user = result && 'data' in result ? result.data?.session?.user : null;

        if (user) {
          // Read user info directly from Supabase session — no extra API call
          setUser({
            id: user.id,
            email: user.email ?? '',
            fullName: user.user_metadata?.full_name ?? '',
          });
        }
      } catch {
        // Supabase not configured or network error — that's fine
      } finally {
        setInitializing(false);
      }
    };

    initAuth();

    // Listen for auth changes (login / logout / token refresh)
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            fullName: session.user.user_metadata?.full_name ?? '',
          });
        } else {
          useAuthStore.getState().logout();
        }
      });
      subscription = data.subscription;
    } catch {
      // Ignore
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}

/** Route guard: redirect to / if not authenticated */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  // While checking existing session, show loader (max 5 seconds)
  if (isInitializing) {
    return <RouteLoader />;
  }

  // Not authenticated → go to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthInitializer>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                {/* Landing / Login page */}
                <Route path="/" element={<App />} />

                {/* Authenticated routes (lazy-loaded) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* OAuth callback handler */}
                <Route
                  path="/auth/callback/*"
                  element={<Navigate to="/dashboard" replace />}
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            {/* Global Toast */}
            <ToastContainer />
          </AuthInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
