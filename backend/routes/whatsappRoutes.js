import express from "express";

import {
  getStatus,
  connect,
  disconnect,
  reset,
  sendMessage,
} from "../controllers/whatsappController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

router.get(
  "/status",
  protect,
  getStatus
);

router.post(
  "/connect",
  protect,
  connect
);

router.post(
  "/disconnect",
  protect,
  disconnect
);

router.post(
  "/reset",
  protect,
  reset
);

router.post(
  "/send",
  protect,
  sendMessage
);

export default router;