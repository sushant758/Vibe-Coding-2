import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dumka-sports-academy-secret-key-32chars');

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireRole(...roles) {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (!roles.includes(session.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { session };
}
