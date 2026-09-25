import express from "express";

import {
  getTodayAttendance,
  getAttendanceHistory,
  getMemberAttendance,
  checkInMember,
  checkOutMember,
  getAttendanceStats,
  deleteAttendance,
} from "../controllers/attendanceController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);


// Statistics
router.get(
  "/stats",
  getAttendanceStats
);


// Today's attendance
router.get(
  "/today",
  getTodayAttendance
);


// Member attendance
router.get(
  "/member/:memberId",
  getMemberAttendance
);


// Full attendance history
router.get(
  "/history",
  getAttendanceHistory
);


// Check in
router.post(
  "/check-in",
  checkInMember
);


// Check out
router.put(
  "/check-out/:id",
  checkOutMember
);


// Delete attendance record
router.delete(
  "/:id",
  deleteAttendance
);


export default router;