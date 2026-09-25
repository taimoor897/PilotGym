import express from "express";

import {
  getAutomationSettings,
  updateAutomationSettings,
} from "../controllers/whatsappAutomationController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

router.use(protect);

router.get(
  "/settings",
  getAutomationSettings
);

router.put(
  "/settings",
  updateAutomationSettings
);

export default router;