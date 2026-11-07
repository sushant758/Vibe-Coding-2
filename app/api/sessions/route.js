import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import Player from '@/models/Player';
import { requireRole } from '@/lib/auth';
import { SPORTS } from '@/lib/config';

export async function GET() {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const sessions = await Session.find().sort({ date: -1, sport: 1 }).lean();
  const result = sessions.map((s) => ({
    ...s,
    _id: s._id.toString(),
    attendance: s.attendance.map((a) => ({
      playerId: a.playerId.toString(),
      status: a.status,
    })),
  }));
  return NextResponse.json(result);
}

export async function POST(request) {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const { date, sport } = await request.json();

  if (!date || !sport) {
    return NextResponse.json({ error: 'Date and sport are required' }, { status: 400 });
  }
  if (!SPORTS.includes(sport)) {
    return NextResponse.json({ error: 'Invalid sport' }, { status: 400 });
  }
  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Date must be YYYY-MM-DD' }, { status: 400 });
  }

  // Check for duplicate
  const existing = await Session.findOne({ date, sport });
  if (existing) {
    return NextResponse.json({ error: 'A session already exists for this date and sport' }, { status: 409 });
  }

  // Get all players of this sport to create attendance list
  const players = await Player.find({ sport }).lean();
  const attendance = players.map((p) => ({
    playerId: p._id,
    status: null, // no mark yet
  }));

  const session = await Session.create({
    date,
    sport,
    status: 'open',
    attendance,
  });

  return NextResponse.json({
    _id: session._id.toString(),
    date: session.date,
    sport: session.sport,
    status: session.status,
    attendance: session.attendance.map((a) => ({
      playerId: a.playerId.toString(),
      status: a.status,
    })),
  }, { status: 201 });
}
