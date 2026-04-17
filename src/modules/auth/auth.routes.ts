import { Router } from "express";
import * as AuthController from "./auth.controller";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";

const router = Router();

router.post("/register", AuthController.registerUser);
router.post("/login", AuthController.loginUser);
router.post("/google/code", AuthController.googleCode);
router.post("/employee/login", AuthController.loginEmployee);
router.post("/refresh", AuthController.refresh);

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "OK",
    data: { user: req.user ?? null }
  });
});

export default router;

