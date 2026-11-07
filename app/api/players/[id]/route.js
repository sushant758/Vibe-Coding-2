import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Player from '@/models/Player';
import User from '@/models/User';
import Session from '@/models/Session';
import Match from '@/models/Match';
import { requireRole } from '@/lib/auth';
import { SPORTS } from '@/lib/config';

export async function PUT(request, { params }) {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const { id } = await params;
  const { name, age, sport } = await request.json();

  if (!name || !age || !sport) {
    return NextResponse.json({ error: 'Name, age, and sport are required' }, { status: 400 });
  }
  if (!SPORTS.includes(sport)) {
    return NextResponse.json({ error: 'Invalid sport' }, { status: 400 });
  }
  if (typeof age !== 'number' || age < 5 || age > 60) {
    return NextResponse.json({ error: 'Age must be between 5 and 60' }, { status: 400 });
  }

  const player = await Player.findByIdAndUpdate(
    id,
    { name: name.trim(), age, sport },
    { new: true }
  );
  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  return NextResponse.json({
    _id: player._id.toString(),
    name: player.name,
    age: player.age,
    sport: player.sport,
  });
}

export async function DELETE(request, { params }) {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const { id } = await params;

  const player = await Player.findById(id);
  if (!player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  // Remove user account
  if (player.userId) {
    await User.findByIdAndDelete(player.userId);
  }

  // Remove player from session attendance arrays
  await Session.updateMany(
    { 'attendance.playerId': player._id },
    { $pull: { attendance: { playerId: player._id } } }
  );

  // Remove player from match scores
  await Match.updateMany(
    { 'scores.playerId': player._id },
    { $pull: { scores: { playerId: player._id } } }
  );

  // Delete the player
  await Player.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
