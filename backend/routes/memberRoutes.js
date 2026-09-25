import express from "express";

import {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
} from "../controllers/memberController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getMembers);

router.get("/:id", getMember);

router.post("/", createMember);

router.put("/:id", updateMember);

router.delete("/:id", deleteMember);

export default router;