/**
 * Zustand UI Store — Client-side ephemeral state.
 * Manages: selected email, sidebar, filters, optimistic archives, toasts, modals.
 */

import { create } from 'zustand';

export type FilterType = 'all' | 'unread' | 'high_risk' | 'archived';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface CalendarModalData {
  eventId: string;
  title: string;
  startDatetime: string;
  endDatetime?: string;
  location?: string;
}

interface UIState {
  // Selection
  selectedEmailId: string | null;

  // Sidebar
  sidebarOpen: boolean;

  // Filters
  activeFilter: FilterType;

  // Optimistic updates tracking
  pendingArchives: Set<string>;

  // Calendar modal
  calendarModalData: CalendarModalData | null;

  // Toasts
  toasts: Toast[];

  // Actions
  selectEmail: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setFilter: (filter: FilterType) => void;
  addPendingArchive: (emailId: string) => void;
  removePendingArchive: (emailId: string) => void;
  openCalendarModal: (data: CalendarModalData) => void;
  closeCalendarModal: () => void;
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

let toastCounter = 0;

export const useUIStore = create<UIState>((set, get) => ({
  selectedEmailId: null,
  sidebarOpen: true,
  activeFilter: 'all',
  pendingArchives: new Set(),
  calendarModalData: null,
  toasts: [],

  selectEmail: (id) => set({ selectedEmailId: id }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setFilter: (filter) => set({ activeFilter: filter, selectedEmailId: null }),

  addPendingArchive: (emailId) =>
    set((s) => {
      const next = new Set(s.pendingArchives);
      next.add(emailId);
      return { pendingArchives: next };
    }),

  removePendingArchive: (emailId) =>
    set((s) => {
      const next = new Set(s.pendingArchives);
      next.delete(emailId);
      return { pendingArchives: next };
    }),

  openCalendarModal: (data) => set({ calendarModalData: data }),

  closeCalendarModal: () => set({ calendarModalData: null }),

  pushToast: (toast) => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));

    // Auto-dismiss after duration
    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      get().dismissToast(id);
    }, duration);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
