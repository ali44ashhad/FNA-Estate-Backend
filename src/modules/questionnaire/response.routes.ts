import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as ResponseController from "./response.controller";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("user"), ResponseController.submitResponses);

export default router;

