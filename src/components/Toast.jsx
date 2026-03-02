import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const TOAST_DURATION = 4000;

const icons = {
  success: { Icon: CheckCircle, color: '#059669', bg: '#d1fae5' },
  error: { Icon: AlertCircle, color: '#dc2626', bg: '#fee2e2' },
  warning: { Icon: AlertTriangle, color: '#d97706', bg: '#fef3c7' },
  info: { Icon: Info, color: '#2563eb', bg: '#dbeafe' }
};

export function Toast({ message, type = 'info', onClose }) {
  const { Icon, color, bg } = icons[type] || icons.info;

  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: bg,
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      marginBottom: '8px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <Icon size={20} style={{ color, flexShrink: 0 }} />
      <span style={{ color: '#1f2937', fontSize: '14px', flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#6b7280',
          padding: '4px',
          display: 'flex'
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: '90%',
      maxWidth: '400px'
    }}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Toast hook for easy usage
let toastCounter = 0;
const toastListeners = new Set();
let currentToasts = [];

export const showToast = (message, type = 'info') => {
  const id = ++toastCounter;
  const toast = { id, message, type };
  currentToasts = [...currentToasts, toast];
  toastListeners.forEach(listener => listener(currentToasts));
  
  // Auto remove after duration
  setTimeout(() => {
    currentToasts = currentToasts.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener(currentToasts));
  }, TOAST_DURATION + 300);
  
  return id;
};

export const useToasts = () => {
  const [toasts, setToasts] = useState(currentToasts);

  useEffect(() => {
    toastListeners.add(setToasts);
    return () => toastListeners.delete(setToasts);
  }, []);

  const removeToast = (id) => {
    currentToasts = currentToasts.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener(currentToasts));
  };

  return { toasts, removeToast };
};
