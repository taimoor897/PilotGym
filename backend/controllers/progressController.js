import mongoose from "mongoose";

import Progress from "../models/Progress.js";
import Member from "../models/Member.js";

const populateProgress = (query) => {
  return query.populate(
    "member",
    "name memberId phone email profilePhoto status"
  );
};

const validateMeasurements = (data) => {
  const numericFields = [
    { name: "Weight", value: data.weight },
    { name: "Body fat", value: data.bodyFat },
    { name: "Chest", value: data.chest },
    { name: "Waist", value: data.waist },
    { name: "Arms", value: data.arms },
    { name: "Hips", value: data.hips },
    { name: "Thighs", value: data.thighs },
    { name: "Height", value: data.height },
  ];

  for (const field of numericFields) {
    if (
      field.value !== undefined &&
      field.value !== null &&
      field.value !== ""
    ) {
      if (
        !Number.isFinite(Number(field.value)) ||
        Number(field.value) < 0
      ) {
        return `${field.name} must be a valid non-negative number.`;
      }
    }
  }

  if (
    data.bodyFat !== undefined &&
    data.bodyFat !== null &&
    data.bodyFat !== "" &&
    Number(data.bodyFat) > 100
  ) {
    return "Body fat cannot be greater than 100%.";
  }

  return null;
};

const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return Number(value);
};

export const getProgress = async (req, res) => {
  try {
    const {
      member,
      search = "",
      page = 1,
      limit = 20,
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);

    const pageLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const query = {
      gym: req.gymId,
    };

    if (member) {
      if (!mongoose.Types.ObjectId.isValid(member)) {
        return res.status(400).json({
          success: false,
          message: "Invalid member ID.",
        });
      }

      query.member = member;
    }

    if (search.trim()) {
      const matchingMembers = await Member.find({
        gym: req.gymId,
        $or: [
          {
            name: {
              $regex: search.trim(),
              $options: "i",
            },
          },
          {
            memberId: {
              $regex: search.trim(),
              $options: "i",
            },
          },
          {
            phone: {
              $regex: search.trim(),
              $options: "i",
            },
          },
          {
            email: {
              $regex: search.trim(),
              $options: "i",
            },
          },
        ],
      }).select("_id");

      const memberIds = matchingMembers.map(
        (item) => item._id
      );

      if (memberIds.length === 0) {
        return res.json({
          success: true,
          progress: [],
          records: [],
          total: 0,
          page: currentPage,
          pages: 0,
        });
      }

      query.member = {
        $in: memberIds,
      };
    }

    const skip = (currentPage - 1) * pageLimit;

    const [records, total] = await Promise.all([
      populateProgress(
        Progress.find(query)
          .sort({
            recordDate: -1,
            createdAt: -1,
          })
          .skip(skip)
          .limit(pageLimit)
      ),
      Progress.countDocuments(query),
    ]);

    return res.json({
      success: true,
      progress: records,
      records,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageLimit),
    });
  } catch (error) {
    console.error("Get progress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch progress records.",
      error: error.message,
    });
  }
};

export const getMemberProgress = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID.",
      });
    }

    const member = await Member.findOne({
      _id: memberId,
      gym: req.gymId,
    }).select(
      "name memberId phone email profilePhoto status"
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    const records = await populateProgress(
      Progress.find({
        gym: req.gymId,
        member: memberId,
      }).sort({
        recordDate: -1,
        createdAt: -1,
      })
    );

    return res.json({
      success: true,
      member,
      progress: records,
      records,
    });
  } catch (error) {
    console.error(
      "Get member progress error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch member progress.",
      error: error.message,
    });
  }
};

export const getProgressRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid progress record ID.",
      });
    }

    const record = await populateProgress(
      Progress.findOne({
        _id: id,
        gym: req.gymId,
      })
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Progress record not found.",
      });
    }

    return res.json({
      success: true,
      progress: record,
      record,
    });
  } catch (error) {
    console.error(
      "Get progress record error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch progress record.",
      error: error.message,
    });
  }
};

export const createProgress = async (req, res) => {
  try {
    const {
      member,
      recordDate,
      weight,
      bodyFat,
      chest,
      waist,
      arms,
      hips,
      thighs,
      height,
      notes,
      progressPhoto,
    } = req.body;

    if (!member) {
      return res.status(400).json({
        success: false,
        message: "Member is required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(member)) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID.",
      });
    }

    const memberExists = await Member.findOne({
      _id: member,
      gym: req.gymId,
    }).select("_id");

    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    const validationError = validateMeasurements(
      req.body
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const record = await Progress.create({
      gym: req.gymId,
      member,
      recordDate: recordDate || new Date(),
      weight: normalizeNumber(weight),
      bodyFat: normalizeNumber(bodyFat),
      chest: normalizeNumber(chest),
      waist: normalizeNumber(waist),
      arms: normalizeNumber(arms),
      hips: normalizeNumber(hips),
      thighs: normalizeNumber(thighs),
      height: normalizeNumber(height),
      notes: notes || "",
      progressPhoto: progressPhoto || "",
    });

    const populatedRecord = await populateProgress(
      Progress.findById(record._id)
    );

    return res.status(201).json({
      success: true,
      message: "Progress record created successfully.",
      progress: populatedRecord,
      record: populatedRecord,
    });
  } catch (error) {
    console.error(
      "Create progress error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create progress record.",
      error: error.message,
    });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid progress record ID.",
      });
    }

    const existingRecord = await Progress.findOne({
      _id: id,
      gym: req.gymId,
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: "Progress record not found.",
      });
    }

    const validationError = validateMeasurements(
      req.body
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (req.body.member !== undefined) {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.body.member
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid member ID.",
        });
      }

      const memberExists = await Member.findOne({
        _id: req.body.member,
        gym: req.gymId,
      }).select("_id");

      if (!memberExists) {
        return res.status(404).json({
          success: false,
          message: "Member not found.",
        });
      }
    }

    const allowedFields = [
      "member",
      "recordDate",
      "weight",
      "bodyFat",
      "chest",
      "waist",
      "arms",
      "hips",
      "thighs",
      "height",
      "notes",
      "progressPhoto",
    ];

    const numericFields = [
      "weight",
      "bodyFat",
      "chest",
      "waist",
      "arms",
      "hips",
      "thighs",
      "height",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body,
          field
        )
      ) {
        if (numericFields.includes(field)) {
          updateData[field] = normalizeNumber(
            req.body[field]
          );
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    const updatedRecord =
      await Progress.findOneAndUpdate(
        {
          _id: id,
          gym: req.gymId,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    const populatedRecord = await populateProgress(
      Progress.findById(updatedRecord._id)
    );

    return res.json({
      success: true,
      message: "Progress record updated successfully.",
      progress: populatedRecord,
      record: populatedRecord,
    });
  } catch (error) {
    console.error(
      "Update progress error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update progress record.",
      error: error.message,
    });
  }
};

export const deleteProgress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid progress record ID.",
      });
    }

    const record = await Progress.findOneAndDelete({
      _id: id,
      gym: req.gymId,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Progress record not found.",
      });
    }

    return res.json({
      success: true,
      message: "Progress record deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete progress error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete progress record.",
      error: error.message,
    });
  }
};