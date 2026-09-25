import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Gym from "../models/Gym.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      gymId: user.gym,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const register = async (req, res) => {
  try {
    const {
      gymName,
      name,
      email,
      password,
      phone,
    } = req.body;

    if (!gymName || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Gym name, name, email and password are required.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const gym = await Gym.create({
      name: gymName,
      email: email.toLowerCase(),
      phone: phone || "",
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      gym: gym._id,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || "",
      role: "owner",
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Gym account created successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gymId: user.gym,
      },
      gym: {
        id: gym._id,
        name: gym.name,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating account.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).populate("gym");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    if (!user.gym || !user.gym.isActive) {
      return res.status(403).json({
        success: false,
        message: "This gym account is inactive.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gymId: user.gym._id,
      },
      gym: {
        id: user.gym._id,
        name: user.gym.name,
        logo: user.gym.logo,
        currency: user.gym.currency,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while logging in.",
    });
  }
};