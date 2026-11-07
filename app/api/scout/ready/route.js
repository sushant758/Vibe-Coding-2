import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/models/Player';
import Session from '@/models/Session';
import Match from '@/models/Match';
import { requireRole } from '@/lib/auth';
import { computeReadiness } from '@/lib/ready';

export async function GET() {
  const auth = await requireRole('scout');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const players = await Player.find().lean();
  const closedSessions = await Session.find({ status: 'closed' }).lean();
  const matches = await Match.find().lean();

  const result = [];
  for (const player of players) {
    const sportSessions = closedSessions.filter((s) => s.sport === player.sport);
    const sportMatches = matches.filter((m) => m.sport === player.sport);
    const readiness = computeReadiness(player, sportSessions, sportMatches);
    if (readiness.isReady) {
      result.push({
        name: readiness.name,
        sport: readiness.sport,
        age: readiness.age,
        attendancePercent: readiness.attendancePercent,
        matchesPlayed: readiness.matchesPlayed,
      });
    }
  }

  return NextResponse.json(result);
}
