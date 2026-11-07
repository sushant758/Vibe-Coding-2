'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SPORTS } from '@/lib/config';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

export default function CoachSessionsPage() {
  const router = useRouter();
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Open Session Modal
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    date: '',
    sport: SPORTS[0],
  });

  useEffect(() => {
    if (!sessionForm.date) {
      setSessionForm((prev) => ({
        ...prev,
        date: new Date().toISOString().split('T')[0],
      }));
    }
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch {
      toast('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.date) {
      toast('Please choose a date', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionForm),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to open session', 'error');
        setIsSubmitting(false);
        return;
      }

      toast('Session opened successfully!', 'success');
      setIsOpenModal(false);
      // Navigate straight to the new session's detail page
      router.push(`/coach/sessions/${data._id}`);
    } catch {
      toast('Network error opening session', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Practice Sessions</h1>
          <p className="text-stone-600 mt-1">Open, track attendance, and lock academy sessions</p>
        </div>
        <button
          onClick={() => setIsOpenModal(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-50 font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          + Open Session
        </button>
      </div>

      {/* Sessions List Card */}
      <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-stone-500 font-medium">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-stone-500 font-medium mb-3">No sessions opened yet.</p>
              <button
                onClick={() => setIsOpenModal(true)}
                className="text-amber-800 font-semibold hover:underline"
              >
                + Open your first session
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-200/50 text-stone-700 text-xs font-bold uppercase tracking-wider border-b border-stone-300/60">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Sport</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Present</th>
                  <th className="py-4 px-6">Absent</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 text-sm">
                {sessions.map((s) => {
                  const presentCount = s.attendance.filter((a) => a.status === 'present').length;
                  const absentCount = s.attendance.filter((a) => a.status === 'absent').length;

                  return (
                    <tr key={s._id} className="hover:bg-amber-100/40 transition-colors">
                      <td className="py-4 px-6 font-semibold text-stone-900">{s.date}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200/80 text-stone-800">
                          {s.sport}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {s.status === 'closed' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-200 text-stone-700 border border-stone-300">
                            <span>🔒</span>
                            Closed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Open
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-semibold text-emerald-700">{presentCount}</td>
                      <td className="py-4 px-6 font-semibold text-rose-700">{absentCount}</td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => router.push(`/coach/sessions/${s._id}`)}
                          className="px-4 py-1.5 text-xs font-bold text-stone-900 bg-amber-200/80 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Open Session Modal */}
      <Modal isOpen={isOpenModal} onClose={() => setIsOpenModal(false)} title="Open New Session">
        <form onSubmit={handleOpenSession} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Session Date
            </label>
            <input
              type="date"
              required
              value={sessionForm.date}
              onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Sport
            </label>
            <select
              value={sessionForm.sport}
              onChange={(e) => setSessionForm({ ...sessionForm, sport: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-stone-300/60">
            <button
              type="button"
              onClick={() => setIsOpenModal(false)}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-stone-200/80 hover:bg-stone-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Opening...' : 'Open'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
