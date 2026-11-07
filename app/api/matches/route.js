import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Match from '@/models/Match';
import Session from '@/models/Session';
import Player from '@/models/Player';
import { requireRole } from '@/lib/auth';
import { SPORTS } from '@/lib/config';

export async function GET() {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const matches = await Match.find().sort({ date: -1 }).lean();

  // Populate player names in scores
  const allPlayerIds = [];
  for (const m of matches) {
    for (const s of m.scores) {
      allPlayerIds.push(s.playerId);
    }
  }
  const players = await Player.find({ _id: { $in: allPlayerIds } }).lean();
  const playerMap = {};
  for (const p of players) {
    playerMap[p._id.toString()] = p.name;
  }

  const result = matches.map((m) => ({
    ...m,
    _id: m._id.toString(),
    scores: m.scores.map((s) => ({
      playerId: s.playerId.toString(),
      playerName: playerMap[s.playerId.toString()] || 'Unknown',
      score: s.score,
    })),
  }));
  return NextResponse.json(result);
}

export async function POST(request) {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const { date, sport, opponent, scores } = await request.json();

  if (!date || !sport || !opponent || !scores || !Array.isArray(scores)) {
    return NextResponse.json({ error: 'date, sport, opponent, and scores are required' }, { status: 400 });
  }
  if (!SPORTS.includes(sport)) {
    return NextResponse.json({ error: 'Invalid sport' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Date must be YYYY-MM-DD' }, { status: 400 });
  }

  // Find the session for this date+sport
  const session = await Session.findOne({ date, sport });
  if (!session) {
    return NextResponse.json({ error: 'No session held that day for this sport' }, { status: 400 });
  }

  // Validate EVERY player in scores against the session attendance
  for (const scoreEntry of scores) {
    const attendanceEntry = session.attendance.find(
      (a) => a.playerId.toString() === scoreEntry.playerId
    );
    if (!attendanceEntry || attendanceEntry.status !== 'present') {
      return NextResponse.json({ error: 'Player was absent that day' }, { status: 403 });
    }
    if (typeof scoreEntry.score !== 'number' || scoreEntry.score < 0) {
      return NextResponse.json({ error: 'Score must be a non-negative number' }, { status: 400 });
    }
  }

  const match = await Match.create({
    date,
    sport,
    opponent: opponent.trim(),
    scores: scores.map((s) => ({
      playerId: s.playerId,
      score: s.score,
    })),
  });

  return NextResponse.json({
    _id: match._id.toString(),
    date: match.date,
    sport: match.sport,
    opponent: match.opponent,
    scores: match.scores.map((s) => ({
      playerId: s.playerId.toString(),
      score: s.score,
    })),
  }, { status: 201 });
}
