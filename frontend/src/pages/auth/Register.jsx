import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

import { apiRequest } from "../../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    gymName: "",
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.gymName ||
      !form.name ||
      !form.email ||
      !form.password
    ) {
      Swal.fire({
        icon: "warning",
        title: "Missing information",
        text: "Please complete all required fields.",
      });

      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(form),
        }
      );

      localStorage.setItem(
        "gympilot_token",
        data.token
      );

      localStorage.setItem(
        "gympilot_user",
        JSON.stringify(data.user)
      );

      localStorage.setItem(
        "gympilot_gym",
        JSON.stringify(data.gym)
      );

      Swal.fire({
        icon: "success",
        title: "Welcome to GymPilot!",
        text: "Your gym account has been created.",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/dashboard");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration failed",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-decoration decoration-one" />
      <div className="auth-decoration decoration-two" />

      <div className="auth-container register-container">
        <div className="auth-brand">
          <div className="brand-icon">
            <Dumbbell size={25} />
          </div>

          <div>
            <h1>GymPilot</h1>
            <span>SMART GYM MANAGEMENT</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <p className="eyebrow">
              GET STARTED
            </p>

            <h2>
              Build a smarter
              <br />
              <span>gym business.</span>
            </h2>

            <p>
              Create your gym account and start
              managing everything in one place.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Gym name</label>

              <div className="input-wrapper">
                <Building2 size={18} />

                <input
                  type="text"
                  name="gymName"
                  placeholder="e.g. PowerHouse Fitness"
                  value={form.gymName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <label>Your name</label>

                <div className="input-wrapper">
                  <User size={18} />

                  <input
                    type="text"
                    name="name"
                    placeholder="John Smith"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Phone</label>

                <div className="input-wrapper">
                  <Phone size={18} />

                  <input
                    type="tel"
                    name="phone"
                    placeholder="+92..."
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>Email address</label>

              <div className="input-wrapper">
                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  placeholder="owner@gym.com"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>

              <div className="input-wrapper">
                <Lock size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="spin"
                  />
                  Creating account...
                </>
              ) : (
                <>
                  Create gym account
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>

            <Link to="/login">
              Sign in
            </Link>
          </div>
        </div>

        <p className="auth-bottom-text">
          GymPilot · Smart Gym Management
        </p>
      </div>
    </div>
  );
}