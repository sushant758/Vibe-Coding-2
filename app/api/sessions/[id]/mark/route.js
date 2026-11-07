import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { requireRole } from '@/lib/auth';

export async function POST(request, { params }) {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const { id } = await params;
  const { playerId, status } = await request.json();

  if (!playerId || !['present', 'absent'].includes(status)) {
    return NextResponse.json({ error: 'playerId and status (present/absent) required' }, { status: 400 });
  }

  const session = await Session.findById(id);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'closed') {
    return NextResponse.json({ error: 'Session is closed' }, { status: 403 });
  }

  const entry = session.attendance.find(
    (a) => a.playerId.toString() === playerId
  );
  if (!entry) {
    return NextResponse.json({ error: 'Player not in this session' }, { status: 404 });
  }

  entry.status = status;
  await session.save();

  return NextResponse.json({ success: true, playerId, status });
}
