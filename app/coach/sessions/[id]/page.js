'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/Toast';

export default function SessionDetailPage({ params }) {
  const unwrappedParams = use(params);
  const sessionId = unwrappedParams.id;
  const router = useRouter();
  const toast = useToast();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to load session', 'error');
        return;
      }
      setSession(data);
    } catch {
      toast('Network error loading session', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMark = async (playerId, status) => {
    if (session.status === 'closed') return;
    setMarkingId(playerId);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, status }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to mark attendance', 'error');
        return;
      }

      // Update local state instantly
      setSession((prev) => ({
        ...prev,
        attendance: prev.attendance.map((a) =>
          a.playerId === playerId ? { ...a, status } : a
        ),
      }));
    } catch {
      toast('Network error marking player', 'error');
    } finally {
      setMarkingId(null);
    }
  };

  const handleCloseSession = async () => {
    setClosing(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/close`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to close session', 'error');
        setClosing(false);
        setIsCloseDialogOpen(false);
        return;
      }

      toast('Session locked permanently!', 'success');
      setIsCloseDialogOpen(false);
      fetchSession();
    } catch {
      toast('Network error closing session', 'error');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-stone-500 font-medium">
        Loading session details...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-700 font-medium mb-4">Session not found.</p>
        <button
          onClick={() => router.push('/coach/sessions')}
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-semibold"
        >
          Back to Sessions
        </button>
      </div>
    );
  }

  const isClosed = session.status === 'closed';
  const totalInSport = session.attendance.length;
  const unmarkedCount = session.attendance.filter((a) => !a.status).length;
  const presentCount = session.attendance.filter((a) => a.status === 'present').length;
  const absentCount = session.attendance.filter((a) => a.status === 'absent').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/coach/sessions')}
        className="mb-6 inline-flex items-center text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
      >
        &larr; Back to Sessions
      </button>

      {/* Locked Banner if closed */}
      {isClosed && (
        <div className="mb-6 p-4 rounded-2xl bg-stone-900 text-amber-50 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-bold">Session closed</p>
              <p className="text-xs text-stone-400">
                This session is locked permanently. Attendance records cannot be edited.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono uppercase bg-stone-800 px-3 py-1 rounded-full text-amber-400">
            Locked
          </span>
        </div>
      )}

      {/* Session Header Card */}
      <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-200/80 text-stone-800">
                {session.sport}
              </span>
              <span className="text-xs font-semibold text-stone-500">Date: {session.date}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
              Attendance Roster
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Mark every athlete present or absent before closing.
            </p>
          </div>

          {!isClosed && (
            <button
              onClick={() => setIsCloseDialogOpen(true)}
              disabled={unmarkedCount > 0}
              title={unmarkedCount > 0 ? 'Mark every player first' : 'Close this session'}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              Close Session
            </button>
          )}
        </div>

        {/* Tally Pill Bar */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-stone-300/60">
          <div className="p-3 rounded-xl bg-white/70 text-center border border-stone-200">
            <span className="text-xs font-bold text-stone-500 uppercase">Total</span>
            <p className="text-xl font-extrabold text-stone-900 mt-0.5">{totalInSport}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-center border border-emerald-200">
            <span className="text-xs font-bold text-emerald-700 uppercase">Present</span>
            <p className="text-xl font-extrabold text-emerald-800 mt-0.5">{presentCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-center border border-rose-200">
            <span className="text-xs font-bold text-rose-700 uppercase">Absent</span>
            <p className="text-xl font-extrabold text-rose-800 mt-0.5">{absentCount}</p>
          </div>
        </div>

        {!isClosed && unmarkedCount > 0 && (
          <p className="text-xs text-amber-800 bg-amber-100/70 p-2.5 rounded-xl mt-4 font-medium border border-amber-200">
            ⚠️ {unmarkedCount} player(s) still unmarked. You must mark every player before closing.
          </p>
        )}
      </div>

      {/* Players Attendance List */}
      <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-2xl shadow-xl overflow-hidden">
        {session.attendance.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            No players enrolled in {session.sport}. Add players first.
          </div>
        ) : (
          <div className="divide-y divide-stone-200/70">
            {session.attendance.map((entry) => {
              const isPresent = entry.status === 'present';
              const isAbsent = entry.status === 'absent';
              const isBusy = markingId === entry.playerId;

              return (
                <div
                  key={entry.playerId}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-amber-100/40 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">{entry.playerName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-stone-500 font-medium">Status:</span>
                      {entry.status ? (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {isPresent ? 'Present' : 'Absent'}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                          Not marked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Toggle buttons: Present / Absent */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={isClosed || isBusy}
                      onClick={() => handleMark(entry.playerId, 'present')}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                        isPresent
                          ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500 ring-offset-1'
                          : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      disabled={isClosed || isBusy}
                      onClick={() => handleMark(entry.playerId, 'absent')}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                        isAbsent
                          ? 'bg-rose-700 text-white shadow-md ring-2 ring-rose-500 ring-offset-1'
                          : 'bg-stone-200/80 text-stone-700 hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Lock Dialog */}
      <ConfirmDialog
        isOpen={isCloseDialogOpen}
        onCancel={() => setIsCloseDialogOpen(false)}
        onConfirm={handleCloseSession}
        title="Close Session"
        message="This will lock the session permanently. No further attendance changes can be made."
      />
    </div>
  );
}
