import MembershipPlan from "../models/MembershipPlan.js";

export async function getPlans(req, res) {
  try {
    const plans = await MembershipPlan.find({
      gym: req.gymId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Get plans error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load membership plans",
    });
  }
}

export async function getPlan(req, res) {
  try {
    const plan = await MembershipPlan.findOne({
      _id: req.params.id,
      gym: req.gymId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    res.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Get plan error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load membership plan",
    });
  }
}

export async function createPlan(req, res) {
  try {
    const {
      name,
      duration,
      price,
      description,
      status,
    } = req.body;

    if (!name || !duration || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, duration and price are required",
      });
    }

    const existingPlan = await MembershipPlan.findOne({
      gym: req.gymId,
      name: name.trim(),
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: "A plan with this name already exists",
      });
    }

    const plan = await MembershipPlan.create({
      gym: req.gymId,
      name: name.trim(),
      duration: Number(duration),
      price: Number(price),
      description: description || "",
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      message: "Membership plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Create plan error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create membership plan",
    });
  }
}

export async function updatePlan(req, res) {
  try {
    const {
      name,
      duration,
      price,
      description,
      status,
    } = req.body;

    const plan = await MembershipPlan.findOne({
      _id: req.params.id,
      gym: req.gymId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    if (name !== undefined) {
      plan.name = name.trim();
    }

    if (duration !== undefined) {
      plan.duration = Number(duration);
    }

    if (price !== undefined) {
      plan.price = Number(price);
    }

    if (description !== undefined) {
      plan.description = description;
    }

    if (status !== undefined) {
      plan.status = status;
    }

    await plan.save();

    res.json({
      success: true,
      message: "Membership plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Update plan error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update membership plan",
    });
  }
}

export async function deletePlan(req, res) {
  try {
    const plan = await MembershipPlan.findOneAndDelete({
      _id: req.params.id,
      gym: req.gymId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found",
      });
    }

    res.json({
      success: true,
      message: "Membership plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete plan error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete membership plan",
    });
  }
}