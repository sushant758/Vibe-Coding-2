'use client';

import { useEffect, useRef } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-amber-50/95 border border-amber-900/20 text-stone-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 backdrop-blur-md relative my-8">
        <div className="flex justify-between items-center pb-3 border-b border-stone-300/60 mb-5">
          <h2 className="text-xl font-bold tracking-tight text-stone-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
