import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as CityController from "./city.controller";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("admin"), CityController.createCity);
router.put("/:id", authMiddleware, roleMiddleware("admin"), CityController.updateCity);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), CityController.deleteCity);

router.get("/", CityController.getCities);

export default router;

