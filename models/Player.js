import mongoose from 'mongoose';
import { SPORTS } from '../lib/config';

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 5, max: 60 },
  sport: { type: String, enum: SPORTS, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

export default mongoose.models.Player || mongoose.model('Player', PlayerSchema);
