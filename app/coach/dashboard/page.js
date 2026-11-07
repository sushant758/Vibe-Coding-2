'use client';

import { useState, useEffect } from 'react';
import { SPORTS } from '@/lib/config';

export default function CoachDashboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState('All');
  const [stats, setStats] = useState({ totalPlayers: 0, sessionsHeld: 0, matchesPlayed: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch ready/all
      const resReady = await fetch('/api/ready/all');
      const readyList = await resReady.json();

      // 2. Fetch sessions to count closed sessions held
      const resSessions = await fetch('/api/sessions');
      const sessionsList = await resSessions.json();
      const closedSessionsCount = Array.isArray(sessionsList)
        ? sessionsList.filter((s) => s.status === 'closed').length
        : 0;

      // 3. Fetch matches to count matches played
      const resMatches = await fetch('/api/matches');
      const matchesList = await resMatches.json();
      const matchesCount = Array.isArray(matchesList) ? matchesList.length : 0;

      if (Array.isArray(readyList)) {
        setData(readyList);
        setStats({
          totalPlayers: readyList.length,
          sessionsHeld: closedSessionsCount,
          matchesPlayed: matchesCount,
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data
    .filter((player) => sportFilter === 'All' || player.sport === sportFilter)
    .sort((a, b) => b.attendancePercent - a.attendancePercent);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Coach Dashboard</h1>
          <p className="text-stone-600 mt-1">Player attendance analytics, match stats, and trial readiness</p>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-2xl p-6 shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Total Players</span>
          <p className="text-3xl font-extrabold text-stone-900 mt-2">{stats.totalPlayers}</p>
        </div>

        <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-2xl p-6 shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Sessions Held (Closed)</span>
          <p className="text-3xl font-extrabold text-stone-900 mt-2">{stats.sessionsHeld}</p>
        </div>

        <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-2xl p-6 shadow-md">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Matches Played</span>
          <p className="text-3xl font-extrabold text-stone-900 mt-2">{stats.matchesPlayed}</p>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-stone-300/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-stone-900">Player Readiness Sheet</h2>

          {/* Sport Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Sport Filter:</label>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="bg-white/90 border border-stone-300 rounded-xl px-3 py-1.5 text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Sports</option>
              {SPORTS.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-stone-500 font-medium">Loading player records...</div>
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-stone-500 font-medium">No players found matching filter.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-200/50 text-stone-700 text-xs font-bold uppercase tracking-wider border-b border-stone-300/60">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Sport</th>
                  <th className="py-4 px-6">Present / Held</th>
                  <th className="py-4 px-6">Attendance %</th>
                  <th className="py-4 px-6">Matches</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 text-sm">
                {filteredData.map((player) => (
                  <tr key={player._id} className="hover:bg-amber-100/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-stone-900">{player.name}</td>
                    <td className="py-4 px-6 text-stone-700">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-200/80 text-stone-800">
                        {player.sport}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-stone-700">
                      {player.presentCount} / {player.heldCount}
                    </td>
                    <td className="py-4 px-6 font-bold text-stone-800">
                      {player.attendancePercent}%
                    </td>
                    <td className="py-4 px-6 text-stone-700 font-medium">
                      {player.matchesPlayed}
                    </td>
                    <td className="py-4 px-6">
                      {player.isReady ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <span className="w-2 h-2 rounded-full bg-rose-600" />
                          Not Ready
                        </span>
                      )}
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
