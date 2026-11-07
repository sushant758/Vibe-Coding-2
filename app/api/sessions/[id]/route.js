import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import Player from '@/models/Player';
import { requireRole } from '@/lib/auth';

export async function GET(request, { params }) {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const { id } = await params;
  const session = await Session.findById(id).lean();
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Populate player names
  const playerIds = session.attendance.map((a) => a.playerId);
  const players = await Player.find({ _id: { $in: playerIds } }).lean();
  const playerMap = {};
  for (const p of players) {
    playerMap[p._id.toString()] = { name: p.name, sport: p.sport };
  }

  return NextResponse.json({
    _id: session._id.toString(),
    date: session.date,
    sport: session.sport,
    status: session.status,
    closedAt: session.closedAt,
    attendance: session.attendance.map((a) => ({
      playerId: a.playerId.toString(),
      status: a.status,
      playerName: playerMap[a.playerId.toString()]?.name || 'Unknown',
    })),
  });
}
