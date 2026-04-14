import type { Request, Response } from "express";
import { cityIdParamSchema, createCitySchema, updateCitySchema } from "./city.dto";
import * as CityService from "./city.service";

export const createCity = async (req: Request, res: Response) => {
  const input = createCitySchema.parse(req.body);
  const city = await CityService.createCity(input);

  res.json({
    success: true,
    message: "City created",
    data: city
  });
};

export const getCities = async (req: Request, res: Response) => {
  void req;
  const cities = await CityService.getCities();

  res.json({
    success: true,
    message: "OK",
    data: cities
  });
};

export const updateCity = async (req: Request, res: Response) => {
  const idRaw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const cityId = cityIdParamSchema.parse(idRaw);
  const input = updateCitySchema.parse(req.body);

  const city = await CityService.updateCity(cityId, input);

  res.json({
    success: true,
    message: "City updated",
    data: city
  });
};

export const deleteCity = async (req: Request, res: Response) => {
  const idRaw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const cityId = cityIdParamSchema.parse(idRaw);

  await CityService.deleteCity(cityId);

  res.json({
    success: true,
    message: "City deleted"
  });
};

