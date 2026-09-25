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

const getMonthName = (date) => {
  return date.toLocaleString("en-US", {
    month: "short",
  });
};

export const getReports = async (req, res) => {
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

    /*
    |--------------------------------------------------------------------------
    | DATE RANGE
    |--------------------------------------------------------------------------
    */

    const now = new Date();

    let startDate;
    let endDate;

    if (req.query.startDate) {
      startDate = getStartOfDay(
        new Date(req.query.startDate)
      );
    } else {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      startDate = getStartOfDay(
        startDate
      );
    }

    if (req.query.endDate) {
      endDate = getEndOfDay(
        new Date(req.query.endDate)
      );
    } else {
      endDate = getEndOfDay(now);
    }

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range.",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message:
          "Start date cannot be after end date.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENTS IN DATE RANGE
    |--------------------------------------------------------------------------
    */

    const paymentDateFilter = {
      $gte: startDate,
      $lte: endDate,
    };

    const rangePayments =
      await Payment.find({
        gym: gymObjectId,
        paymentDate: paymentDateFilter,
      })
        .populate(
          "member",
          "name memberId"
        )
        .lean();

    /*
    |--------------------------------------------------------------------------
    | REVENUE
    |--------------------------------------------------------------------------
    */

    const paidPayments =
      rangePayments.filter(
        (payment) =>
          payment.status === "Paid"
      );

    const monthlyRevenue =
      paidPayments.reduce(
        (total, payment) =>
          total +
          Number(payment.amount || 0),
        0
      );

    const totalTransactions =
      rangePayments.length;

    /*
    |--------------------------------------------------------------------------
    | PAYMENT STATUS SUMMARY
    |--------------------------------------------------------------------------
    */

    const pendingPayments =
      rangePayments.filter(
        (payment) =>
          payment.status ===
          "Pending"
      );

    const partialPayments =
      rangePayments.filter(
        (payment) =>
          payment.status ===
          "Partial"
      );

    const refundedPayments =
      rangePayments.filter(
        (payment) =>
          payment.status ===
          "Refunded"
      );

    const pendingAmount =
      pendingPayments.reduce(
        (total, payment) =>
          total +
          Number(payment.amount || 0),
        0
      );

    const partialAmount =
      partialPayments.reduce(
        (total, payment) =>
          total +
          Number(payment.amount || 0),
        0
      );

    const refundedAmount =
      refundedPayments.reduce(
        (total, payment) =>
          total +
          Number(payment.amount || 0),
        0
      );

    /*
    |--------------------------------------------------------------------------
    | PAYMENT METHOD BREAKDOWN
    |--------------------------------------------------------------------------
    */

    const paymentMethodMap = {};

    paidPayments.forEach(
      (payment) => {
        const method =
          payment.paymentMethod ||
          "Other";

        if (
          !paymentMethodMap[
            method
          ]
        ) {
          paymentMethodMap[
            method
          ] = 0;
        }

        paymentMethodMap[
          method
        ] += Number(
          payment.amount || 0
        );
      }
    );

    const paymentMethods =
      Object.entries(
        paymentMethodMap
      )
        .map(
          ([
            method,
            amount,
          ]) => ({
            method,
            amount,
          })
        )
        .sort(
          (a, b) =>
            b.amount - a.amount
        );

    /*
    |--------------------------------------------------------------------------
    | MEMBERS
    |--------------------------------------------------------------------------
    */

    const totalMembers =
      await Member.countDocuments({
        gym: gymObjectId,
      });

    const activeMembers =
      await Member.countDocuments({
        gym: gymObjectId,
        status: "Active",
      });

    const expiredMembers =
      await Member.countDocuments({
        gym: gymObjectId,
        status: "Expired",
      });

    const suspendedMembers =
      await Member.countDocuments({
        gym: gymObjectId,
        status: "Suspended",
      });

    const inactiveMembers =
      await Member.countDocuments({
        gym: gymObjectId,
        status: "Inactive",
      });

    /*
    |--------------------------------------------------------------------------
    | NEW MEMBERS IN DATE RANGE
    |--------------------------------------------------------------------------
    */

    const newMembers =
      await Member.countDocuments({
        gym: gymObjectId,
        joinDate: {
          $gte: startDate,
          $lte: endDate,
        },
      });

    /*
    |--------------------------------------------------------------------------
    | ATTENDANCE
    |--------------------------------------------------------------------------
    */

    const attendanceRecords =
      await Attendance.find({
        gym: gymObjectId,
        checkIn: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate(
          "member",
          "name"
        )
        .lean();

    const totalCheckIns =
      attendanceRecords.length;

    const uniqueMemberIds =
      new Set();

    attendanceRecords.forEach(
      (record) => {
        if (record.member?._id) {
          uniqueMemberIds.add(
            String(
              record.member._id
            )
          );
        }
      }
    );

    const uniqueAttendees =
      uniqueMemberIds.size;

    const attendanceByDayMap =
      {};

    attendanceRecords.forEach(
      (record) => {
        const date =
          new Date(
            record.checkIn
          );

        const key =
          date
            .toISOString()
            .split("T")[0];

        if (
          !attendanceByDayMap[
            key
          ]
        ) {
          attendanceByDayMap[
            key
          ] = 0;
        }

        attendanceByDayMap[
          key
        ]++;
      }
    );

    const attendanceByDay =
      Object.entries(
        attendanceByDayMap
      )
        .map(
          ([
            date,
            count,
          ]) => ({
            date,
            count,
          })
        )
        .sort(
          (a, b) =>
            new Date(a.date) -
            new Date(b.date)
        );

    const averageDailyAttendance =
      attendanceByDay.length
        ? Math.round(
            totalCheckIns /
              attendanceByDay.length
          )
        : 0;

    /*
    |--------------------------------------------------------------------------
    | REVENUE BY MONTH
    |--------------------------------------------------------------------------
    */

    const revenueByMonthMap =
      {};

    paidPayments.forEach(
      (payment) => {
        const paymentDate =
          new Date(
            payment.paymentDate
          );

        const key =
          `${paymentDate.getFullYear()}-${String(
            paymentDate.getMonth() + 1
          ).padStart(2, "0")}`;

        if (
          !revenueByMonthMap[
            key
          ]
        ) {
          revenueByMonthMap[
            key
          ] = {
            year:
              paymentDate.getFullYear(),

            month:
              paymentDate.getMonth(),

            revenue: 0,
          };
        }

        revenueByMonthMap[
          key
        ].revenue += Number(
          payment.amount || 0
        );
      }
    );

    const revenueByMonth =
      Object.values(
        revenueByMonthMap
      )
        .sort(
          (a, b) => {
            if (
              a.year !==
              b.year
            ) {
              return (
                a.year -
                b.year
              );
            }

            return (
              a.month -
              b.month
            );
          }
        )
        .map(
          (item) => ({
            month:
              getMonthName(
                new Date(
                  item.year,
                  item.month,
                  1
                )
              ),

            year: item.year,

            revenue:
              item.revenue,
          })
        );

    /*
    |--------------------------------------------------------------------------
    | OUTSTANDING PAYMENTS
    |--------------------------------------------------------------------------
    */

    const outstandingPayments =
      await Payment.find({
        gym: gymObjectId,

        status: {
          $in: [
            "Pending",
            "Partial",
          ],
        },
      })
        .populate(
          "member",
          "name memberId"
        )
        .sort({
          dueDate: 1,
        })
        .limit(20)
        .lean();

    const outstandingAmount =
      outstandingPayments.reduce(
        (total, payment) =>
          total +
          Number(payment.amount || 0),
        0
      );

    /*
    |--------------------------------------------------------------------------
    | EXPIRING MEMBERSHIPS
    |--------------------------------------------------------------------------
    */

    const expiringDate =
      new Date(now);

    expiringDate.setDate(
      expiringDate.getDate() + 30
    );

    const expiringMemberships =
      await Member.find({
        gym: gymObjectId,

        status: "Active",

        membershipEnd: {
          $gte: now,
          $lte: expiringDate,
        },
      })
        .sort({
          membershipEnd: 1,
        })
        .limit(20)
        .lean();

    /*
    |--------------------------------------------------------------------------
    | RECENT TRANSACTIONS
    |--------------------------------------------------------------------------
    */

    const recentTransactions =
      [...rangePayments]
        .sort(
          (a, b) =>
            new Date(
              b.paymentDate
            ) -
            new Date(
              a.paymentDate
            )
        )
        .slice(0, 20)
        .map(
          (payment) => ({
            id: payment._id,

            member:
              payment.member?.name ||
              "Unknown member",

            amount:
              Number(
                payment.amount || 0
              ),

            method:
              payment.paymentMethod ||
              "Other",

            status:
              payment.status,

            date:
              payment.paymentDate ||
              payment.createdAt,
          })
        );

    /*
    |--------------------------------------------------------------------------
    | SEND RESPONSE
    |--------------------------------------------------------------------------
    */

    return res.json({
      success: true,

      data: {
        dateRange: {
          startDate,
          endDate,
        },

        revenue: {
          total:
            monthlyRevenue,

          paidTransactions:
            paidPayments.length,

          totalTransactions,

          pendingAmount,

          partialAmount,

          refundedAmount,

          revenueByMonth,
        },

        paymentMethods,

        members: {
          total:
            totalMembers,

          active:
            activeMembers,

          expired:
            expiredMembers,

          suspended:
            suspendedMembers,

          inactive:
            inactiveMembers,

          new:
            newMembers,
        },

        attendance: {
          totalCheckIns,

          uniqueAttendees,

          averageDailyAttendance,

          attendanceByDay,
        },

        outstanding: {
          amount:
            outstandingAmount,

          count:
            outstandingPayments.length,

          payments:
            outstandingPayments,
        },

        expiringMemberships,

        recentTransactions,
      },
    });
  } catch (error) {
    console.error(
      "Reports error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to generate reports.",
    });
  }
};