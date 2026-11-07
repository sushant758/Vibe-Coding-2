import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/models/Player';
import Session from '@/models/Session';
import Match from '@/models/Match';
import { requireRole } from '@/lib/auth';
import { computeReadiness } from '@/lib/ready';

export async function GET() {
  const auth = await requireRole('player');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();

  // playerId comes from JWT, NEVER from URL or body
  const playerId = auth.session.playerId;
  if (!playerId) {
    return NextResponse.json({ error: 'Player not linked' }, { status: 400 });
  }

  const player = await Player.findById(playerId).lean();
  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  const closedSessions = await Session.find({ status: 'closed', sport: player.sport }).lean();
  const allSessions = await Session.find({ sport: player.sport }).lean();
  const matches = await Match.find({ sport: player.sport }).lean();

  const readiness = computeReadiness(player, closedSessions, matches);

  // Build sessions list for this player (both open and closed)
  const mySessions = [];
  for (const session of allSessions) {
    const entry = session.attendance.find(
      (a) => a.playerId.toString() === playerId
    );
    if (entry) {
      mySessions.push({
        _id: session._id.toString(),
        date: session.date,
        sport: session.sport,
        sessionStatus: session.status,
        attendanceStatus: entry.status, // 'present', 'absent', or null
      });
    }
  }
  mySessions.sort((a, b) => b.date.localeCompare(a.date));

  // Build matches list for this player
  const myMatches = [];
  for (const match of matches) {
    const scoreEntry = match.scores.find(
      (s) => s.playerId.toString() === playerId
    );
    if (scoreEntry) {
      myMatches.push({
        _id: match._id.toString(),
        date: match.date,
        opponent: match.opponent,
        score: scoreEntry.score,
      });
    }
  }
  myMatches.sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({
    name: readiness.name,
    sport: readiness.sport,
    age: readiness.age,
    attendancePercent: readiness.attendancePercent,
    presentCount: readiness.presentCount,
    heldCount: readiness.heldCount,
    matchesPlayed: readiness.matchesPlayed,
    isReady: readiness.isReady,
    sessions: mySessions,
    matches: myMatches,
  });
}
