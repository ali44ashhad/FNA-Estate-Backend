import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./database/db";
import { errorHandler } from "./shared/middlewares/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import employeeRoutes from "./modules/employee/employee.routes";
import userRoutes from "./modules/user/user.routes";
import projectRoutes from "./modules/project/project.routes";
import cityRoutes from "./modules/city/city.routes";
import questionRoutes from "./modules/questionnaire/question.routes";
import responseRoutes from "./modules/questionnaire/response.routes";
import leadRoutes from "./modules/lead/lead.routes";
import visitRoutes from "./modules/visit/visit.routes";
import noteRoutes from "./modules/note/note.routes";
import purchaseRoutes from "./modules/purchase/purchase.routes";
import "./modules/city/city.model";
import "./modules/questionnaire/question.model";
import "./modules/questionnaire/option.model";
import "./modules/questionnaire/userResponse.model";
import "./modules/lead/lead.model";
import "./modules/visit/visit.model";
import "./modules/note/opsNote.model";
import "./modules/note/salesNote.model";
import "./modules/purchase/purchase.model";

dotenv.config();

const app = express();

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : true;

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  void req;
  res.json({ success: true, message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/cities", cityRoutes);
app.use("/api/questionnaire/questions", questionRoutes);
app.use("/api/questionnaire/responses", responseRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/purchases", purchaseRoutes);

app.use(errorHandler);

connectDB();

export default app;

