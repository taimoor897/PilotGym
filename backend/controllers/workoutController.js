import Workout from "../models/Workout.js";

const generateWorkoutId = async (gymId) => {
  const lastWorkout = await Workout.findOne({
    gym: gymId,
  })
    .sort({ createdAt: -1 })
    .select("workoutId");

  if (!lastWorkout || !lastWorkout.workoutId) {
    return "WKT-0001";
  }

  const number = parseInt(
    lastWorkout.workoutId.replace("WKT-", ""),
    10
  );

  const nextNumber = Number.isNaN(number)
    ? 1
    : number + 1;

  return `WKT-${String(nextNumber).padStart(4, "0")}`;
};

export async function getWorkouts(req, res) {
  try {
    const {
      search = "",
      category = "",
      difficulty = "",
      status = "",
      page = 1,
      limit = 50,
    } = req.query;

    const query = {
      gym: req.gymId,
    };

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");

      query.$or = [
        { name: regex },
        { workoutId: regex },
        { muscleGroup: regex },
        { equipment: regex },
        { description: regex },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (status) {
      query.status = status;
    }

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 50, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const [workouts, total] =
      await Promise.all([
        Workout.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber),

        Workout.countDocuments(query),
      ]);

    res.json({
      success: true,
      workouts,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(
          total / limitNumber
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get workouts error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load workouts.",
    });
  }
}

export async function getWorkout(req, res) {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      gym: req.gymId,
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found.",
      });
    }

    res.json({
      success: true,
      workout,
    });
  } catch (error) {
    console.error(
      "Get workout error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load workout.",
    });
  }
}

export async function createWorkout(req, res) {
  try {
    const {
      name,
      category,
      muscleGroup,
      difficulty,
      equipment,
      description,
      instructions,
      imageUrl,
      videoUrl,
      sets,
      reps,
      duration,
      restTime,
      status,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Workout name is required.",
      });
    }

    const workoutId =
      await generateWorkoutId(req.gymId);

    const workout = await Workout.create({
      gym: req.gymId,

      workoutId,

      name: name.trim(),

      category:
        category || "General",

      muscleGroup:
        muscleGroup?.trim() || "",

      difficulty:
        difficulty || "Beginner",

      equipment:
        equipment?.trim() || "",

      description:
        description?.trim() || "",

      instructions:
        instructions?.trim() || "",

      imageUrl:
        imageUrl?.trim() || "",

      videoUrl:
        videoUrl?.trim() || "",

      sets:
        sets === "" ||
        sets === undefined
          ? 0
          : Number(sets),

      reps:
        reps === "" ||
        reps === undefined
          ? 0
          : Number(reps),

      duration:
        duration === "" ||
        duration === undefined
          ? 0
          : Number(duration),

      restTime:
        restTime === "" ||
        restTime === undefined
          ? 0
          : Number(restTime),

      status:
        status || "Active",

      notes:
        notes?.trim() || "",
    });

    res.status(201).json({
      success: true,
      message: "Workout created successfully.",
      workout,
    });
  } catch (error) {
    console.error(
      "Create workout error:",
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A workout with this ID already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create workout.",
    });
  }
}

export async function updateWorkout(req, res) {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      gym: req.gymId,
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found.",
      });
    }

    const {
      name,
      category,
      muscleGroup,
      difficulty,
      equipment,
      description,
      instructions,
      imageUrl,
      videoUrl,
      sets,
      reps,
      duration,
      restTime,
      status,
      notes,
    } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Workout name is required.",
        });
      }

      workout.name = name.trim();
    }

    if (category !== undefined) {
      workout.category = category;
    }

    if (muscleGroup !== undefined) {
      workout.muscleGroup =
        muscleGroup?.trim() || "";
    }

    if (difficulty !== undefined) {
      workout.difficulty = difficulty;
    }

    if (equipment !== undefined) {
      workout.equipment =
        equipment?.trim() || "";
    }

    if (description !== undefined) {
      workout.description =
        description?.trim() || "";
    }

    if (instructions !== undefined) {
      workout.instructions =
        instructions?.trim() || "";
    }

    if (imageUrl !== undefined) {
      workout.imageUrl =
        imageUrl?.trim() || "";
    }

    if (videoUrl !== undefined) {
      workout.videoUrl =
        videoUrl?.trim() || "";
    }

    if (sets !== undefined) {
      workout.sets =
        sets === ""
          ? 0
          : Number(sets);
    }

    if (reps !== undefined) {
      workout.reps =
        reps === ""
          ? 0
          : Number(reps);
    }

    if (duration !== undefined) {
      workout.duration =
        duration === ""
          ? 0
          : Number(duration);
    }

    if (restTime !== undefined) {
      workout.restTime =
        restTime === ""
          ? 0
          : Number(restTime);
    }

    if (status !== undefined) {
      workout.status = status;
    }

    if (notes !== undefined) {
      workout.notes =
        notes?.trim() || "";
    }

    await workout.save();

    res.json({
      success: true,
      message: "Workout updated successfully.",
      workout,
    });
  } catch (error) {
    console.error(
      "Update workout error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update workout.",
    });
  }
}

export async function deleteWorkout(req, res) {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      gym: req.gymId,
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: "Workout not found.",
      });
    }

    await Workout.deleteOne({
      _id: workout._id,
      gym: req.gymId,
    });

    res.json({
      success: true,
      message: "Workout deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete workout error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete workout.",
    });
  }
}