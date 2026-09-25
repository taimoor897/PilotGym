import express from "express";

import {
  getTrainers,
  getTrainer,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from "../controllers/trainerController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getTrainers);

router.get("/:id", getTrainer);

router.post("/", createTrainer);

router.put("/:id", updateTrainer);

router.delete("/:id", deleteTrainer);

export default router;