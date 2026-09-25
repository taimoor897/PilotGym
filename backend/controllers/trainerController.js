import Trainer from "../models/Trainer.js";

const generateTrainerId = async (gymId) => {
  const lastTrainer = await Trainer.findOne({
    gym: gymId,
  })
    .sort({ createdAt: -1 })
    .select("trainerId");

  if (!lastTrainer || !lastTrainer.trainerId) {
    return "TRN-0001";
  }

  const number = parseInt(
    lastTrainer.trainerId.replace("TRN-", ""),
    10
  );

  const nextNumber = Number.isNaN(number)
    ? 1
    : number + 1;

  return `TRN-${String(nextNumber).padStart(4, "0")}`;
};


/* Get all trainers */

export async function getTrainers(req, res) {
  try {
    const {
      search = "",
      status = "",
      specialization = "",
      page = 1,
      limit = 50,
    } = req.query;

    const query = {
      gym: req.gymId,
    };

    if (search.trim()) {
      const regex = new RegExp(
        search.trim(),
        "i"
      );

      query.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { trainerId: regex },
        { specialization: regex },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (specialization) {
      query.specialization = new RegExp(
        specialization.trim(),
        "i"
      );
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

    const [trainers, total] =
      await Promise.all([
        Trainer.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limitNumber),

        Trainer.countDocuments(query),
      ]);

    res.json({
      success: true,
      trainers,
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
      "Get trainers error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load trainers.",
    });
  }
}


/* Get single trainer */

export async function getTrainer(req, res) {
  try {
    const trainer =
      await Trainer.findOne({
        _id: req.params.id,
        gym: req.gymId,
      });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: "Trainer not found.",
      });
    }

    res.json({
      success: true,
      trainer,
    });
  } catch (error) {
    console.error(
      "Get trainer error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load trainer.",
    });
  }
}


/* Create trainer */

export async function createTrainer(req, res) {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
      salary,
      employmentType,
      joinDate,
      status,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Trainer name is required.",
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Trainer phone number is required.",
      });
    }

    const trainerId =
      await generateTrainerId(
        req.gymId
      );

    const trainer =
      await Trainer.create({
        gym: req.gymId,

        trainerId,

        name: name.trim(),

        email:
          email?.trim().toLowerCase() || "",

        phone: phone.trim(),

        specialization:
          specialization?.trim() || "",

        gender:
          gender || "Male",

        dateOfBirth:
          dateOfBirth || null,

        address:
          address?.trim() || "",

        emergencyContact: {
          name:
            emergencyContact?.name?.trim() ||
            "",

          phone:
            emergencyContact?.phone?.trim() ||
            "",

          relationship:
            emergencyContact?.relationship?.trim() ||
            "",
        },

        salary:
          salary === "" ||
          salary === undefined
            ? 0
            : Number(salary),

        employmentType:
          employmentType || "Monthly",

        joinDate:
          joinDate || undefined,

        status:
          status || "Active",

        notes:
          notes?.trim() || "",
      });

    res.status(201).json({
      success: true,
      message:
        "Trainer created successfully.",
      trainer,
    });
  } catch (error) {
    console.error(
      "Create trainer error:",
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A trainer with this ID already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to create trainer.",
    });
  }
}


/* Update trainer */

export async function updateTrainer(req, res) {
  try {
    const trainer =
      await Trainer.findOne({
        _id: req.params.id,
        gym: req.gymId,
      });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message:
          "Trainer not found.",
      });
    }

    const {
      name,
      email,
      phone,
      specialization,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
      salary,
      employmentType,
      joinDate,
      status,
      notes,
    } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Trainer name is required.",
        });
      }

      trainer.name = name.trim();
    }

    if (email !== undefined) {
      trainer.email =
        email?.trim().toLowerCase() || "";
    }

    if (phone !== undefined) {
      if (!phone.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Trainer phone number is required.",
        });
      }

      trainer.phone = phone.trim();
    }

    if (specialization !== undefined) {
      trainer.specialization =
        specialization?.trim() || "";
    }

    if (gender !== undefined) {
      trainer.gender = gender;
    }

    if (dateOfBirth !== undefined) {
      trainer.dateOfBirth =
        dateOfBirth || null;
    }

    if (address !== undefined) {
      trainer.address =
        address?.trim() || "";
    }

    if (emergencyContact !== undefined) {
      trainer.emergencyContact = {
        name:
          emergencyContact?.name?.trim() ||
          "",

        phone:
          emergencyContact?.phone?.trim() ||
          "",

        relationship:
          emergencyContact?.relationship?.trim() ||
          "",
      };
    }

    if (salary !== undefined) {
      trainer.salary =
        salary === ""
          ? 0
          : Number(salary);
    }

    if (employmentType !== undefined) {
      trainer.employmentType =
        employmentType;
    }

    if (joinDate !== undefined) {
      trainer.joinDate =
        joinDate || trainer.joinDate;
    }

    if (status !== undefined) {
      trainer.status = status;
    }

    if (notes !== undefined) {
      trainer.notes =
        notes?.trim() || "";
    }

    await trainer.save();

    res.json({
      success: true,
      message:
        "Trainer updated successfully.",
      trainer,
    });
  } catch (error) {
    console.error(
      "Update trainer error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update trainer.",
    });
  }
}


/* Delete trainer */

export async function deleteTrainer(req, res) {
  try {
    const trainer =
      await Trainer.findOne({
        _id: req.params.id,
        gym: req.gymId,
      });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message:
          "Trainer not found.",
      });
    }

    await Trainer.deleteOne({
      _id: trainer._id,
      gym: req.gymId,
    });

    res.json({
      success: true,
      message:
        "Trainer deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete trainer error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete trainer.",
    });
  }
}