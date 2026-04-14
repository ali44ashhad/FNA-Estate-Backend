import { Router } from "express";
import * as EmployeeController from "./employee.controller";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("admin"), EmployeeController.createEmployee);

router.get("/", authMiddleware, roleMiddleware("admin"), EmployeeController.getEmployees);

export default router;

