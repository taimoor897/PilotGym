import Attendance from "../models/Attendance.js";
import Member from "../models/Member.js";

// =====================================================
// GET TODAY'S ATTENDANCE
// =====================================================

export async function getTodayAttendance(req, res) {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      gym: req.gymId,
      checkIn: {
        $gte: start,
        $lte: end,
      },
    })
      .populate({
        path: "member",
        select:
          "memberId name email phone membershipPlan status membershipStart membershipEnd",
        populate: {
          path: "membershipPlan",
          select: "name duration price",
        },
      })
      .sort({
        checkIn: -1,
      });

    res.json({
      success: true,
      attendance,
    });
  } catch (error) {
    console.error(
      "Get today's attendance error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load today's attendance",
    });
  }
}

// =====================================================
// GET ATTENDANCE HISTORY
// =====================================================

export async function getAttendanceHistory(req, res) {
  try {
    const {
      member = "",
      from = "",
      to = "",
      page = 1,
      limit = 100,
    } = req.query;

    const query = {
      gym: req.gymId,
    };

    if (member) {
      query.member = member;
    }

    if (from || to) {
      query.checkIn = {};

      if (from) {
        const startDate = new Date(from);
        startDate.setHours(0, 0, 0, 0);

        query.checkIn.$gte = startDate;
      }

      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);

        query.checkIn.$lte = endDate;
      }
    }

    const pageNumber = Math.max(
      1,
      Number(page) || 1
    );

    const limitNumber = Math.min(
      500,
      Math.max(1, Number(limit) || 100)
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const attendance =
      await Attendance.find(query)
        .populate({
          path: "member",
          select:
            "memberId name email phone membershipPlan status membershipStart membershipEnd",
          populate: {
            path: "membershipPlan",
            select: "name duration price",
          },
        })
        .sort({
          checkIn: -1,
        })
        .skip(skip)
        .limit(limitNumber);

    const total =
      await Attendance.countDocuments(query);

    res.json({
      success: true,
      attendance,
      total,
      page: pageNumber,
      pages: Math.ceil(
        total / limitNumber
      ),
    });
  } catch (error) {
    console.error(
      "Get attendance history error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load attendance history",
    });
  }
}

// =====================================================
// GET MEMBER ATTENDANCE + ANALYTICS
// =====================================================

