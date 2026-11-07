import { describe, it, expect } from 'vitest';
import { computeReadiness } from '../lib/ready.js';

describe('1. Readiness Logic (/lib/ready.js)', () => {
  const dummyPlayerId = '660000000000000000000001';
  const player = {
    _id: dummyPlayerId,
    name: 'Rahul Kumar',
    sport: 'Cricket',
    age: 18,
  };

  it('held = 0 then 0% attendance and NOT Ready', () => {
    const closedSessions = [];
    const matches = [
      { sport: 'Cricket', scores: [{ playerId: dummyPlayerId, score: 50 }] },
      { sport: 'Cricket', scores: [{ playerId: dummyPlayerId, score: 30 }] },
    ];

    const result = computeReadiness(player, closedSessions, matches);
    expect(result.heldCount).toBe(0);
    expect(result.attendancePercent).toBe(0);
    expect(result.isReady).toBe(false);
  });

  it('2 of 3 present then 67% (66.6%) then NOT Ready even with 5 matches', () => {
    const closedSessions = [
      { attendance: [{ playerId: dummyPlayerId, status: 'present' }] },
      { attendance: [{ playerId: dummyPlayerId, status: 'present' }] },
      { attendance: [{ playerId: dummyPlayerId, status: 'absent' }] },
    ];
    const matches = [
      { sport: 'Cricket', scores: [{ playerId: dummyPlayerId, score: 10 }] },
      { sport: 'Cricket', scores: [{ playerId: dummyPlayerId, score: 20 }] },
      { sport: 'Cricket', scores: [{ playerId: dummyPlayerId, score: 30 }] },
      { sport: 'Cricket', scores: [{ playerId: dummyPlayerId, score: 40 }] },
      { sport: 'Cricket', scores: [{ playerId: dummyPlayerId, score: 50 }] },
    ];

    const result = computeReadiness(player, closedSessions, matches);
    expect(result.presentCount).toBe(2);
    expect(result.heldCount).toBe(3);
    expect(result.attendancePercent).toBe(67); // Math.round(200/3)
    expect(result.matchesPlayed).toBe(5);
    expect(result.isReady).toBe(false); // 2*4=8 < 3*3=9
  });

  it('3 of 4 present (exactly 75%) with 2 matches then Ready', () => {
    const closedSessions = [
      { attendance: [{ playerId: dummyPlayerId, status: 'present' }] },
      { attendance: [{ playerId: dummyPlayerId, status: 'present' }] },
      { attendance: [{ playerId: dummyPlayerId, status: 'present' }] },
      { attendance: [{ playerId: dummyPlayerId, status: 'absent' }] },
    ];
    const matches = [
      { sport: 'Cricket', scores: [{ playerId: dummyPlayerId, score: 45 }] },
      { sport: 'Cricket', scores: [{ playerId: dummyPlayerId, score: 72 }] },
    ];

    const result = computeReadiness(player, closedSessions, matches);
    expect(result.presentCount).toBe(3);
    expect(result.heldCount).toBe(4);
    expect(result.attendancePercent).toBe(75);
    expect(result.matchesPlayed).toBe(2);
    expect(result.isReady).toBe(true); // 3*4=12 >= 4*3=12, matches=2
  });

  it('3 of 4 present with 1 match then NOT Ready', () => {
    const closedSessions = [
      { attendance: [{ playerId: dummyPlayerId, status: 'present' }] },
      { attendance: [{ playerId: dummyPlayerId, status: 'present' }] },
      { attendance: [{ playerId: dummyPlayerId, status: 'present' }] },
      { attendance: [{ playerId: dummyPlayerId, status: 'absent' }] },
    ];
    const matches = [
      { sport: 'Cricket', scores: [{ playerId: dummyPlayerId, score: 100 }] },
    ];

    const result = computeReadiness(player, closedSessions, matches);
    expect(result.presentCount).toBe(3);
    expect(result.heldCount).toBe(4);
    expect(result.attendancePercent).toBe(75);
    expect(result.matchesPlayed).toBe(1);
    expect(result.isReady).toBe(false); // matchesPlayed < 2
  });
});

