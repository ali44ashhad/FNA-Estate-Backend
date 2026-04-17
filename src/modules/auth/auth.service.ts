import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../shared/errors/AppError";
import {
  generateAccessToken,
  generateRefreshToken,
  type AuthTokenPayload,
  verifyRefreshToken
} from "../../shared/utils/jwt";
import { Employee } from "../employee/employee.model";
import { User } from "../user/user.model";
import type { GoogleCodeInput, LoginInput, RegisterUserInput } from "./auth.dto";

function sanitizeUser(user: { _id: unknown; name: string; email: string }) {
  return { id: String(user._id), name: user.name, email: user.email };
}

function getGoogleOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId) throw new Error("Missing GOOGLE_CLIENT_ID");
  if (!clientSecret) throw new Error("Missing GOOGLE_CLIENT_SECRET");
  if (!redirectUri) throw new Error("Missing GOOGLE_REDIRECT_URI");

  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri
  });
}

export async function registerUser(data: RegisterUserInput) {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError("User already exists", 400);

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    authProvider: "password"
  });

  return sanitizeUser(user);
}

export async function loginUser(data: LoginInput) {
  const user = await User.findOne({ email: data.email });
  if (!user) throw new AppError("User not found", 404);

  if (!user.password) {
    throw new AppError("This account uses Google sign-in", 400);
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const payload = { id: String(user._id), role: "user" };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: sanitizeUser(user)
  };
}

export async function googleCode(input: GoogleCodeInput) {
  const client = getGoogleOAuthClient();
  const clientId = process.env.GOOGLE_CLIENT_ID as string;

  let tokens;
  try {
    const res = await client.getToken(input.code);
    tokens = res.tokens;
  } catch (err: unknown) {
    const details =
      typeof err === "object" && err !== null
        ? {
            name: "name" in err ? (err as { name?: unknown }).name : undefined,
            message: "message" in err ? (err as { message?: unknown }).message : undefined,
            response: "response" in err ? (err as { response?: unknown }).response : undefined
          }
        : { message: String(err) };
    throw new AppError("Google authorization failed", 401, details);
  }

  const idToken = tokens?.id_token;
  if (!idToken) throw new AppError("Google authorization failed", 401);

  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw new AppError("Google authorization failed", 401);
  if (payload.email_verified === false) throw new AppError("Google account email is not verified", 400);

  const googleId = payload.sub;
  const email = payload.email;
  const name = payload.name || payload.given_name || "User";

  const byGoogleId = await User.findOne({ googleId });
  if (byGoogleId) {
    const jwtPayload = { id: String(byGoogleId._id), role: "user" };
    return {
      accessToken: generateAccessToken(jwtPayload),
      refreshToken: generateRefreshToken(jwtPayload),
      user: sanitizeUser(byGoogleId)
    };
  }

  const byEmail = await User.findOne({ email });
  if (byEmail) {
    // Per requirement: do NOT link. Reject if existing email/password user tries Google.
    throw new AppError("Email already registered, please login with password", 400);
  }

  const created = await User.create({
    name,
    email,
    authProvider: "google",
    googleId
  });

  const jwtPayload = { id: String(created._id), role: "user" };
  return {
    accessToken: generateAccessToken(jwtPayload),
    refreshToken: generateRefreshToken(jwtPayload),
    user: sanitizeUser(created)
  };
}

export async function loginEmployee(data: LoginInput) {
  const employee = await Employee.findOne({ email: data.email });
  if (!employee) throw new AppError("Employee not found", 404);

  const isMatch = await bcrypt.compare(data.password, employee.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const payload = { id: String(employee._id), role: employee.role };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    employee: {
      id: String(employee._id),
      name: employee.name,
      email: employee.email,
      role: employee.role
    }
  };
}

export async function refreshSession(refreshToken: string | undefined) {
  if (!refreshToken?.trim()) {
    throw new AppError("Refresh token required", 401);
  }

  let payload: AuthTokenPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  if (payload.role === "user") {
    const user = await User.findById(payload.id);
    if (!user) throw new AppError("Invalid or expired refresh token", 401);

    const nextPayload = { id: String(user._id), role: "user" };
    return {
      accessToken: generateAccessToken(nextPayload),
      refreshToken: generateRefreshToken(nextPayload)
    };
  }

  const employee = await Employee.findById(payload.id);
  if (!employee) throw new AppError("Invalid or expired refresh token", 401);

  const nextPayload = { id: String(employee._id), role: employee.role };
  return {
    accessToken: generateAccessToken(nextPayload),
    refreshToken: generateRefreshToken(nextPayload)
  };
}

