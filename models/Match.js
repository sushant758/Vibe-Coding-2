import mongoose from 'mongoose';
import { SPORTS } from '../lib/config.js';

const ScoreEntrySchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  score: { type: Number, required: true, min: 0 },
}, { _id: false });

const MatchSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  sport: { type: String, enum: SPORTS, required: true },
  opponent: { type: String, required: true, trim: true },
  scores: [ScoreEntrySchema],
}, { timestamps: true });

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);
