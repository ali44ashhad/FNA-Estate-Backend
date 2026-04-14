import type { Types } from "mongoose";
import { City } from "./city.model";

export type CreateCityData = {
  name: string;
  state: string;
};

export type UpdateCityData = Partial<CreateCityData>;

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

export async function getAllCities() {
  return City.find({ isDeleted: false }).sort({ name: 1, state: 1 });
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

