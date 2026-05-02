import { Router } from "express";
import * as EmployeeController from "./employee.controller";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import { validate } from "../../shared/middlewares/validate";
import { filterEmployeesRequestSchema } from "./employee.dto";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("admin"), EmployeeController.createEmployee);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validate(filterEmployeesRequestSchema),
  EmployeeController.getEmployees
);

router.get(
  "/lookup",
  authMiddleware,
  roleMiddleware("admin", "operations", "sales"),
  validate(filterEmployeesRequestSchema),
  EmployeeController.getEmployeeLookup
);

export default router;

