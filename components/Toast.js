'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all transform duration-300 max-w-sm border ${
              toast.type === 'success'
                ? 'bg-emerald-700/90 border-emerald-500/50 backdrop-blur-md'
                : toast.type === 'error'
                ? 'bg-rose-700/90 border-rose-500/50 backdrop-blur-md'
                : 'bg-indigo-700/90 border-indigo-500/50 backdrop-blur-md'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback noop if outside provider
    return () => {};
  }
  return context;
}
