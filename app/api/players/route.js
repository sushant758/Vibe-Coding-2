import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import Player from '@/models/Player';
import User from '@/models/User';
import { requireRole } from '@/lib/auth';
import { SPORTS } from '@/lib/config';

export async function GET() {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const players = await Player.find().sort({ name: 1 }).lean();
  // Also fetch user emails for display
  const userIds = players.map((p) => p.userId).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = {};
  for (const u of users) {
    userMap[u._id.toString()] = u.email;
  }
  const result = players.map((p) => ({
    ...p,
    _id: p._id.toString(),
    userId: p.userId?.toString() || null,
    loginEmail: p.userId ? userMap[p.userId.toString()] || '' : '',
  }));
  return NextResponse.json(result);
}

export async function POST(request) {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const { name, age, sport, email, password } = await request.json();

  // Validate
  if (!name || !age || !sport || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  if (!SPORTS.includes(sport)) {
    return NextResponse.json({ error: 'Invalid sport' }, { status: 400 });
  }
  if (typeof age !== 'number' || age < 5 || age > 60) {
    return NextResponse.json({ error: 'Age must be between 5 and 60' }, { status: 400 });
  }

  // Check email uniqueness
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  // Create player first
  const player = await Player.create({ name: name.trim(), age, sport });

  // Create user account for the player
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: email.toLowerCase().trim(),
    passwordHash,
    role: 'player',
    playerId: player._id,
  });

  // Link user back to player
  player.userId = user._id;
  await player.save();

  return NextResponse.json({
    _id: player._id.toString(),
    name: player.name,
    age: player.age,
    sport: player.sport,
    loginEmail: user.email,
  }, { status: 201 });
}