export async function getMemberAttendance(
  req,
  res
) {
  try {
    // ---------------------------------------------
    // Find member
    // ---------------------------------------------

    const member =
      await Member.findOne({
        _id: req.params.memberId,
        gym: req.gymId,
      }).populate({
        path: "membershipPlan",
        select: "name duration price",
      });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // ---------------------------------------------
    // Get all attendance records
    // ---------------------------------------------

    const attendance =
      await Attendance.find({
        gym: req.gymId,
        member: member._id,
      }).sort({
        checkIn: -1,
      });

    // ---------------------------------------------
    // Basic statistics
    // ---------------------------------------------

    const totalVisits =
      attendance.length;

    const completedVisits =
      attendance.filter(
        (item) =>
          item.status === "Completed"
      ).length;

    const activeVisit =
      attendance.find(
        (item) =>
          item.status === "Checked In"
      ) || null;

    // ---------------------------------------------
    // Training time
    // ---------------------------------------------

    const completedAttendance =
      attendance.filter(
        (item) =>
          item.status === "Completed" &&
          Number(item.duration || 0) > 0
      );

    const totalMinutes =
      completedAttendance.reduce(
        (sum, item) =>
          sum +
          Number(item.duration || 0),
        0
      );

    const averageSessionMinutes =
      completedAttendance.length > 0
        ? Math.round(
            totalMinutes /
              completedAttendance.length
          )
        : 0;

    // ---------------------------------------------
    // Last visit
    // ---------------------------------------------

    const lastVisit =
      attendance.length > 0
        ? attendance[0].checkIn
        : null;

    // ---------------------------------------------
    // Last 7 days
    // ---------------------------------------------

    const sevenDaysAgo =
      new Date();

    sevenDaysAgo.setHours(
      0,
      0,
      0,
      0
    );

    sevenDaysAgo.setDate(
      sevenDaysAgo.getDate() - 6
    );

    const last7Days =
      attendance.filter(
        (item) =>
          new Date(item.checkIn) >=
          sevenDaysAgo
      );

    const uniqueLast7Days =
      new Set(
        last7Days.map((item) =>
          new Date(item.checkIn)
            .toISOString()
            .split("T")[0]
        )
      );

    // ---------------------------------------------
    // Last 30 days
    // ---------------------------------------------

    const thirtyDaysAgo =
      new Date();

    thirtyDaysAgo.setHours(
      0,
      0,
      0,
      0
    );

    thirtyDaysAgo.setDate(
      thirtyDaysAgo.getDate() - 29
    );

    const last30Days =
      attendance.filter(
        (item) =>
          new Date(item.checkIn) >=
          thirtyDaysAgo
      );

    const uniqueLast30Days =
      new Set(
        last30Days.map((item) =>
          new Date(item.checkIn)
            .toISOString()
            .split("T")[0]
        )
      );

    // ---------------------------------------------
    // 30-day activity
    //
    // This represents active days during the
    // last 30 days, not scheduled attendance.
    // ---------------------------------------------

    const activityRate = Math.min(
      100,
      Math.round(
        (uniqueLast30Days.size /
          30) *
          100
      )
    );

    // ---------------------------------------------
    // Current membership information
    // ---------------------------------------------

    let membershipDaysRemaining =
      null;

    let membershipExpired = false;

    if (member.membershipEnd) {
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const membershipEnd =
        new Date(
          member.membershipEnd
        );

      membershipEnd.setHours(
        23,
        59,
        59,
        999
      );

      const difference =
        membershipEnd.getTime() -
        today.getTime();

      membershipDaysRemaining =
        Math.ceil(
          difference /
            (1000 * 60 * 60 * 24)
        );

      membershipExpired =
        membershipDaysRemaining < 0;
    }

    // ---------------------------------------------
    // Attendance consistency label
    // ---------------------------------------------

    let consistency = "No activity";

    if (uniqueLast30Days.size >= 20) {
      consistency = "Excellent";
    } else if (
      uniqueLast30Days.size >= 12
    ) {
      consistency = "Consistent";
    } else if (
      uniqueLast30Days.size >= 6
    ) {
      consistency = "Moderate";
    } else if (
      uniqueLast30Days.size > 0
    ) {
      consistency = "Low";
    }

    // ---------------------------------------------
    // Recent visits
    // ---------------------------------------------

    const recentVisits =
      attendance.slice(0, 5);

    // ---------------------------------------------
    // Response
    // ---------------------------------------------

    res.json({
      success: true,

      member,

      attendance,

      recentVisits,

      stats: {
        totalVisits,
        completedVisits,
        totalMinutes,
        averageSessionMinutes,
        lastVisit,
        activeVisit,

        last7Days: {
          visits:
            last7Days.length,

          activeDays:
            uniqueLast7Days.size,
        },

        last30Days: {
          visits:
            last30Days.length,

          activeDays:
            uniqueLast30Days.size,
        },

        activityRate,

        consistency,

        membershipDaysRemaining,

        membershipExpired,
      },
    });
  } catch (error) {
    console.error(
      "Get member attendance error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load member attendance",
    });
  }
}

// =====================================================
// CHECK IN MEMBER
// =====================================================

