import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
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

    recordDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    weight: {
      type: Number,
      min: 0,
      default: null,
    },

    bodyFat: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    chest: {
      type: Number,
      min: 0,
      default: null,
    },

    waist: {
      type: Number,
      min: 0,
      default: null,
    },

    arms: {
      type: Number,
      min: 0,
      default: null,
    },

    hips: {
      type: Number,
      min: 0,
      default: null,
    },

    thighs: {
      type: Number,
      min: 0,
      default: null,
    },

    height: {
      type: Number,
      min: 0,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    progressPhoto: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

progressSchema.index({
  gym: 1,
  member: 1,
  recordDate: -1,
});

export default mongoose.model(
  "Progress",
  progressSchema
);