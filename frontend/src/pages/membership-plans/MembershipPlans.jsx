import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  CalendarDays,
  CreditCard,
  Sparkles,
} from "lucide-react";
import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { apiRequest } from "../../services/api";

const emptyForm = {
  name: "",
  duration: "",
  price: "",
  description: "",
  status: "Active",
};

export default function MembershipPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadPlans = async () => {
    try {
      setLoading(true);

      const data = await apiRequest("/membership-plans");

      setPlans(data.plans || []);
    } catch (error) {
      console.error("Load plans error:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to load plans",
        text:
          error.message ||
          "Something went wrong while loading membership plans.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openAddModal = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);

    setForm({
      name: plan.name || "",
      duration: plan.duration || "",
      price: plan.price || "",
      description: plan.description || "",
      status: plan.status || "Active",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingPlan(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Plan name required",
        text: "Please enter a membership plan name.",
        background: "#111827",
        color: "#fff",
      });

      return;
    }

    if (!form.duration || Number(form.duration) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid duration",
        text: "Please enter a valid duration in days.",
        background: "#111827",
        color: "#fff",
      });

      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid price",
        text: "Please enter a valid membership price.",
        background: "#111827",
        color: "#fff",
      });

      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        duration: Number(form.duration),
        price: Number(form.price),
        description: form.description.trim(),
        status: form.status,
      };

      if (editingPlan) {
        await apiRequest(
          `/membership-plans/${editingPlan._id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        await Swal.fire({
          icon: "success",
          title: "Plan updated",
          text: "Membership plan updated successfully.",
          timer: 1400,
          showConfirmButton: false,
          background: "#111827",
          color: "#fff",
        });
      } else {
        await apiRequest("/membership-plans", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        await Swal.fire({
          icon: "success",
          title: "Plan created",
          text: "Membership plan created successfully.",
          timer: 1400,
          showConfirmButton: false,
          background: "#111827",
          color: "#fff",
        });
      }

      closeModal();
      await loadPlans();
    } catch (error) {
      console.error("Save plan error:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to save plan",
        text:
          error.message ||
          "Something went wrong while saving the membership plan.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete membership plan?",
      text: `"${plan.name}" will be permanently deleted.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      background: "#111827",
      color: "#fff",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#374151",
    });

    if (!result.isConfirmed) return;

    try {
      await apiRequest(
        `/membership-plans/${plan._id}`,
        {
          method: "DELETE",
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Membership plan deleted successfully.",
        timer: 1400,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });

      await loadPlans();
    } catch (error) {
      console.error("Delete plan error:", error);

      Swal.fire({
        icon: "error",
        title: "Unable to delete",
        text:
          error.message ||
          "Something went wrong while deleting the plan.",
        background: "#111827",
        color: "#fff",
      });
    }
  };

  const formatPrice = (price) => {
    return `PKR ${Number(price || 0).toLocaleString()}`;
  };

  const formatDuration = (days) => {
    if (days === 365) return "1 Year";
    if (days === 180) return "6 Months";
    if (days === 90) return "3 Months";
    if (days === 30) return "1 Month";

    if (days >= 30) {
      const months = Math.round(days / 30);
      return `${months} Month${months !== 1 ? "s" : ""}`;
    }

    return `${days} Day${days !== 1 ? "s" : ""}`;
  };

  return (
    <DashboardLayout
      title="Membership Plans"
      subtitle="Create and manage the membership plans offered by your gym."
    >
      <div className="plans-page">

        {/* HEADER */}
        <div className="page-toolbar">
          <div>
            <span className="welcome-label">
              MEMBERSHIPS
            </span>

            <h2 className="page-title">
              Membership Plans
            </h2>

            <p className="page-description">
              Set your pricing and membership durations.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Plan
          </button>
        </div>

        {/* STATS */}
        <div className="plan-stats">
          <div className="plan-stat-card">
            <div className="plan-stat-icon">
              <Sparkles size={19} />
            </div>

            <div>
              <span>ACTIVE PLANS</span>
              <strong>
                {
                  plans.filter(
                    (plan) => plan.status === "Active"
                  ).length
                }
              </strong>
            </div>
          </div>

          <div className="plan-stat-card">
            <div className="plan-stat-icon">
              <CalendarDays size={19} />
            </div>

            <div>
              <span>TOTAL PLANS</span>
              <strong>{plans.length}</strong>
            </div>
          </div>

          <div className="plan-stat-card">
            <div className="plan-stat-icon">
              <CreditCard size={19} />
            </div>

            <div>
              <span>AVERAGE PRICE</span>

              <strong>
                PKR{" "}
                {plans.length
                  ? Math.round(
                      plans.reduce(
                        (total, plan) =>
                          total + Number(plan.price || 0),
                        0
                      ) / plans.length
                    ).toLocaleString()
                  : "0"}
              </strong>
            </div>
          </div>
        </div>

        {/* PLANS */}
        {loading ? (
          <div className="plans-loading">
            <div className="loading-spinner" />
            <p>Loading membership plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="plans-empty">
            <div className="empty-plan-icon">
              <CreditCard size={28} />
            </div>

            <h3>No membership plans yet</h3>

            <p>
              Create your first membership plan to start
              assigning memberships to your members.
            </p>

            <button
              className="primary-button"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Create First Plan
            </button>
          </div>
        ) : (
          <div className="plans-grid">
            {plans.map((plan) => (
              <div
                className={`plan-card ${
                  plan.status === "Inactive"
                    ? "inactive"
                    : ""
                }`}
                key={plan._id}
              >
                <div className="plan-card-top">
                  <div>
                    <span className="plan-label">
                      MEMBERSHIP
                    </span>

                    <h3>{plan.name}</h3>
                  </div>

                  <span
                    className={`plan-status ${
                      plan.status === "Active"
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {plan.status === "Active" ? (
                      <Check size={13} />
                    ) : (
                      <X size={13} />
                    )}

                    {plan.status}
                  </span>
                </div>

                <div className="plan-price">
                  <strong>
                    {formatPrice(plan.price)}
                  </strong>

                  <span>
                    / {formatDuration(plan.duration)}
                  </span>
                </div>

                <div className="plan-duration">
                  <CalendarDays size={16} />

                  <span>
                    {plan.duration} days membership
                  </span>
                </div>

                {plan.description && (
                  <p className="plan-description">
                    {plan.description}
                  </p>
                )}

                <div className="plan-card-footer">
                  <button
                    className="plan-edit-button"
                    onClick={() =>
                      openEditModal(plan)
                    }
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    className="plan-delete-button"
                    onClick={() =>
                      handleDelete(plan)
                    }
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="modal-card plan-modal">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  {editingPlan
                    ? "UPDATE PLAN"
                    : "NEW MEMBERSHIP"}
                </span>

                <h2>
                  {editingPlan
                    ? "Edit Membership Plan"
                    : "Create Membership Plan"}
                </h2>

                <p>
                  Configure the price and duration for
                  this membership.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="member-form"
              onSubmit={handleSubmit}
            >
              <div className="form-section">
                <div className="form-section-title">
                  Plan Details
                </div>

                <div className="form-grid">
                  <div className="form-field full">
                    <label>
                      Plan Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Monthly"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Duration *
                    </label>

                    <div className="input-with-suffix">
                      <input
                        type="number"
                        name="duration"
                        value={form.duration}
                        onChange={handleChange}
                        placeholder="30"
                        min="1"
                        required
                      />

                      <span>days</span>
                    </div>
                  </div>

                  <div className="form-field">
                    <label>
                      Price *
                    </label>

                    <div className="input-with-prefix">
                      <span>PKR</span>

                      <input
                        type="number"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="3000"
                        min="0"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field full">
                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="What's included in this membership?"
                      rows="3"
                    />
                  </div>

                  <div className="form-field full">
                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingPlan
                    ? "Update Plan"
                    : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}