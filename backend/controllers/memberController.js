import Member from "../models/Member.js";
import "../models/MembershipPlan.js";

const generateMemberId = async (gymId) => {
  const lastMember = await Member.findOne({
    gym: gymId,
  })
    .sort({ createdAt: -1 })
    .select("memberId");

  if (!lastMember) {
    return "MEM-0001";
  }

  const number = parseInt(
    lastMember.memberId.replace("MEM-", ""),
    10
  );

  const nextNumber = Number.isNaN(number)
    ? 1
    : number + 1;

  return `MEM-${String(nextNumber).padStart(4, "0")}`;
};

export const getMembers = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {
      gym: req.gymId,
    };

    if (status !== "all") {
      filter.status = status;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(
        search.trim(),
        "i"
      );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { memberId: searchRegex },
      ];
    }

    const pageNumber = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(parseInt(limit, 10) || 20, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const [members, total] =
      await Promise.all([
        Member.find(filter)
          .populate(
            "membershipPlan",
            "name duration price"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber),

        Member.countDocuments(filter),
      ]);

    res.json({
      success: true,
      members,
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
      "Get members error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch members.",
    });
  }
};

export const getMember = async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.params.id,
      gym: req.gymId,
    }).populate(
      "membershipPlan",
      "name duration price"
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    res.json({
      success: true,
      member,
    });
  } catch (error) {
    console.error(
      "Get member error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch member.",
    });
  }
};

export const createMember = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      gender,
      dateOfBirth,
      address,
      emergencyContact,
      profilePhoto,
      joinDate,
      membershipStart,
      membershipEnd,
      membershipPlan,
      status,
      notes,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "Member name and phone are required.",
      });
    }

    const memberId =
      await generateMemberId(req.gymId);

    const member = await Member.create({
      gym: req.gymId,
      memberId,
      name,
      email,
      phone,
      gender,
      dateOfBirth:
        dateOfBirth || null,
      address,
      emergencyContact,
      profilePhoto,
      joinDate:
        joinDate || new Date(),
      membershipStart:
        membershipStart || null,
      membershipEnd:
        membershipEnd || null,
      membershipPlan:
        membershipPlan || null,
      status: status || "Active",
      notes,
    });

    const populatedMember =
      await Member.findById(member._id).populate(
        "membershipPlan",
        "name duration price"
      );

    res.status(201).json({
      success: true,
      message: "Member created successfully.",
      member: populatedMember,
    });
  } catch (error) {
    console.error(
      "Create member error:",
      error
    );

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A member with this ID already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create member.",
    });
  }
};

export const updateMember = async (req, res) => {
  try {
    const member =
      await Member.findOneAndUpdate(
        {
          _id: req.params.id,
          gym: req.gymId,
        },
        {
          $set: req.body,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "membershipPlan",
        "name duration price"
      );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    res.json({
      success: true,
      message: "Member updated successfully.",
      member,
    });
  } catch (error) {
    console.error(
      "Update member error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update member.",
    });
  }
};

export const deleteMember = async (req, res) => {
  try {
    const member =
      await Member.findOneAndDelete({
        _id: req.params.id,
        gym: req.gymId,
      });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    res.json({
      success: true,
      message: "Member deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete member error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to delete member.",
    });
  }
};