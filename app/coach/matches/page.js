'use client';

import { useState, useEffect } from 'react';
import { SPORTS } from '@/lib/config';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

export default function CoachMatchesPage() {
  const toast = useToast();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMatchId, setExpandedMatchId] = useState(null);

  // Record Match Modal
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [matchForm, setMatchForm] = useState({
    date: '',
    sport: SPORTS[0],
    opponent: '',
  });

  useEffect(() => {
    if (!matchForm.date) {
      setMatchForm((prev) => ({
        ...prev,
        date: new Date().toISOString().split('T')[0],
      }));
    }
  }, []);

  // State for loaded present players in this date+sport session
  const [presentPlayers, setPresentPlayers] = useState([]);
  const [scoresMap, setScoresMap] = useState({}); // { [playerId]: score }
  const [checkingSession, setCheckingSession] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMatches(data);
      }
    } catch {
      toast('Failed to load matches', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Whenever date or sport changes in the modal, load the session and present players
  useEffect(() => {
    if (!isRecordOpen) return;
    loadPresentPlayers(matchForm.date, matchForm.sport);
  }, [matchForm.date, matchForm.sport, isRecordOpen]);

  const loadPresentPlayers = async (date, sport) => {
    if (!date || !sport) return;
    setCheckingSession(true);
    setSessionError('');
    setPresentPlayers([]);
    setScoresMap({});

    try {
      // Find session matching date & sport
      const res = await fetch('/api/sessions');
      const sessions = await res.json();
      const matchedSession = Array.isArray(sessions)
        ? sessions.find((s) => s.date === date && s.sport === sport)
        : null;

      if (!matchedSession) {
        setSessionError('No session held on this date for this sport');
        setCheckingSession(false);
        return;
      }

      // Fetch full session details with player names
      const detailRes = await fetch(`/api/sessions/${matchedSession._id}`);
      const detail = await detailRes.json();

      // Filter ONLY players who are marked Present
      const presentOnly = detail.attendance.filter((a) => a.status === 'present');
      if (presentOnly.length === 0) {
        setSessionError('No players were marked Present in this session');
        setCheckingSession(false);
        return;
      }

      setPresentPlayers(presentOnly);
      // Initialize scores map with 0
      const initialScores = {};
      for (const p of presentOnly) {
        initialScores[p.playerId] = 0;
      }
      setScoresMap(initialScores);
    } catch {
      setSessionError('Failed to check session records');
    } finally {
      setCheckingSession(false);
    }
  };

  const handleScoreChange = (playerId, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setScoresMap((prev) => ({ ...prev, [playerId]: num }));
  };

  const handleSaveMatch = async (e) => {
    e.preventDefault();
    if (!matchForm.opponent.trim()) {
      toast('Opponent name is required', 'error');
      return;
    }
    if (presentPlayers.length === 0) {
      toast('Cannot save match without present players', 'error');
      return;
    }

    setSaving(true);
    try {
      const scoresPayload = presentPlayers.map((p) => ({
        playerId: p.playerId,
        score: scoresMap[p.playerId] ?? 0,
      }));

      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: matchForm.date,
          sport: matchForm.sport,
          opponent: matchForm.opponent.trim(),
          scores: scoresPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to record match', 'error');
        setSaving(false);
        return;
      }

      toast('Match recorded successfully!', 'success');
      setIsRecordOpen(false);
      setMatchForm({
        date: new Date().toISOString().split('T')[0],
        sport: SPORTS[0],
        opponent: '',
      });
      fetchMatches();
    } catch {
      toast('Network error recording match', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedMatchId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header with + Record Match */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Matches Played</h1>
          <p className="text-stone-600 mt-1">Official matches and player scoring sheets</p>
        </div>
        <button
          onClick={() => {
            setIsRecordOpen(true);
          }}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-50 font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          + Record Match
        </button>
      </div>

      {/* Matches List */}
      <div className="bg-amber-50/90 backdrop-blur-md border border-stone-300/70 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-500 font-medium">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-stone-500 font-medium mb-3">No matches recorded yet.</p>
            <button
              onClick={() => setIsRecordOpen(true)}
              className="text-amber-800 font-semibold hover:underline"
            >
              + Record the first match
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-200/70">
            {matches.map((m) => {
              const isExpanded = expandedMatchId === m._id;
              return (
                <div key={m._id} className="p-6 hover:bg-amber-100/30 transition-colors">
                  <div
                    onClick={() => toggleExpand(m._id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-200/80 text-stone-800">
                          {m.sport}
                        </span>
                        <span className="text-xs font-medium text-stone-500">{m.date}</span>
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 mt-1">
                        vs {m.opponent}
                      </h3>
                      <p className="text-xs text-stone-600 mt-0.5">
                        {m.scores.length} player(s) scored
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-800">
                        {isExpanded ? 'Hide Scores ▲' : 'View Scores ▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expandable Scores Sheet */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-stone-300/60">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
                        Player Scorecard:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {m.scores.map((s, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white/80 rounded-xl border border-stone-200/80 flex items-center justify-between"
                          >
                            <span className="font-semibold text-stone-900 text-sm">
                              {s.playerName}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-amber-50 font-mono font-bold text-xs">
                              {s.score} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Match Modal */}
      <Modal isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} title="Record Match">
        <form onSubmit={handleSaveMatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Match Date
            </label>
            <input
              type="date"
              required
              value={matchForm.date}
              onChange={(e) => setMatchForm({ ...matchForm, date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Sport
            </label>
            <select
              value={matchForm.sport}
              onChange={(e) => setMatchForm({ ...matchForm, sport: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Opponent Team Name
            </label>
            <input
              type="text"
              required
              value={matchForm.opponent}
              onChange={(e) => setMatchForm({ ...matchForm, opponent: e.target.value })}
              placeholder="e.g. Ranchi Warriors"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Present Players and Scores */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
              Present Players & Scores
            </label>

            {checkingSession ? (
              <p className="text-xs text-stone-500 italic p-3 bg-stone-100 rounded-xl">
                Checking session attendance...
              </p>
            ) : sessionError ? (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
                ⚠️ {sessionError}
              </div>
            ) : presentPlayers.length === 0 ? (
              <p className="text-xs text-stone-500 italic p-3 bg-stone-100 rounded-xl">
                Select date and sport to load present players.
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {presentPlayers.map((p) => (
                  <div
                    key={p.playerId}
                    className="flex items-center justify-between p-2.5 bg-white/90 rounded-xl border border-stone-200"
                  >
                    <span className="text-sm font-semibold text-stone-800">
                      {p.playerName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Score:</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={scoresMap[p.playerId] ?? 0}
                        onChange={(e) => handleScoreChange(p.playerId, e.target.value)}
                        className="w-20 px-2 py-1 text-center font-mono text-sm bg-stone-100 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-stone-300/60">
            <button
              type="button"
              onClick={() => setIsRecordOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-stone-700 bg-stone-200/80 hover:bg-stone-300 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || Boolean(sessionError) || presentPlayers.length === 0}
              className="px-5 py-2 text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Match'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
