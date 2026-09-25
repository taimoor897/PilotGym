import mongoose from "mongoose";

const whatsappAutomationSettingsSchema =
  new mongoose.Schema(
    {
      gym: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Gym",
        required: true,
        unique: true,
        index: true,
      },

      enabled: {
        type: Boolean,
        default: true,
      },

      membership: {
        sevenDays: {
          type: Boolean,
          default: true,
        },

        threeDays: {
          type: Boolean,
          default: true,
        },

        oneDay: {
          type: Boolean,
          default: true,
        },

        expiryDay: {
          type: Boolean,
          default: true,
        },

        afterExpiry: {
          type: Boolean,
          default: true,
        },
      },

      payments: {
        due: {
          type: Boolean,
          default: true,
        },

        overdue: {
          type: Boolean,
          default: true,
        },

        repeated: {
          type: Boolean,
          default: true,
        },
      },

      repeatOverdueDays: {
        type: Number,
        min: 1,
        max: 30,
        default: 1,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "WhatsAppAutomationSettings",
  whatsappAutomationSettingsSchema
);