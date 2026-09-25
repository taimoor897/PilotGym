import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },

    membershipPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      default: null,
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

    status: {
      type: String,
      enum: [
        "Paid",
        "Pending",
        "Partial",
        "Refunded",
      ],
      default: "Paid",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    /*
     * Used by WhatsApp payment reminders.
     *
     * Existing payments without a due date will
     * automatically use the payment date.
     */
    dueDate: {
      type: Date,
      default: Date.now,
    },

    reference: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({
  gym: 1,
  member: 1,
  paymentDate: -1,
});

paymentSchema.index({
  gym: 1,
  status: 1,
  dueDate: 1,
});

export default mongoose.model(
  "Payment",
  paymentSchema
);