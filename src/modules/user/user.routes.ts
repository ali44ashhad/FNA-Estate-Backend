import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as UserController from "./user.controller";

const router = Router();

router.get("/", authMiddleware, roleMiddleware("admin"), UserController.getUsers);

router.get("/me", authMiddleware, roleMiddleware("user"), UserController.getProfile);
router.put("/me", authMiddleware, roleMiddleware("user"), UserController.updateProfile);

export default router;