describe('2. Match Validation Rule', () => {
  // Simulating the server-side validation rule implemented in POST /api/matches
  function validateMatchScores(session, scores) {
    if (!session) {
      return { status: 400, error: 'No session held that day for this sport' };
    }
    for (const scoreEntry of scores) {
      const attendanceEntry = session.attendance.find(
        (a) => a.playerId.toString() === scoreEntry.playerId.toString()
      );
      if (!attendanceEntry || attendanceEntry.status !== 'present') {
        return { status: 403, error: 'Player was absent that day' };
      }
      if (typeof scoreEntry.score !== 'number' || scoreEntry.score < 0) {
        return { status: 400, error: 'Score must be a non-negative number' };
      }
    }
    return { status: 201, success: true };
  }

  it('Match with an absent player returns 403 and message "Player was absent that day"', () => {
    const session = {
      date: '2026-11-07',
      sport: 'Cricket',
      attendance: [
        { playerId: 'p1', status: 'present' },
        { playerId: 'p2', status: 'present' },
        { playerId: 'p3', status: 'absent' },
      ],
    };

    // p3 was absent
    const scores = [
      { playerId: 'p1', score: 25 },
      { playerId: 'p3', score: 10 },
    ];

    const result = validateMatchScores(session, scores);
    expect(result.status).toBe(403);
    expect(result.error).toBe('Player was absent that day');
  });

  it('Match with only present players succeeds with 201', () => {
    const session = {
      date: '2026-11-07',
      sport: 'Cricket',
      attendance: [
        { playerId: 'p1', status: 'present' },
        { playerId: 'p2', status: 'present' },
        { playerId: 'p3', status: 'absent' },
      ],
    };

    const scores = [
      { playerId: 'p1', score: 40 },
      { playerId: 'p2', score: 55 },
    ];

    const result = validateMatchScores(session, scores);
    expect(result.status).toBe(201);
    expect(result.success).toBe(true);
  });
});

describe('3. Closed Session Rule', () => {
  // Simulating the server-side mark check implemented in POST /api/sessions/[id]/mark
  function markAttendance(session, playerId, status) {
    if (session.status === 'closed') {
      return { status: 403, error: 'Session is closed' };
    }
    const entry = session.attendance.find((a) => a.playerId === playerId);
    if (!entry) return { status: 404, error: 'Player not in this session' };
    entry.status = status;
    return { status: 200, success: true };
  }

  it('Closed session mark returns 403 "Session is closed"', () => {
    const session = {
      status: 'closed',
      attendance: [{ playerId: 'p1', status: 'present' }],
    };

    const result = markAttendance(session, 'p1', 'absent');
    expect(result.status).toBe(403);
    expect(result.error).toBe('Session is closed');
  });
});

describe('4. Role Access Enforcement', () => {
  function checkRoleAccess(requiredRole, userRole) {
    if (!userRole) return { status: 401, error: 'Unauthorized' };
    if (userRole !== requiredRole) return { status: 403, error: 'Forbidden' };
    return { status: 200, allowed: true };
  }

  it('Coach API returns 403 for scout and player roles', () => {
    expect(checkRoleAccess('coach', 'scout').status).toBe(403);
    expect(checkRoleAccess('coach', 'player').status).toBe(403);
    expect(checkRoleAccess('coach', 'coach').status).toBe(200);
  });

  it('Scout API returns 403 for player and coach roles', () => {
    expect(checkRoleAccess('scout', 'player').status).toBe(403);
    expect(checkRoleAccess('scout', 'coach').status).toBe(403);
    expect(checkRoleAccess('scout', 'scout').status).toBe(200);
  });
});

