import Payment from "../models/Payment.js";
import "../models/Member.js";
import "../models/MembershipPlan.js";

// ===============================
// GET PAYMENTS
// ===============================
export async function getPayments(req, res) {
  try {
    const {
      search = "",
      status = "",
      paymentMethod = "",
      member = "",
      page = 1,
      limit = 50,
    } = req.query;

    const query = {
      gym: req.gymId,
    };

    if (status) {
      query.status = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (member) {
      query.member = member;
    }

    const skip =
      (Number(page) - 1) *
      Number(limit);

    let payments = await Payment.find(query)
      .populate(
        "member",
        "memberId name email phone"
      )
      .populate(
        "membershipPlan",
        "name duration price"
      )
      .sort({
        paymentDate: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    if (search.trim()) {
      const keyword =
        search.trim().toLowerCase();

      payments = payments.filter(
        (payment) => {
          const memberName =
            payment.member?.name?.toLowerCase() ||
            "";

          const memberId =
            payment.member?.memberId?.toLowerCase() ||
            "";

          const phone =
            payment.member?.phone?.toLowerCase() ||
            "";

          const reference =
            payment.reference?.toLowerCase() ||
            "";

          return (
            memberName.includes(keyword) ||
            memberId.includes(keyword) ||
            phone.includes(keyword) ||
            reference.includes(keyword)
          );
        }
      );
    }

    const total =
      await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      total,
      page: Number(page),
      pages: Math.ceil(
        total / Number(limit)
      ),
    });
  } catch (error) {
    console.error(
      "Get payments error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load payments",
    });
  }
}

// ===============================
// GET SINGLE PAYMENT
// ===============================
export async function getPayment(
  req,
  res
) {
  try {
    const payment =
      await Payment.findOne({
        _id: req.params.id,
        gym: req.gymId,
      })
        .populate(
          "member",
          "memberId name email phone"
        )
        .populate(
          "membershipPlan",
          "name duration price"
        );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error(
      "Get payment error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load payment",
    });
  }
}

// ===============================
// CREATE PAYMENT
// ===============================
export async function createPayment(
  req,
  res
) {
  try {
    const {
      member,
      membershipPlan,
      amount,
      paymentMethod,
      status,
      paymentDate,
      dueDate,
      reference,
      notes,
    } = req.body;

    if (!member) {
      return res.status(400).json({
        success: false,
        message: "Member is required",
      });
    }

    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const Member = (
      await import("../models/Member.js")
    ).default;

    const memberExists =
      await Member.findOne({
        _id: member,
        gym: req.gymId,
      });

    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    if (membershipPlan) {
      const MembershipPlan = (
        await import(
          "../models/MembershipPlan.js"
        )
      ).default;

      const planExists =
        await MembershipPlan.findOne({
          _id: membershipPlan,
          gym: req.gymId,
        });

      if (!planExists) {
        return res.status(404).json({
          success: false,
          message:
            "Membership plan not found",
        });
      }
    }

    const payment =
      await Payment.create({
        gym: req.gymId,
        member,
        membershipPlan:
          membershipPlan || null,
        amount: Number(amount),
        paymentMethod:
          paymentMethod || "Cash",
        status:
          status || "Paid",
        paymentDate:
          paymentDate || new Date(),
        dueDate:
          dueDate ||
          paymentDate ||
          new Date(),
        reference:
          reference || "",
        notes:
          notes || "",
      });

    const populatedPayment =
      await Payment.findById(
        payment._id
      )
        .populate(
          "member",
          "memberId name email phone"
        )
        .populate(
          "membershipPlan",
          "name duration price"
        );

    res.status(201).json({
      success: true,
      message:
        "Payment recorded successfully",
      payment: populatedPayment,
    });
  } catch (error) {
    console.error(
      "Create payment error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create payment",
    });
  }
}

// ===============================
// UPDATE PAYMENT
// ===============================
export async function updatePayment(
  req,
  res
) {
  try {
    const {
      member,
      membershipPlan,
      amount,
      paymentMethod,
      status,
      paymentDate,
      dueDate,
      reference,
      notes,
    } = req.body;

    const payment =
      await Payment.findOne({
        _id: req.params.id,
        gym: req.gymId,
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (member) {
      const Member = (
        await import(
          "../models/Member.js"
        )
      ).default;

      const memberExists =
        await Member.findOne({
          _id: member,
          gym: req.gymId,
        });

      if (!memberExists) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      payment.member = member;
    }

    if (
      membershipPlan !== undefined
    ) {
      if (membershipPlan) {
        const MembershipPlan = (
          await import(
            "../models/MembershipPlan.js"
          )
        ).default;

        const planExists =
          await MembershipPlan.findOne({
            _id: membershipPlan,
            gym: req.gymId,
          });

        if (!planExists) {
          return res.status(404).json({
            success: false,
            message:
              "Membership plan not found",
          });
        }
      }

      payment.membershipPlan =
        membershipPlan || null;
    }

    if (
      amount !== undefined &&
      amount !== ""
    ) {
      payment.amount =
        Number(amount);
    }

    if (
      paymentMethod !== undefined
    ) {
      payment.paymentMethod =
        paymentMethod;
    }

    if (status !== undefined) {
      payment.status = status;
    }

    if (
      paymentDate !== undefined
    ) {
      payment.paymentDate =
        paymentDate;
    }

    if (dueDate !== undefined) {
      payment.dueDate = dueDate;
    }

    if (
      reference !== undefined
    ) {
      payment.reference =
        reference;
    }

    if (notes !== undefined) {
      payment.notes = notes;
    }

    await payment.save();

    const updatedPayment =
      await Payment.findById(
        payment._id
      )
        .populate(
          "member",
          "memberId name email phone"
        )
        .populate(
          "membershipPlan",
          "name duration price"
        );

    res.json({
      success: true,
      message:
        "Payment updated successfully",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error(
      "Update payment error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update payment",
    });
  }
}

// ===============================
// DELETE PAYMENT
// ===============================
export async function deletePayment(
  req,
  res
) {
  try {
    const payment =
      await Payment.findOneAndDelete({
        _id: req.params.id,
        gym: req.gymId,
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      message:
        "Payment deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete payment error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete payment",
    });
  }
}

// ===============================
// PAYMENT STATS
// ===============================
export async function getPaymentStats(
  req,
  res
) {
  try {
    const gym = req.gymId;

    const [
      totalPayments,
      paidResult,
      pendingResult,
      partialResult,
      refundedResult,
    ] = await Promise.all([
      Payment.countDocuments({ gym }),

      Payment.aggregate([
        {
          $match: {
            gym,
            status: "Paid",
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
      ]),

      Payment.aggregate([
        {
          $match: {
            gym,
            status: "Pending",
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
      ]),

      Payment.aggregate([
        {
          $match: {
            gym,
            status: "Partial",
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
      ]),

      Payment.aggregate([
        {
          $match: {
            gym,
            status: "Refunded",
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
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalPayments,
        paid:
          paidResult[0]?.total || 0,
        pending:
          pendingResult[0]?.total || 0,
        partial:
          partialResult[0]?.total || 0,
        refunded:
          refundedResult[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error(
      "Get payment stats error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load payment statistics",
    });
  }
}