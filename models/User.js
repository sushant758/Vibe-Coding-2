import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['coach', 'scout', 'player'], required: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
