import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
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

    checkIn: {
      type: Date,
      required: true,
      default: Date.now,
    },

    checkOut: {
      type: Date,
      default: null,
    },

    duration: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Checked In", "Completed"],
      default: "Checked In",
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

attendanceSchema.index({
  gym: 1,
  member: 1,
  checkIn: -1,
});

attendanceSchema.index({
  gym: 1,
  checkOut: 1,
});

export default mongoose.model(
  "Attendance",
  attendanceSchema
);