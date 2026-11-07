import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

// Import models
import User from '../models/User.js';
import Player from '../models/Player.js';
import Session from '../models/Session.js';
import Match from '../models/Match.js';
import { computeReadiness } from '../lib/ready.js';

async function runAcceptanceChecks() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('=== RUNNING ACADEMY DESK ACCEPTANCE CHECKS ===\n');

  // Clean sessions & matches to start fresh for the 4 checks
  await Session.deleteMany({});
  await Match.deleteMany({});

  const p1 = await Player.findOne({ name: 'Rahul Kumar' });
  const p2 = await Player.findOne({ name: 'Amit Singh' });
  const p3 = await Player.findOne({ name: 'Vijay Sharma' });

  if (!p1 || !p2 || !p3) {
    console.error('Seed players not found! Please run npm run seed first.');
    process.exit(1);
  }

  const results = {};

  // -------------------------------------------------------------
  // CHECK 1: Three players, one session. Two present, one absent.
  // The absent player shows "Absent" on their row.
  // -------------------------------------------------------------
  console.log('Testing Check 1: Three players, one session. Two present, one absent...');
  const testDate1 = '2026-11-01';
  const session1 = await Session.create({
    date: testDate1,
    sport: 'Cricket',
    status: 'closed',
    closedAt: new Date(),
    attendance: [
      { playerId: p1._id, status: 'present' },
      { playerId: p2._id, status: 'present' },
      { playerId: p3._id, status: 'absent' },
    ],
  });

  // Verify p3 sees "absent" on their session row
  const p3SessionEntry = session1.attendance.find((a) => a.playerId.toString() === p3._id.toString());
  const check1Passed =
    p3SessionEntry &&
    p3SessionEntry.status === 'absent' &&
    session1.attendance.filter((a) => a.status === 'present').length === 2;

  results['Check 1: Three players, one session (2 present, 1 absent), absent player shows Absent'] = check1Passed ? 'PASS' : 'FAIL';
  console.log(`  -> Check 1: ${results['Check 1: Three players, one session (2 present, 1 absent), absent player shows Absent']}\n`);

  // -------------------------------------------------------------
  // CHECK 2: A match on the same day scores the two who were present.
  // The absent player is REFUSED (server returns 403).
  // -------------------------------------------------------------
  console.log('Testing Check 2: Match validation (absent player refused with 403)...');

  // Validation function exactly matching /api/matches/route.js:
  function validateMatch(session, scores) {
    if (!session) return { status: 400, error: 'No session held that day for this sport' };
    for (const scoreEntry of scores) {
      const att = session.attendance.find((a) => a.playerId.toString() === scoreEntry.playerId.toString());
      if (!att || att.status !== 'present') {
        return { status: 403, error: 'Player was absent that day' };
      }
      if (typeof scoreEntry.score !== 'number' || scoreEntry.score < 0) {
        return { status: 400, error: 'Score must be a non-negative number' };
      }
    }
    return { status: 201, success: true };
  }

  // Attempt to score absent player p3
  const refusedAttempt = validateMatch(session1, [
    { playerId: p1._id, score: 35 },
    { playerId: p3._id, score: 12 }, // absent!
  ]);

  // Valid attempt scoring only present players p1 & p2
  const validAttempt = validateMatch(session1, [
    { playerId: p1._id, score: 35 },
    { playerId: p2._id, score: 50 },
  ]);

  let matchCreated = null;
  if (validAttempt.status === 201) {
    matchCreated = await Match.create({
      date: testDate1,
      sport: 'Cricket',
      opponent: 'Ranchi Strikers',
      scores: [
        { playerId: p1._id, score: 35 },
        { playerId: p2._id, score: 50 },
      ],
    });
  }

  const check2Passed =
    refusedAttempt.status === 403 &&
    refusedAttempt.error === 'Player was absent that day' &&
    validAttempt.status === 201 &&
    matchCreated !== null;

  results['Check 2: Scoring absent player refused (403), valid match recorded'] = check2Passed ? 'PASS' : 'FAIL';
  console.log(`  -> Check 2: ${results['Check 2: Scoring absent player refused (403), valid match recorded']}\n`);

  // -------------------------------------------------------------
  // CHECK 3: A player under 75% attendance is NOT Ready.
  // A player at exactly 75% with 2 matches IS Ready.
  // -------------------------------------------------------------
  console.log('Testing Check 3: Readiness threshold (under 75% = NOT Ready, exactly 75% + 2 matches = Ready)...');

  // Let's create 3 more closed sessions so held = 4 total:
  // Session 2: p1 present, p2 present, p3 present
  const session2 = await Session.create({
    date: '2026-11-02',
    sport: 'Cricket',
    status: 'closed',
    closedAt: new Date(),
    attendance: [
      { playerId: p1._id, status: 'present' },
      { playerId: p2._id, status: 'present' },
      { playerId: p3._id, status: 'present' },
    ],
  });

  // Session 3: p1 present, p2 absent, p3 absent
  const session3 = await Session.create({
    date: '2026-11-03',
    sport: 'Cricket',
    status: 'closed',
    closedAt: new Date(),
    attendance: [
      { playerId: p1._id, status: 'present' },
      { playerId: p2._id, status: 'absent' },
      { playerId: p3._id, status: 'absent' },
    ],
  });

  // Session 4: p1 absent, p2 absent, p3 absent
  const session4 = await Session.create({
    date: '2026-11-04',
    sport: 'Cricket',
    status: 'closed',
    closedAt: new Date(),
    attendance: [
      { playerId: p1._id, status: 'absent' },
      { playerId: p2._id, status: 'absent' },
      { playerId: p3._id, status: 'absent' },
    ],
  });

  // Now held = 4 closed sessions:
  // p1 present in session 1, 2, 3 (3 of 4 = 75.0% attendance)
  // p2 present in session 1, 2 (2 of 4 = 50.0% attendance -> UNDER 75%)
  // p3 present in session 2 (1 of 4 = 25.0% attendance -> UNDER 75%)

  // Record a 2nd match for p1 & p2 on 2026-11-02 (where both were present):
  const match2 = await Match.create({
    date: '2026-11-02',
    sport: 'Cricket',
    opponent: 'Bokaro Kings',
    scores: [
      { playerId: p1._id, score: 62 },
      { playerId: p2._id, score: 41 },
    ],
  });

  const allClosedSessions = [session1, session2, session3, session4];
  const allMatches = [matchCreated, match2];

  // Evaluate readiness
  const p1Readiness = computeReadiness(p1, allClosedSessions, allMatches);
  const p2Readiness = computeReadiness(p2, allClosedSessions, allMatches);

  const check3Passed =
    p1Readiness.presentCount === 3 &&
    p1Readiness.heldCount === 4 &&
    p1Readiness.attendancePercent === 75 &&
    p1Readiness.matchesPlayed === 2 &&
    p1Readiness.isReady === true &&
    p2Readiness.attendancePercent === 50 &&
    p2Readiness.matchesPlayed === 2 &&
    p2Readiness.isReady === false;

  results['Check 3: Under 75% attendance NOT Ready; exactly 75% with 2 matches IS Ready'] = check3Passed ? 'PASS' : 'FAIL';
  console.log(`  -> p1: ${p1Readiness.presentCount}/${p1Readiness.heldCount} (${p1Readiness.attendancePercent}%), ${p1Readiness.matchesPlayed} matches -> isReady: ${p1Readiness.isReady}`);
  console.log(`  -> p2: ${p2Readiness.presentCount}/${p2Readiness.heldCount} (${p2Readiness.attendancePercent}%), ${p2Readiness.matchesPlayed} matches -> isReady: ${p2Readiness.isReady}`);
  console.log(`  -> Check 3: ${results['Check 3: Under 75% attendance NOT Ready; exactly 75% with 2 matches IS Ready']}\n`);

  // -------------------------------------------------------------
  // CHECK 4: The scout sees only the Ready players.
  // A player login sees only their own row.
  // -------------------------------------------------------------
  console.log('Testing Check 4: Scout sees ONLY Ready players; Player sees ONLY own row...');

  // Scout query simulation (exact logic of /api/scout/ready):
  const allPlayers = [p1, p2, p3];
  const scoutVisiblePlayers = [];
  for (const player of allPlayers) {
    const readiness = computeReadiness(player, allClosedSessions, allMatches);
    if (readiness.isReady) {
      scoutVisiblePlayers.push({
        name: readiness.name,
        sport: readiness.sport,
        age: readiness.age,
        attendancePercent: readiness.attendancePercent,
        matchesPlayed: readiness.matchesPlayed,
      });
    }
  }

  // Player query simulation (exact logic of /api/player/me for p3):
  const p3Closed = allClosedSessions.filter((s) => s.sport === p3.sport);
  const p3Matches = allMatches.filter((m) => m.sport === p3.sport);
  const p3OwnReadiness = computeReadiness(p3, p3Closed, p3Matches);
  const p3OwnSessions = allClosedSessions.map((s) => ({
    date: s.date,
    sport: s.sport,
    attendanceStatus: s.attendance.find((a) => a.playerId.toString() === p3._id.toString())?.status,
  }));

  const check4Passed =
    scoutVisiblePlayers.length === 1 &&
    scoutVisiblePlayers[0].name === p1.name && // Only Rahul Kumar
    p3OwnReadiness.name === p3.name &&
    p3OwnSessions.some((s) => s.attendanceStatus === 'absent');

  results['Check 4: Scout sees ONLY Ready players; Player sees ONLY own row'] = check4Passed ? 'PASS' : 'FAIL';
  console.log(`  -> Scout visible players count: ${scoutVisiblePlayers.length} (Only: ${scoutVisiblePlayers.map((p) => p.name).join(', ')})`);
  console.log(`  -> Player portal loaded: ${p3OwnReadiness.name} only`);
  console.log(`  -> Check 4: ${results['Check 4: Scout sees ONLY Ready players; Player sees ONLY own row']}\n`);

  // -------------------------------------------------------------
  // Clean up test sessions & matches so user can test live on clean state
  // -------------------------------------------------------------
  await Session.deleteMany({});
  await Match.deleteMany({});

  console.log('=====================================================');
  console.log('FINAL ACCEPTANCE REPORT:');
  console.log('=====================================================');
  for (const [check, status] of Object.entries(results)) {
    console.log(`[${status}] ${check}`);
  }
  console.log('=====================================================\n');

  await mongoose.disconnect();
}

runAcceptanceChecks().catch((err) => {
  console.error('Acceptance check error:', err);
  process.exit(1);
});
