import type { Request, Response } from "express";
import { loginSchema, registerUserSchema } from "./auth.dto";
import * as AuthService from "./auth.service";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS
  };
}

export const registerUser = async (req: Request, res: Response) => {
  const input = registerUserSchema.parse(req.body);
  const user = await AuthService.registerUser(input);

  res.json({
    success: true,
    message: "User registered",
    data: user
  });
};

export const loginUser = async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await AuthService.loginUser(input);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

  res.json({
    success: true,
    message: "Login successful",
    data: { accessToken: result.accessToken, user: result.user }
  });
};

export const loginEmployee = async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const result = await AuthService.loginEmployee(input);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

  res.json({
    success: true,
    message: "Login successful",
    data: { accessToken: result.accessToken, employee: result.employee }
  });
};

