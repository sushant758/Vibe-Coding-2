import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Match from '@/models/Match';
import Player from '@/models/Player';
import { requireRole } from '@/lib/auth';

export async function GET(request, { params }) {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const { id } = await params;
  const match = await Match.findById(id).lean();
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const playerIds = match.scores.map((s) => s.playerId);
  const players = await Player.find({ _id: { $in: playerIds } }).lean();
  const playerMap = {};
  for (const p of players) {
    playerMap[p._id.toString()] = p.name;
  }

  return NextResponse.json({
    _id: match._id.toString(),
    date: match.date,
    sport: match.sport,
    opponent: match.opponent,
    scores: match.scores.map((s) => ({
      playerId: s.playerId.toString(),
      playerName: playerMap[s.playerId.toString()] || 'Unknown',
      score: s.score,
    })),
  });
}
