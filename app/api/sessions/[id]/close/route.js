import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Session from '@/models/Session';
import { requireRole } from '@/lib/auth';

export async function POST(request, { params }) {
  const auth = await requireRole('coach');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await dbConnect();
  const { id } = await params;

  const session = await Session.findById(id);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status === 'closed') {
    return NextResponse.json({ error: 'Session is closed' }, { status: 403 });
  }

  // Check if any player is unmarked (status is null)
  const unmarked = session.attendance.find((a) => a.status === null);
  if (unmarked) {
    return NextResponse.json({ error: 'Mark every player first' }, { status: 400 });
  }

  session.status = 'closed';
  session.closedAt = new Date();
  await session.save();

  return NextResponse.json({ success: true, status: 'closed' });
}
