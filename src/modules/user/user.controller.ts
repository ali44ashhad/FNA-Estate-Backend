import type { Request, Response } from "express";
import { listMyVisitsSchema } from "../visit/visit.dto";
import * as VisitService from "../visit/visit.service";
import { updateUserSchema } from "./user.dto";
import * as UserService from "./user.service";

export const getProfile = async (req: Request, res: Response) => {
  const user = await UserService.getProfile(req.user!.id);

  res.json({
    success: true,
    message: "OK",
    data: user
  });
};

export const getMyVisits = async (req: Request, res: Response) => {
  const input = listMyVisitsSchema.parse(req.query);
  const data = await VisitService.listVisitsForCustomer(req.user!.id, input);

  res.json({
    success: true,
    message: "OK",
    data
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  const input = updateUserSchema.parse(req.body);
  const user = await UserService.updateProfile(req.user!.id, input);

  res.json({
    success: true,
    message: "Profile updated",
    data: user
  });
};

export const getUsers = async (req: Request, res: Response) => {
  void req;
  const users = await UserService.getUsers();

  res.json({
    success: true,
    message: "OK",
    data: users
  });
};

