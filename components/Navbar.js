'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ACADEMY_NAME } from '@/lib/config';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.email) setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading || !user) return null;

  const roleBadgeColor = {
    coach: 'bg-blue-600',
    scout: 'bg-green-600',
    player: 'bg-purple-600',
  };

  const navLinks = {
    coach: [
      { href: '/coach/dashboard', label: 'Dashboard' },
      { href: '/coach/players', label: 'Players' },
      { href: '/coach/sessions', label: 'Sessions' },
      { href: '/coach/matches', label: 'Matches' },
    ],
    scout: [
      { href: '/scout', label: 'Ready Players' },
    ],
    player: [
      { href: '/player', label: 'My Row' },
    ],
  };

  const links = navLinks[user.role] || [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">Academy Desk</span>
              <span className="text-sm text-gray-500 hidden sm:inline">| {ACADEMY_NAME}</span>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); router.push(link.href); }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === link.href || pathname.startsWith(link.href + '/')
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs text-white font-medium ${roleBadgeColor[user.role] || 'bg-gray-600'}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex items-center space-x-1 pb-2 overflow-x-auto">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); router.push(link.href); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                pathname === link.href || pathname.startsWith(link.href + '/')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