export async function checkInMember(
  req,
  res
) {
  try {
    const {
      memberId,
      notes = "",
    } = req.body || {};

    console.log(
      "\n========== CHECK-IN REQUEST =========="
    );

    console.log(
      "Gym ID:",
      req.gymId
    );

    console.log(
      "Member ID:",
      memberId
    );

    console.log(
      "Notes:",
      notes
    );

    // ---------------------------------------------
    // Validate request
    // ---------------------------------------------

    if (!memberId) {
      console.log(
        "CHECK-IN REJECTED: Member ID missing"
      );

      return res.status(400).json({
        success: false,
        message:
          "Member is required.",
      });
    }

    // ---------------------------------------------
    // Verify member belongs to this gym
    // ---------------------------------------------

    const member =
      await Member.findOne({
        _id: memberId,
        gym: req.gymId,
      }).populate({
        path: "membershipPlan",
        select: "name duration price",
      });

    if (!member) {
      console.log(
        "CHECK-IN FAILED: Member not found"
      );

      return res.status(404).json({
        success: false,
        message:
          "Member not found or does not belong to this gym.",
      });
    }

    console.log(
      "Member found:",
      member.name
    );

    console.log(
      "Member status:",
      member.status
    );

    console.log(
      "Membership start:",
      member.membershipStart
    );

    console.log(
      "Membership end:",
      member.membershipEnd
    );

    console.log(
      "Membership plan:",
      member.membershipPlan?.name ||
        "No plan"
    );

    // ---------------------------------------------
    // Check member status
    // ---------------------------------------------

    if (member.status !== "Active") {
      console.log(
        "CHECK-IN REJECTED: Member status:",
        member.status
      );

      return res.status(400).json({
        success: false,
        message: `This member is ${(
          member.status ||
          "inactive"
        ).toLowerCase()} and cannot check in.`,
      });
    }

    // ---------------------------------------------
    // Check membership start date
    // ---------------------------------------------

    if (member.membershipStart) {
      const membershipStart =
        new Date(
          member.membershipStart
        );

      membershipStart.setHours(
        0,
        0,
        0,
        0
      );

      const now =
        new Date();

      if (
        membershipStart >
        now
      ) {
        console.log(
          "CHECK-IN REJECTED: Membership has not started"
        );

        return res.status(400).json({
          success: false,
          message:
            "This membership has not started yet.",
        });
      }
    }

    // ---------------------------------------------
    // Check membership expiry
    // ---------------------------------------------

    if (member.membershipEnd) {
      const membershipEnd =
        new Date(
          member.membershipEnd
        );

      membershipEnd.setHours(
        23,
        59,
        59,
        999
      );

      const now =
        new Date();

      if (
        membershipEnd <
        now
      ) {
        console.log(
          "CHECK-IN REJECTED: Membership expired"
        );

        return res.status(400).json({
          success: false,
          message:
            "Membership has expired. Please renew the membership before checking in.",
        });
      }
    }

    // ---------------------------------------------
    // Prevent duplicate active check-in
    // ---------------------------------------------

    const activeAttendance =
      await Attendance.findOne({
        gym: req.gymId,
        member: member._id,
        status: "Checked In",
      }).sort({
        checkIn: -1,
      });

    if (activeAttendance) {
      console.log(
        "CHECK-IN REJECTED: Already checked in"
      );

      return res.status(400).json({
        success: false,
        message:
          "Member is already checked in.",
        attendance:
          activeAttendance,
      });
    }

    // ---------------------------------------------
    // Create attendance record
    // ---------------------------------------------

    const attendance =
      await Attendance.create({
        gym: req.gymId,
        member: member._id,
        checkIn: new Date(),
        status: "Checked In",
        notes: notes || "",
      });

    console.log(
      "Attendance created:",
      attendance._id
    );

    // ---------------------------------------------
    // Populate created attendance
    // ---------------------------------------------

    const populatedAttendance =
      await Attendance.findById(
        attendance._id
      ).populate({
        path: "member",
        select:
          "memberId name email phone membershipPlan status membershipStart membershipEnd",
        populate: {
          path: "membershipPlan",
          select: "name duration price",
        },
      });

    console.log(
      "CHECK-IN SUCCESS:",
      member.name
    );

    console.log(
      "======================================\n"
    );

    return res.status(201).json({
      success: true,
      message:
        "Member checked in successfully.",
      attendance:
        populatedAttendance,
    });
  } catch (error) {
    console.error(
      "\n========== CHECK-IN ERROR =========="
    );

    console.error(error);

    console.error(
      "====================================\n"
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to check in member.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
}

// =====================================================
// CHECK OUT MEMBER
// =====================================================

export async function checkOutMember(
  req,
  res
) {
  try {
    const attendance =
      await Attendance.findOne({
        _id: req.params.id,
        gym: req.gymId,
        status: "Checked In",
      });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message:
          "Active attendance record not found.",
      });
    }

    const checkOut =
      new Date();

    const checkIn =
      new Date(
        attendance.checkIn
      );

    const duration =
      Math.max(
        0,
        Math.round(
          (checkOut.getTime() -
            checkIn.getTime()) /
            60000
        )
      );

    attendance.checkOut =
      checkOut;

    attendance.duration =
      duration;

    attendance.status =
      "Completed";

    await attendance.save();

    const populatedAttendance =
      await Attendance.findById(
        attendance._id
      ).populate({
        path: "member",
        select:
          "memberId name email phone membershipPlan status membershipStart membershipEnd",
        populate: {
          path: "membershipPlan",
          select: "name duration price",
        },
      });

    res.json({
      success: true,
      message:
        "Member checked out successfully.",
      attendance:
        populatedAttendance,
    });
  } catch (error) {
    console.error(
      "Check out error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to check out member.",
    });
  }
}

