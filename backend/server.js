import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import membershipPlanRoutes from "./routes/membershipPlanRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import trainerRoutes from "./routes/trainerRoutes.js";
import workoutRoutes from "./routes/workoutRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import whatsappAutomationRoutes from "./routes/whatsappAutomationRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";

import {
  initializeWhatsAppSessions,
} from "./services/whatsapp/whatsappService.js";

import {
  startWhatsAppAutomationScheduler,
} from "./services/whatsapp/whatsappAutomationService.js";

dotenv.config();

const app = express();

connectDB();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GymPilot API is running 🚀",
  });
});

/* =========================
   API ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use(
  "/api/membership-plans",
  membershipPlanRoutes
);
app.use("/api/payments", paymentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/trainers", trainerRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/whatsapp", whatsappRoutes);

app.use(
  "/api/whatsapp-automation",
  whatsappAutomationRoutes
);
app.use(
  "/api/reports",
  reportRoutes
);
app.use("/api/expenses", expenseRoutes);

/* =========================
   SERVER
========================= */

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(
    `🚀 GymPilot server running on port ${PORT}`
  );

  try {
    await initializeWhatsAppSessions();

    console.log(
      "📱 WhatsApp sessions initialized."
    );
  } catch (error) {
    console.error(
      "WhatsApp session initialization error:",
      error
    );
  }

  /*
   * ============================================
   * START WHATSAPP AUTOMATION
   * ============================================
   */

  try {
    startWhatsAppAutomationScheduler();

    console.log(
      "🤖 WhatsApp automation scheduler initialized."
    );
  } catch (error) {
    console.error(
      "WhatsApp automation scheduler initialization error:",
      error
    );
  }
});