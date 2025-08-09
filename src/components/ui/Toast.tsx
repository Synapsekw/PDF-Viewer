import React, { useEffect } from 'react';
import { Check, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 3000,
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
  };

  const styles = {
    success: 'bg-green-900/90 text-green-200 border-green-700',
    error: 'bg-red-900/90 text-red-200 border-red-700',
    info: 'bg-blue-900/90 text-blue-200 border-blue-700',
    warning: 'bg-yellow-900/90 text-yellow-200 border-yellow-700',
  };

  return (
    <div className={`
      fixed bottom-4 right-4 z-50 
      flex items-center gap-3 px-4 py-3 
      rounded-lg backdrop-blur-md border
      shadow-xl animate-slide-up
      ${styles[type]}
    `}>
      {icons[type]}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
