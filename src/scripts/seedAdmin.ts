import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../database/db";
import { Employee } from "../modules/employee/employee.model";

dotenv.config();

const BCRYPT_SALT_ROUNDS = 10;

function requireEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function main() {
  const name = requireEnv("SEED_ADMIN_NAME", "Admin");
  const email = requireEnv("SEED_ADMIN_EMAIL", "admin@test.local");
  const password = requireEnv("SEED_ADMIN_PASSWORD");
  const cityIdRaw = process.env.SEED_ADMIN_CITY_ID;

  await connectDB();

  const existing = await Employee.findOne({ email, isDeleted: false });
  if (existing) {
    console.log(
      JSON.stringify(
        {
          success: true,
          message: "Admin already exists",
          data: {
            id: String(existing._id),
            name: existing.name,
            email: existing.email,
            role: existing.role,
            cityId: existing.cityId ? String(existing.cityId) : null
          }
        },
        null,
        2
      )
    );
    return;
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const cityId =
    cityIdRaw && mongoose.Types.ObjectId.isValid(cityIdRaw)
      ? new mongoose.Types.ObjectId(cityIdRaw)
      : undefined;

  const created = await Employee.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    ...(cityId ? { cityId } : {})
  });

  console.log(
    JSON.stringify(
      {
        success: true,
        message: "Admin created",
        data: {
          id: String(created._id),
          name: created.name,
          email: created.email,
          role: created.role,
          cityId: created.cityId ? String(created.cityId) : null
        }
      },
      null,
      2
    )
  );
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });

