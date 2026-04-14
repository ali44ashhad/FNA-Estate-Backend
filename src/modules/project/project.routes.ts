import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as ProjectController from "./project.controller";
import { validate } from "../../shared/middlewares/validate";
import { createProjectRequestSchema, filterProjectRequestSchema, recommendProjectsRequestSchema } from "./project.dto";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validate(createProjectRequestSchema),
  ProjectController.createProject
);

router.get("/", validate(filterProjectRequestSchema), ProjectController.getProjects);
router.post("/recommend", validate(recommendProjectsRequestSchema), ProjectController.recommendProjects);
router.get("/:id", ProjectController.getProjectById);

export default router;

