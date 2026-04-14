import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import type { CreateCityInput, UpdateCityInput } from "./city.dto";
import * as repo from "./city.repository";

type PublicCity = {
  id: string;
  name: string;
  state: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function assertValidCityId(cityId: string) {
  if (!mongoose.Types.ObjectId.isValid(cityId)) {
    throw new AppError("Invalid city id", 400);
  }
}

function sanitizeCity(city: {
  _id: unknown;
  name: string;
  state: string;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicCity {
  return {
    id: String(city._id),
    name: city.name,
    state: city.state,
    createdAt: city.createdAt,
    updatedAt: city.updatedAt
  };
}

export async function assertCityExists(cityId: string) {
  assertValidCityId(cityId);
  const found = await repo.findCityById(new mongoose.Types.ObjectId(cityId));
  if (!found) throw new AppError("Invalid city", 400);
}

export async function createCity(input: CreateCityInput) {
  const name = input.name.trim();
  const state = input.state.trim();

  const existing = await repo.findCityByNameState(name, state);
  if (existing) throw new AppError("City already exists", 400);

  const created = await repo.createCity({ name, state });
  return sanitizeCity(created);
}

export async function getCities() {
  const cities = await repo.getAllCities();
  return cities.map((c) =>
    sanitizeCity({
      _id: c._id,
      name: c.name,
      state: c.state,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    })
  );
}

export async function updateCity(cityId: string, input: UpdateCityInput) {
  assertValidCityId(cityId);
  const id = new mongoose.Types.ObjectId(cityId);

  const current = await repo.findCityById(id);
  if (!current) throw new AppError("City not found", 404);

  const nextName = (typeof input.name === "string" ? input.name : current.name).trim();
  const nextState = (typeof input.state === "string" ? input.state : current.state).trim();

  const duplicate = await repo.findDuplicateCityExcludingId(id, nextName, nextState);
  if (duplicate) throw new AppError("City already exists", 400);

  const updated = await repo.updateCity(id, {
    ...(typeof input.name === "string" ? { name: input.name.trim() } : {}),
    ...(typeof input.state === "string" ? { state: input.state.trim() } : {})
  });
  if (!updated) throw new AppError("City not found", 404);

  return sanitizeCity(updated);
}

export async function deleteCity(cityId: string) {
  assertValidCityId(cityId);
  const deleted = await repo.softDeleteCity(new mongoose.Types.ObjectId(cityId));
  if (!deleted) throw new AppError("City not found", 404);
}

