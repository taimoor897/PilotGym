import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

import { apiRequest } from "../../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      Swal.fire({
        icon: "warning",
        title: "Missing information",
        text: "Please enter your email and password.",
      });

      return;
    }

    try {
      setLoading(true);

      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

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

      navigate("/dashboard");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login failed",
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

      <div className="auth-container">
        <div className="auth-brand">
          <div className="brand-icon">
            <Dumbbell size={25} strokeWidth={2.5} />
          </div>

          <div>
            <h1>GymPilot</h1>
            <span>SMART GYM MANAGEMENT</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <p className="eyebrow">WELCOME BACK</p>

            <h2>
              Run your gym.
              <br />
              <span>Grow your business.</span>
            </h2>

            <p>
              Sign in to manage your members,
              memberships and gym operations.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
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
                  autoComplete="email"
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
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <span>Don't have a gym account?</span>

            <Link to="/register">
              Create your gym
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