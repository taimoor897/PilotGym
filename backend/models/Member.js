import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    memberId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    emergencyContact: {
      name: {
        type: String,
        default: "",
      },

      phone: {
        type: String,
        default: "",
      },

      relationship: {
        type: String,
        default: "",
      },
    },

    profilePhoto: {
      type: String,
      default: "",
    },

    joinDate: {
      type: Date,
      default: Date.now,
    },

    membershipStart: {
      type: Date,
      default: null,
    },

    membershipEnd: {
      type: Date,
      default: null,
    },

    membershipPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Expired",
        "Suspended",
        "Inactive",
      ],
      default: "Active",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

memberSchema.index(
  { gym: 1, memberId: 1 },
  { unique: true }
);

export default mongoose.model("Member", memberSchema);