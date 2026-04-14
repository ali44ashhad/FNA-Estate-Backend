import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as QuestionController from "./question.controller";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("admin"), QuestionController.createQuestion);
router.get("/", QuestionController.getQuestions);

export default router;

