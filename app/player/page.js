'use client';

import { useState, useEffect } from 'react';

export default function PlayerPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRow();
  }, []);

  const fetchMyRow = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/player/me');
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching player row:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-stone-500 font-medium">
        Loading player profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-stone-700 font-medium">No player record linked to this login.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Player Bio & Readiness Card */}
      <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-stone-200/80 text-stone-800">
                {profile.sport}
              </span>
              <span className="text-xs font-semibold text-stone-500">Age: {profile.age}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
              {profile.name}
            </h1>
            <p className="text-xs text-stone-600 mt-0.5">Player Portal - Personal Record</p>
          </div>

          <div>
            {profile.isReady ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold bg-emerald-100 text-emerald-800 border-2 border-emerald-400 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Ready for Trial
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold bg-rose-100 text-rose-800 border-2 border-rose-300 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                Not Ready
              </span>
            )}
          </div>
        </div>

        {/* 4 Stat Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-300/60">
          <div className="bg-white/80 p-4 rounded-2xl border border-stone-200">
            <span className="text-xs font-bold text-stone-500 uppercase">Attendance</span>
            <p className="text-2xl font-extrabold text-stone-900 mt-1">
              {profile.attendancePercent}%
            </p>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-stone-200">
            <span className="text-xs font-bold text-stone-500 uppercase">Present / Held</span>
            <p className="text-2xl font-extrabold text-stone-900 mt-1">
              {profile.presentCount} / {profile.heldCount}
            </p>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-stone-200">
            <span className="text-xs font-bold text-stone-500 uppercase">Matches Played</span>
            <p className="text-2xl font-extrabold text-stone-900 mt-1">
              {profile.matchesPlayed}
            </p>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-stone-200">
            <span className="text-xs font-bold text-stone-500 uppercase">Trial Target</span>
            <p className="text-2xl font-extrabold text-amber-800 mt-1">&ge; 75% + 2 M</p>
          </div>
        </div>
      </div>

      {/* Acceptance Check 1: "My Sessions" list with Present/Absent badge (absent in red) */}
      <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-stone-300/60">
          <h2 className="text-xl font-bold text-stone-900">My Sessions</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Attendance history across academy practice sessions
          </p>
        </div>

        {profile.sessions.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">
            No session attendance recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-stone-200/70">
            {profile.sessions.map((sess) => {
              const isPresent = sess.attendanceStatus === 'present';
              const isAbsent = sess.attendanceStatus === 'absent';

              return (
                <div
                  key={sess._id}
                  className="p-5 flex items-center justify-between hover:bg-amber-100/40 transition-colors"
                >
                  <div>
                    <span className="font-bold text-stone-900 text-base">{sess.date}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-stone-500">{sess.sport}</span>
                      <span className="text-xs text-stone-400">&bull;</span>
                      <span className="text-xs text-stone-500 uppercase">
                        {sess.sessionStatus}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isPresent && (
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Present
                      </span>
                    )}
                    {isAbsent && (
                      <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        Absent
                      </span>
                    )}
                    {!sess.attendanceStatus && (
                      <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-600">
                        Unmarked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* "My Matches" list: date, opponent, my score */}
      <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-stone-300/60">
          <h2 className="text-xl font-bold text-stone-900">My Matches</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Competitive matches played and personal score records
          </p>
        </div>

        {profile.matches.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">
            No match appearances recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-stone-200/70">
            {profile.matches.map((m) => (
              <div
                key={m._id}
                className="p-5 flex items-center justify-between hover:bg-amber-100/40 transition-colors"
              >
                <div>
                  <span className="font-bold text-stone-900 text-base">vs {m.opponent}</span>
                  <p className="text-xs text-stone-500 mt-0.5">{m.date}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-medium">My Score:</span>
                  <span className="px-3 py-1 rounded-xl bg-stone-900 text-amber-50 font-mono font-bold text-sm">
                    {m.score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

