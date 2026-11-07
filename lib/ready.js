// NEVER store isReady or attendance in the DB. Compute on every request.
// Uses integer math: presentCount * 4 >= heldCount * 3 (avoids float 75% check)

export function computeReadiness(player, closedSessions, matches) {
  // closedSessions: array of closed Session docs for this player's sport
  // matches: array of Match docs for this player's sport

  const playerId = player._id.toString();
  const held = closedSessions.length;

  let presentCount = 0;
  for (const session of closedSessions) {
    const entry = session.attendance.find(
      (a) => a.playerId.toString() === playerId
    );
    if (entry && entry.status === 'present') {
      presentCount++;
    }
  }

  // Attendance %: if held = 0, attendance is 0
  const attendancePercent = held === 0 ? 0 : Math.round((presentCount * 100) / held);

  // Count matches played: matches of this sport where the player has a score entry
  let matchesPlayed = 0;
  for (const match of matches) {
    const hasScore = match.scores.some(
      (s) => s.playerId.toString() === playerId
    );
    if (hasScore) {
      matchesPlayed++;
    }
  }

  // Ready = integer check: presentCount * 4 >= held * 3 AND matchesPlayed >= 2
  // If held = 0, not ready (0 * 4 = 0, 0 * 3 = 0, 0 >= 0 is true but we need held > 0)
  const meetsAttendance = held > 0 && presentCount * 4 >= held * 3;
  const isReady = meetsAttendance && matchesPlayed >= 2;

  return {
    name: player.name,
    sport: player.sport,
    age: player.age,
    presentCount,
    heldCount: held,
    attendancePercent,
    matchesPlayed,
    isReady,
  };
}
