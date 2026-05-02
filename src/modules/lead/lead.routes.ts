import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as LeadController from "./lead.controller";

const router = Router();

// User creates lead
router.post("/", authMiddleware, LeadController.createLead);

// Admin / Ops / Sales view leads (sales scoped to assignedSalesId in service)
router.get("/", authMiddleware, roleMiddleware("admin", "operations", "sales"), LeadController.getLeads);

// Admin / Ops / Sales update lead (sales: status only, assigned lead)
router.put("/:id", authMiddleware, roleMiddleware("admin", "operations", "sales"), LeadController.updateLead);

// Get single lead (owner or admin/ops)
router.get("/:id", authMiddleware, LeadController.getLeadById);

export default router;

