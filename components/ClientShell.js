'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from './Navbar';
import { ToastProvider } from './Toast';

const CricketScene = dynamic(() => import('./CricketScene'), {
  ssr: false,
});

function BackdropOverlay() {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login' || pathname === '/';

  return (
    <div
      tabIndex={-1}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none -z-[5] transition-all duration-700 ${
        isLoginPage ? 'bg-transparent' : 'bg-stone-900/30 backdrop-blur-[3px]'
      }`}
    />
  );
}

export default function ClientShell({ children }) {
  return (
    <ToastProvider>
      {/* 3D Scene persistent in root */}
      <CricketScene />

      {/* Dim / soft blur overlay on pages other than login */}
      <Suspense fallback={<div className="fixed inset-0 pointer-events-none -z-[5] bg-stone-900/30 backdrop-blur-[3px]" />}>
        <BackdropOverlay />
      </Suspense>

      {/* Global Navbar */}
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      {/* Page Content */}
      <main className="relative z-10 min-h-screen pt-16">{children}</main>
    </ToastProvider>
  );
}
