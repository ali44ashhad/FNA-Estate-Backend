import mongoose from "mongoose";
import { Counter } from "./counter.model";

export async function nextCounterSeq(params: { key: string; projectId?: string }) {
  const key = params.key;
  const projectId =
    typeof params.projectId === "string" && mongoose.Types.ObjectId.isValid(params.projectId)
      ? new mongoose.Types.ObjectId(params.projectId)
      : undefined;

  const doc = await Counter.findOneAndUpdate(
    { key, ...(projectId ? { projectId } : { projectId: { $exists: false } }) },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  ).lean();

  const seq = doc && typeof (doc as any).seq === "number" ? (doc as any).seq : NaN;
  if (!Number.isFinite(seq)) throw new Error("Failed to allocate counter sequence");
  return seq;
}

