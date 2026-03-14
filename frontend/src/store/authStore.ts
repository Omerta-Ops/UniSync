/**
 * Zustand Auth Store — Authentication state.
 * Manages: Supabase user, internal JWT, linked email accounts.
 */

import { create } from 'zustand';

export interface LinkedAccount {
  id: string;
  provider: 'gmail' | 'outlook';
  emailAddress: string;
  isActive: boolean;
  lastSyncAt: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

interface AuthState {
  // User state
  user: AuthUser | null;
  internalToken: string | null;
  isAuthenticated: boolean;

  // Linked accounts
  linkedAccounts: LinkedAccount[];
  isLinking: boolean;

  // Loading
  isInitializing: boolean;

  // Actions
  setUser: (user: AuthUser | null) => void;
  setInternalToken: (token: string | null) => void;
  addLinkedAccount: (account: LinkedAccount) => void;
  removeLinkedAccount: (accountId: string) => void;
  updateLinkedAccount: (accountId: string, updates: Partial<LinkedAccount>) => void;
  setLinkedAccounts: (accounts: LinkedAccount[]) => void;
  setLinking: (linking: boolean) => void;
  setInitializing: (init: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  internalToken: null,
  isAuthenticated: false,
  linkedAccounts: [],
  isLinking: false,
  isInitializing: true,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setInternalToken: (token) =>
    set({ internalToken: token }),

  addLinkedAccount: (account) =>
    set((s) => ({
      linkedAccounts: [...s.linkedAccounts, account],
    })),

  removeLinkedAccount: (accountId) =>
    set((s) => ({
      linkedAccounts: s.linkedAccounts.filter((a) => a.id !== accountId),
    })),

  updateLinkedAccount: (accountId, updates) =>
    set((s) => ({
      linkedAccounts: s.linkedAccounts.map((a) =>
        a.id === accountId ? { ...a, ...updates } : a
      ),
    })),

  setLinkedAccounts: (accounts) =>
    set({ linkedAccounts: accounts }),

  setLinking: (linking) =>
    set({ isLinking: linking }),

  setInitializing: (init) =>
    set({ isInitializing: init }),

  logout: () =>
    set({
      user: null,
      internalToken: null,
      isAuthenticated: false,
      linkedAccounts: [],
      isLinking: false,
    }),
}));
