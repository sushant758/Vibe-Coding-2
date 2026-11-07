import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env.local');
  process.exit(1);
}

// Inline schemas to avoid Next.js import issues
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['coach', 'scout', 'player'], required: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
});

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 5, max: 60 },
  sport: { type: String, enum: ['Cricket', 'Football', 'Badminton', 'Kabaddi', 'Athletics'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Player = mongoose.models.Player || mongoose.model('Player', PlayerSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Coach
  const coachHash = await bcrypt.hash('Coach@123', 10);
  const coach = await User.findOneAndUpdate(
    { email: 'coach@academy.test' },
    { email: 'coach@academy.test', passwordHash: coachHash, role: 'coach', playerId: null },
    { upsert: true, new: true }
  );
  console.log('Coach:', coach.email);

  // 2. Scout
  const scoutHash = await bcrypt.hash('Scout@123', 10);
  const scout = await User.findOneAndUpdate(
    { email: 'scout@academy.test' },
    { email: 'scout@academy.test', passwordHash: scoutHash, role: 'scout', playerId: null },
    { upsert: true, new: true }
  );
  console.log('Scout:', scout.email);

  // 3. Three Cricket players
  const playerData = [
    { name: 'Rahul Kumar', age: 18, sport: 'Cricket', email: 'p1@academy.test' },
    { name: 'Amit Singh', age: 20, sport: 'Cricket', email: 'p2@academy.test' },
    { name: 'Vijay Sharma', age: 19, sport: 'Cricket', email: 'p3@academy.test' },
  ];

  const playerHash = await bcrypt.hash('Player@123', 10);

  for (const pd of playerData) {
    // Upsert player by finding via user email
    let user = await User.findOne({ email: pd.email });
    let player;

    if (user && user.playerId) {
      // Update existing player
      player = await Player.findByIdAndUpdate(
        user.playerId,
        { name: pd.name, age: pd.age, sport: pd.sport },
        { new: true }
      );
      if (!player) {
        player = await Player.create({ name: pd.name, age: pd.age, sport: pd.sport });
      }
      await User.findByIdAndUpdate(user._id, {
        passwordHash: playerHash,
        role: 'player',
        playerId: player._id,
      });
    } else {
      player = await Player.create({ name: pd.name, age: pd.age, sport: pd.sport });
      user = await User.findOneAndUpdate(
        { email: pd.email },
        { email: pd.email, passwordHash: playerHash, role: 'player', playerId: player._id },
        { upsert: true, new: true }
      );
      player.userId = user._id;
      await player.save();
    }

    console.log(`Player: ${pd.name} (${pd.email})`);
  }

  console.log('\nSeed complete! No sessions or matches created.');
  console.log('Logins:');
  console.log('  coach@academy.test / Coach@123');
  console.log('  scout@academy.test / Scout@123');
  console.log('  p1@academy.test / Player@123');
  console.log('  p2@academy.test / Player@123');
  console.log('  p3@academy.test / Player@123');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

