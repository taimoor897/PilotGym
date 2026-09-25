import mongoose from "mongoose";

const workoutSchema = new mongoose.Schema(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },

    workoutId: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Strength",
        "Cardio",
        "HIIT",
        "Flexibility",
        "Functional",
        "Core",
        "Weight Loss",
        "General",
      ],
      default: "General",
    },

    muscleGroup: {
      type: String,
      trim: true,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    equipment: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    instructions: {
      type: String,
      trim: true,
      default: "",
    },

    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    videoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    sets: {
      type: Number,
      min: 0,
      default: 0,
    },

    reps: {
      type: Number,
      min: 0,
      default: 0,
    },

    duration: {
      type: Number,
      min: 0,
      default: 0,
    },

    restTime: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
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

workoutSchema.index(
  {
    gym: 1,
    workoutId: 1,
  },
  {
    unique: true,
  }
);

workoutSchema.index({
  gym: 1,
  category: 1,
  difficulty: 1,
});

export default mongoose.model("Workout", workoutSchema);