// =====================================================
// GET ATTENDANCE STATS
// =====================================================

export async function getAttendanceStats(
  req,
  res
) {
  try {
    const start =
      new Date();

    start.setHours(
      0,
      0,
      0,
      0
    );

    const end =
      new Date();

    end.setHours(
      23,
      59,
      59,
      999
    );

    // ---------------------------------------------
    // Today's visits
    // ---------------------------------------------

    const todayTotal =
      await Attendance.countDocuments({
        gym: req.gymId,
        checkIn: {
          $gte: start,
          $lte: end,
        },
      });

    // ---------------------------------------------
    // Currently inside
    // ---------------------------------------------

    const currentlyInside =
      await Attendance.countDocuments({
        gym: req.gymId,
        status: "Checked In",
      });

    // ---------------------------------------------
    // Today's completed visits
    // ---------------------------------------------

    const todayCompleted =
      await Attendance.countDocuments({
        gym: req.gymId,
        status: "Completed",
        checkIn: {
          $gte: start,
          $lte: end,
        },
      });

    // ---------------------------------------------
    // Total visits
    // ---------------------------------------------

    const totalVisits =
      await Attendance.countDocuments({
        gym: req.gymId,
      });

    // ---------------------------------------------
    // Active members
    // ---------------------------------------------

    const activeMembers =
      await Member.countDocuments({
        gym: req.gymId,
        status: "Active",
      });

    // ---------------------------------------------
    // Today's unique visitors
    // ---------------------------------------------

    const uniqueVisitors =
      await Attendance.distinct(
        "member",
        {
          gym: req.gymId,
          checkIn: {
            $gte: start,
            $lte: end,
          },
        }
      );

    res.json({
      success: true,
      stats: {
        todayTotal,
        currentlyInside,
        todayCompleted,
        totalVisits,
        activeMembers,
        uniqueVisitors:
          uniqueVisitors.length,
      },
    });
  } catch (error) {
    console.error(
      "Attendance stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load attendance statistics",
    });
  }
}

// =====================================================
// DELETE ATTENDANCE RECORD
// =====================================================

export async function deleteAttendance(
  req,
  res
) {
  try {
    const attendance =
      await Attendance.findOneAndDelete({
        _id: req.params.id,
        gym: req.gymId,
      });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message:
          "Attendance record not found.",
      });
    }

    res.json({
      success: true,
      message:
        "Attendance record deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete attendance error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete attendance record.",
    });
  }
}