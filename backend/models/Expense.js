import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: [
        "Rent",
        "Utilities",
        "Salaries",
        "Equipment",
        "Maintenance",
        "Marketing",
        "Supplies",
        "Software",
        "Other",
      ],
      default: "Other",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "Bank Transfer",
        "Card",
        "JazzCash",
        "Easypaisa",
        "Other",
      ],
      default: "Cash",
    },

    expenseDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({
  gym: 1,
  expenseDate: -1,
});

expenseSchema.index({
  gym: 1,
  category: 1,
});

export default mongoose.model("Expense", expenseSchema);