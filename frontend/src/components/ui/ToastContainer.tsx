/**
 * ToastContainer — Renders toast notifications from the Zustand store.
 */

import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';

const toastStyles: Record<string, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: '✅',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '❌',
  },
  info: {
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.3)',
    icon: 'ℹ️',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: '⚠️',
  },
};

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] space-y-2"
      style={{ maxWidth: '380px' }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                backdropFilter: 'var(--uni-backdrop-blur-xl)',
              }}
            >
              <span className="text-sm">{style.icon}</span>
              <p
                className="flex-1 text-sm"
                style={{ color: 'var(--uni-text-primary)' }}
              >
                {toast.message}
              </p>
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded transition-colors flex-shrink-0"
                style={{ color: 'var(--uni-text-subtle)' }}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
