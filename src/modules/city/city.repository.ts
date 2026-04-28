import type { Types } from "mongoose";
import { City } from "./city.model";

export type CreateCityData = {
  name: string;
  state: string;
  pincode: string;
};

export type UpdateCityData = Partial<CreateCityData>;

export type CityFilters = {
  q?: string;
};

export type CityFindOptions = {
  skip: number;
  limit: number;
};

function exactCaseInsensitive(value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
}

export async function createCity(data: CreateCityData) {
  return City.create(data);
}

export async function findCityById(id: Types.ObjectId) {
  return City.findOne({ _id: id, isDeleted: false });
}

export async function findCityByNameState(name: string, state: string) {
  return City.findOne({
    name: exactCaseInsensitive(name),
    state: exactCaseInsensitive(state),
    isDeleted: false
  });
}

export async function findCityByPincode(pincode: string) {
  return City.findOne({ pincode, isDeleted: false });
}

export async function findDuplicateCityExcludingId(
  id: Types.ObjectId,
  name: string,
  state: string
) {
  return City.findOne({
    _id: { $ne: id },
    name: exactCaseInsensitive(name),
    state: exactCaseInsensitive(state),
    isDeleted: false
  });
}

export async function findDuplicatePincodeExcludingId(id: Types.ObjectId, pincode: string) {
  return City.findOne({
    _id: { $ne: id },
    pincode,
    isDeleted: false
  });
}

export async function getAllCities() {
  return City.find({ isDeleted: false }).sort({ name: 1, state: 1 });
}

function buildFindQuery(filters: CityFilters) {
  const query: Record<string, unknown> = { isDeleted: false };

  if (filters.q) {
    const escaped = filters.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");
    query.$or = [{ name: re }, { state: re }, { pincode: re }];
  }

  return query;
}

export async function findCities(filters: CityFilters, options: CityFindOptions) {
  const query = buildFindQuery(filters);
  return City.find(query).sort({ name: 1, state: 1 }).skip(options.skip).limit(options.limit);
}

export async function countCities(filters: CityFilters) {
  const query = buildFindQuery(filters);
  return City.countDocuments(query);
}

export async function updateCity(id: Types.ObjectId, data: UpdateCityData) {
  return City.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
}

export async function softDeleteCity(id: Types.ObjectId) {
  return City.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
}

