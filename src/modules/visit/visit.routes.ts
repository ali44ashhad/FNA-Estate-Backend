import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as VisitController from "./visit.controller";

const router = Router();

// Ops/Admin schedules visit
router.post("/", authMiddleware, roleMiddleware("admin", "operations"), VisitController.createVisit);

// Update visit (admin/ops: reschedule; sales: status only)
router.put("/:id", authMiddleware, VisitController.updateVisit);

// Get visit
router.get("/:id", authMiddleware, VisitController.getVisitById);

export default router;

