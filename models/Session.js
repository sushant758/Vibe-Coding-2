import mongoose from 'mongoose';
import { SPORTS } from '../lib/config.js';

const AttendanceEntrySchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  status: { type: String, enum: ['present', 'absent'], default: null },
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  sport: { type: String, enum: SPORTS, required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  attendance: [AttendanceEntrySchema],
  closedAt: { type: Date, default: null },
}, { timestamps: true });

SessionSchema.index({ date: 1, sport: 1 }, { unique: true });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
