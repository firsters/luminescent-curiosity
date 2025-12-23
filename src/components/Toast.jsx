import { useEffect } from 'react';

export default function Toast({ message, isVisible, onClose, duration = 2000 }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-[100] w-full max-w-sm -translate-x-1/2 px-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
      <div className="flex items-center justify-center rounded-full bg-gray-900/90 px-6 py-3 text-center shadow-lg backdrop-blur-sm dark:bg-white/90">
        <span className="text-sm font-bold text-white dark:text-gray-900">{message}</span>
      </div>
    </div>
  );
}
