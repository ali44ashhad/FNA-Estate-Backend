import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/authMiddleware";
import { roleMiddleware } from "../../shared/middlewares/roleMiddleware";
import * as CityController from "./city.controller";
import { validate } from "../../shared/middlewares/validate";
import { filterCitiesRequestSchema } from "./city.dto";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("admin"), CityController.createCity);
router.put("/:id", authMiddleware, roleMiddleware("admin"), CityController.updateCity);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), CityController.deleteCity);

router.get("/", validate(filterCitiesRequestSchema), CityController.getCities);

export default router;

