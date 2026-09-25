import express from "express";

import {
  getProgress,
  getMemberProgress,
  getProgressRecord,
  createProgress,
  updateProgress,
  deleteProgress,
} from "../controllers/progressController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getProgress);

router.get(
  "/member/:memberId",
  getMemberProgress
);

router.get("/:id", getProgressRecord);

router.post("/", createProgress);

router.put("/:id", updateProgress);

router.delete("/:id", deleteProgress);

export default router;