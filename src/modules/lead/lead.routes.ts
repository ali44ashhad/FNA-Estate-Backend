import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as LeadController from "./lead.controller";

const router = Router();

// User creates lead
router.post("/", authMiddleware, LeadController.createLead);

// Admin / Ops view leads (with filters + pagination)
router.get("/", authMiddleware, roleMiddleware("admin", "operations"), LeadController.getLeads);

// Admin / Ops update lead
router.put("/:id", authMiddleware, roleMiddleware("admin", "operations"), LeadController.updateLead);

// Get single lead (owner or admin/ops)
router.get("/:id", authMiddleware, LeadController.getLeadById);

export default router;

