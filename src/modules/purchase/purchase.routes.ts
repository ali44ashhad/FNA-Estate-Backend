import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as PurchaseController from "./purchase.controller";

const router = Router();

// Admin / Ops records purchase
router.post("/", authMiddleware, roleMiddleware("admin", "operations"), PurchaseController.createPurchase);

// Admin / Ops list purchases
router.get("/", authMiddleware, roleMiddleware("admin", "operations"), PurchaseController.listPurchases);

// Admin / Ops update purchase status
router.put("/:id", authMiddleware, roleMiddleware("admin", "operations"), PurchaseController.updatePurchaseStatus);

// User views own purchases
router.get("/me", authMiddleware, PurchaseController.getMyPurchases);

export default router;

