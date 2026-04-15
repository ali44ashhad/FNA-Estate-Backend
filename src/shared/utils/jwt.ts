import jwt from "jsonwebtoken";

export type AuthTokenPayload = {
  id: string;
  role: string;
};

const ACCESS_TOKEN_EXPIRES_IN = "3h";
const REFRESH_TOKEN_EXPIRES_IN = "7d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return secret;
}

function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("Missing JWT_REFRESH_SECRET");
  return secret;
}

export function generateAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function generateRefreshToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, getJwtRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, getJwtSecret());
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtRefreshSecret());
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token");
  }

  const payload = decoded as { id?: unknown; role?: unknown };
  if (typeof payload.id !== "string" || typeof payload.role !== "string") {
    throw new Error("Invalid token");
  }

  return { id: payload.id, role: payload.role };
}

