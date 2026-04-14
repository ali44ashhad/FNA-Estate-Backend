import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as NoteController from "./note.controller";

const router = Router();

// Add note (Ops or Sales)
router.post("/", authMiddleware, roleMiddleware("operations", "sales"), NoteController.addNote);

// Get notes by lead (Admin/Ops/Sales; visibility restricted in service)
router.get("/:leadId", authMiddleware, roleMiddleware("admin", "operations", "sales"), NoteController.getNotes);

export default router;

