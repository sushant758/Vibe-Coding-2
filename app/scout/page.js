'use client';

import { useState, useEffect } from 'react';

export default function ScoutPage() {
  const [readyPlayers, setReadyPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReadyPlayers();
  }, []);

  const fetchReadyPlayers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scout/ready');
      const data = await res.json();
      if (Array.isArray(data)) {
        setReadyPlayers(data);
      }
    } catch (err) {
      console.error('Error fetching ready players:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Scout Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          Trial Eligible Talent Pool
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Ready Players
        </h1>
        <p className="text-stone-600 mt-1">
          Scout talent portal showing only players with &ge; 75% attendance and at least 2 competitive matches played.
        </p>
      </div>

      {/* Read-only Table */}
      <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-stone-500 font-medium">
              Loading ready talent list...
            </div>
          ) : readyPlayers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-stone-600 font-medium text-base mb-1">
                No players currently meet the trial readiness criteria.
              </p>
              <p className="text-xs text-stone-400">
                Criteria: Minimum 75% attendance across closed sessions and &ge; 2 recorded matches.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-200/50 text-stone-700 text-xs font-bold uppercase tracking-wider border-b border-stone-300/60">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Sport</th>
                  <th className="py-4 px-6">Age</th>
                  <th className="py-4 px-6">Attendance %</th>
                  <th className="py-4 px-6">Matches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 text-sm">
                {readyPlayers.map((player, idx) => (
                  <tr key={idx} className="hover:bg-amber-100/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-stone-900 text-base">
                      {player.name}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200/80 text-stone-800">
                        {player.sport}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-stone-700 font-medium">{player.age}</td>
                    <td className="py-4 px-6 font-bold text-emerald-800">
                      {player.attendancePercent}%
                    </td>
                    <td className="py-4 px-6 font-bold text-stone-800">
                      {player.matchesPlayed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
