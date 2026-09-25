import mongoose from "mongoose";

import Member from "../models/Member.js";
import Attendance from "../models/Attendance.js";
import Payment from "../models/Payment.js";

const getStartOfDay = (date) => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
};

const getEndOfDay = (date) => {
  const result = new Date(date);

  result.setHours(23, 59, 59, 999);

  return result;
};

const getStartOfMonth = (date) => {
  const result = new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );

  result.setHours(0, 0, 0, 0);

  return result;
};

const getMonthName = (date) => {
  return date.toLocaleString("en-US", {
    month: "short",
  });
};

export const getDashboard = async (req, res) => {
  try {
    const gymId = req.gymId;

    if (!gymId) {
      return res.status(400).json({
        success: false,
        message: "Gym information is missing.",
      });
    }

    const gymObjectId =
      new mongoose.Types.ObjectId(gymId);

    const now = new Date();

    const startOfToday =
      getStartOfDay(now);

    const endOfToday =
      getEndOfDay(now);

    const startOfMonth =
      getStartOfMonth(now);

    const sevenDaysFromNow =
      new Date(now);

    sevenDaysFromNow.setDate(
      sevenDaysFromNow.getDate() + 7
    );

    const inactiveSince =
      new Date(now);

    inactiveSince.setDate(
      inactiveSince.getDate() - 14
    );

    /*
    |--------------------------------------------------------------------------
    | ACTIVE MEMBERS
    |--------------------------------------------------------------------------
    */

    const activeMembers =
      await Member.countDocuments({
        gym: gymObjectId,
        status: "Active",
      });

    /*
    |--------------------------------------------------------------------------
    | TODAY'S CHECK-INS
    |--------------------------------------------------------------------------
    */

    const todayCheckIns =
      await Attendance.countDocuments({
        gym: gymObjectId,
        checkIn: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | MONTHLY REVENUE
    |
    | Revenue is calculated from PAID payments
    | using paymentDate.
    |--------------------------------------------------------------------------
    */

    const monthlyRevenueResult =
      await Payment.aggregate([
        {
          $match: {
            gym: gymObjectId,

            status: "Paid",

            paymentDate: {
              $gte: startOfMonth,
              $lte: now,
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },
          },
        },
      ]);

    const monthlyRevenue =
      monthlyRevenueResult[0]?.total || 0;

    /*
    |--------------------------------------------------------------------------
    | OUTSTANDING PAYMENTS
    |--------------------------------------------------------------------------
    */

    const outstandingResult =
      await Payment.aggregate([
        {
          $match: {
            gym: gymObjectId,

            status: {
              $in: [
                "Pending",
                "Partial",
                "Overdue",
              ],
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },
          },
        },
      ]);

    const outstanding =
      outstandingResult[0]?.total || 0;

    /*
    |--------------------------------------------------------------------------
    | OVERDUE PAYMENTS
    |--------------------------------------------------------------------------
    */

    const overduePayments =
      await Payment.countDocuments({
        gym: gymObjectId,

        status: "Overdue",
      });

    /*
    |--------------------------------------------------------------------------
    | EXPIRING MEMBERSHIPS
    |--------------------------------------------------------------------------
    */

    const expiringMemberships =
      await Member.countDocuments({
        gym: gymObjectId,

        status: "Active",

        membershipEnd: {
          $gte: now,
          $lte: sevenDaysFromNow,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | INACTIVE MEMBERS
    |--------------------------------------------------------------------------
    */

    const recentMemberIds =
      await Attendance.distinct(
        "member",
        {
          gym: gymObjectId,

          checkIn: {
            $gte: inactiveSince,
          },
        }
      );

    const inactiveMembers =
      await Member.countDocuments({
        gym: gymObjectId,

        status: "Active",

        _id: {
          $nin: recentMemberIds,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | REVENUE - LAST 7 MONTHS
    |--------------------------------------------------------------------------
    */

    const revenueOverview = [];

    for (let i = 6; i >= 0; i--) {
      const monthStart =
        new Date(
          now.getFullYear(),
          now.getMonth() - i,
          1
        );

      const nextMonthStart =
        new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          1
        );

      monthStart.setHours(
        0,
        0,
        0,
        0
      );

      nextMonthStart.setHours(
        0,
        0,
        0,
        0
      );

      const revenueResult =
        await Payment.aggregate([
          {
            $match: {
              gym: gymObjectId,

              status: "Paid",

              paymentDate: {
                $gte: monthStart,
                $lt: nextMonthStart,
              },
            },
          },

          {
            $group: {
              _id: null,

              total: {
                $sum: "$amount",
              },
            },
          },
        ]);

      revenueOverview.push({
        month:
          getMonthName(
            monthStart
          ),

        revenue:
          revenueResult[0]?.total || 0,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | RECENT ATTENDANCE
    |--------------------------------------------------------------------------
    */

    const recentAttendanceRecords =
      await Attendance.find({
        gym: gymObjectId,
      })
        .populate(
          "member",
          "name"
        )
        .sort({
          checkIn: -1,
        })
        .limit(5)
        .lean();

    /*
    |--------------------------------------------------------------------------
    | RECENT PAYMENTS
    |--------------------------------------------------------------------------
    */

    const recentPaymentRecords =
      await Payment.find({
        gym: gymObjectId,
      })
        .populate(
          "member",
          "name"
        )
        .sort({
          paymentDate: -1,
          createdAt: -1,
        })
        .limit(5)
        .lean();

    /*
    |--------------------------------------------------------------------------
    | BUILD ACTIVITY FEED
    |--------------------------------------------------------------------------
    */

    const activity = [];

    recentAttendanceRecords.forEach(
      (item) => {
        if (!item.member) {
          return;
        }

        activity.push({
          type: "attendance",

          member:
            item.member.name,

          activity:
            "Checked in",

          date:
            item.checkIn,

          status:
            "Completed",
        });
      }
    );

    recentPaymentRecords.forEach(
      (item) => {
        if (!item.member) {
          return;
        }

        activity.push({
          type: "payment",

          member:
            item.member.name,

          activity:
            item.status === "Paid"
              ? "Payment received"
              : "Payment created",

          date:
            item.paymentDate ||
            item.createdAt,

          status:
            item.status,
        });
      }
    );

    /*
    |--------------------------------------------------------------------------
    | SORT ACTIVITY
    |--------------------------------------------------------------------------
    */

    activity.sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    );

    const recentActivity =
      activity.slice(0, 6);

    /*
    |--------------------------------------------------------------------------
    | SEND RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.json({
      success: true,

      data: {
        stats: {
          activeMembers,
          todayCheckIns,
          monthlyRevenue,
          outstanding,
          overduePayments,
          expiringMemberships,
          inactiveMembers,
        },

        revenueOverview,

        recentActivity,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to load dashboard data.",
    });
  }
};