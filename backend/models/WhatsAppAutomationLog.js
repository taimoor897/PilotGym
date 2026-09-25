import mongoose from "mongoose";

const whatsappAutomationLogSchema =
  new mongoose.Schema(
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

      type: {
        type: String,
        enum: [
          "membership_7_days",
          "membership_3_days",
          "membership_1_day",
          "membership_today",
          "membership_expired",

          "payment_due",
          "payment_overdue",
          "payment_repeated",
        ],
        required: true,
      },

      payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        default: null,
      },

      scheduledDate: {
        type: Date,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "sent",
          "failed",
        ],
        required: true,
      },

      phone: {
        type: String,
        default: "",
      },

      message: {
        type: String,
        default: "",
      },

      messageId: {
        type: String,
        default: null,
      },

      error: {
        type: String,
        default: "",
      },

      sentAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

whatsappAutomationLogSchema.index(
  {
    gym: 1,
    member: 1,
    type: 1,
    scheduledDate: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model(
  "WhatsAppAutomationLog",
  whatsappAutomationLogSchema
);