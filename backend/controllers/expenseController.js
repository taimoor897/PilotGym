import Expense from "../models/Expense.js";

const getDateRange = (startDate, endDate) => {
  const start = startDate
    ? new Date(startDate)
    : new Date(new Date().getFullYear(), 0, 1);

  const end = endDate
    ? new Date(endDate)
    : new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/* =========================
   GET EXPENSES
========================= */

export const getExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    const { start, end } = getDateRange(
      startDate,
      endDate
    );

    const filter = {
      gym: req.gymId,
      expenseDate: {
        $gte: start,
        $lte: end,
      },
    };

    if (category && category !== "All") {
      filter.category = category;
    }

    const expenses = await Expense.find(filter)
      .sort({
        expenseDate: -1,
        createdAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    console.error(
      "Get expenses error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load expenses.",
    });
  }
};

/* =========================
   GET EXPENSE SUMMARY
========================= */

export const getExpenseSummary = async (
  req,
  res
) => {
  try {
    const { startDate, endDate } = req.query;

    const { start, end } = getDateRange(
      startDate,
      endDate
    );

    const filter = {
      gym: req.gymId,
      expenseDate: {
        $gte: start,
        $lte: end,
      },
    };

    const summary = await Expense.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: null,
          totalExpenses: {
            $sum: "$amount",
          },
          expenseCount: {
            $sum: 1,
          },
        },
      },
    ]);

    const categoryBreakdown =
      await Expense.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$category",
            total: {
              $sum: "$amount",
            },
          },
        },
        {
          $sort: {
            total: -1,
          },
        },
      ]);

    const monthlyExpenses =
      await Expense.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: {
              year: {
                $year: "$expenseDate",
              },
              month: {
                $month: "$expenseDate",
              },
            },
            total: {
              $sum: "$amount",
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]);

    return res.json({
      success: true,
      data: {
        totalExpenses:
          summary[0]?.totalExpenses || 0,

        expenseCount:
          summary[0]?.expenseCount || 0,

        categoryBreakdown,

        monthlyExpenses,
      },
    });
  } catch (error) {
    console.error(
      "Expense summary error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load expense summary.",
    });
  }
};

/* =========================
   CREATE EXPENSE
========================= */

export const createExpense = async (
  req,
  res
) => {
  try {
    const {
      category,
      amount,
      paymentMethod,
      expenseDate,
      description,
    } = req.body;

    if (
      amount === undefined ||
      amount === null ||
      Number(amount) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid expense amount is required.",
      });
    }

    const expense = await Expense.create({
      gym: req.gymId,
      category: category || "Other",
      amount: Number(amount),
      paymentMethod:
        paymentMethod || "Cash",
      expenseDate:
        expenseDate || new Date(),
      description:
        description || "",
    });

    return res.status(201).json({
      success: true,
      message: "Expense added successfully.",
      data: expense,
    });
  } catch (error) {
    console.error(
      "Create expense error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create expense.",
    });
  }
};

/* =========================
   UPDATE EXPENSE
========================= */

export const updateExpense = async (
  req,
  res
) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      gym: req.gymId,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    const {
      category,
      amount,
      paymentMethod,
      expenseDate,
      description,
    } = req.body;

    if (category !== undefined) {
      expense.category = category;
    }

    if (amount !== undefined) {
      if (Number(amount) < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Expense amount cannot be negative.",
        });
      }

      expense.amount = Number(amount);
    }

    if (paymentMethod !== undefined) {
      expense.paymentMethod =
        paymentMethod;
    }

    if (expenseDate !== undefined) {
      expense.expenseDate = expenseDate;
    }

    if (description !== undefined) {
      expense.description = description;
    }

    await expense.save();

    return res.json({
      success: true,
      message: "Expense updated successfully.",
      data: expense,
    });
  } catch (error) {
    console.error(
      "Update expense error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update expense.",
    });
  }
};

/* =========================
   DELETE EXPENSE
========================= */

export const deleteExpense = async (
  req,
  res
) => {
  try {
    const expense =
      await Expense.findOneAndDelete({
        _id: req.params.id,
        gym: req.gymId,
      });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    return res.json({
      success: true,
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete expense error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete expense.",
    });
  }
};