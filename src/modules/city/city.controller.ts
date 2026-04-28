import type { Request, Response } from "express";
import {
  cityIdParamSchema,
  createCitySchema,
  filterCitiesSchema,
  updateCitySchema
} from "./city.dto";
import * as CityService from "./city.service";
import { getPagination } from "../../shared/utils/pagination";

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
  const filters = filterCitiesSchema.parse(req.query);

  const wantsPagination =
    filters.page !== undefined || filters.limit !== undefined || filters.q !== undefined;

  if (!wantsPagination) {
    const cities = await CityService.getCities();
    res.json({
      success: true,
      message: "OK",
      data: cities
    });
    return;
  }

  const { page, limit, skip } = getPagination({ page: filters.page, limit: filters.limit });
  const { items, total } = await CityService.getCitiesPaged(filters, { skip, limit });

  res.json({
    success: true,
    message: "OK",
    data: items,
    meta: {
      page,
      limit,
      total,
      hasNext: page * limit < total
    }
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

