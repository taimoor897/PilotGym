import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Users,
  UserRound,
  Phone,
  Mail,
  CalendarDays,
  WalletCards,
  MessageCircle,
  BriefcaseBusiness,
  ShieldCheck,
} from "lucide-react";
import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { apiRequest } from "../../services/api";

const today = new Date().toISOString().split("T")[0];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  specialization: "",
  gender: "Male",
  dateOfBirth: "",
  address: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",
  salary: "",
  employmentType: "Monthly",
  joinDate: today,
  status: "Active",
  notes: "",
};

const formatDate = (date) => {
  if (!date) return "--";

  return new Date(date).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatSalary = (salary) => {
  return `PKR ${Number(salary || 0).toLocaleString()}`;
};

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadTrainers = async () => {
    try {
      setLoading(true);

      const data = await apiRequest(
        "/trainers?limit=1000"
      );

      setTrainers(data.trainers || []);
    } catch (error) {
      console.error(
        "Load trainers error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to load trainers",
        text:
          error.message ||
          "Something went wrong while loading trainers.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  const filteredTrainers = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return trainers.filter((trainer) => {
      const matchesSearch =
        !searchValue ||
        trainer.name
          ?.toLowerCase()
          .includes(searchValue) ||
        trainer.email
          ?.toLowerCase()
          .includes(searchValue) ||
        trainer.phone
          ?.toLowerCase()
          .includes(searchValue) ||
        trainer.trainerId
          ?.toLowerCase()
          .includes(searchValue) ||
        trainer.specialization
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        trainer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [trainers, search, statusFilter]);

  const stats = useMemo(() => {
    const active = trainers.filter(
      (trainer) =>
        trainer.status === "Active"
    ).length;

    const onLeave = trainers.filter(
      (trainer) =>
        trainer.status === "On Leave"
    ).length;

    const inactive = trainers.filter(
      (trainer) =>
        trainer.status === "Inactive"
    ).length;

    const monthlyPayroll =
      trainers
        .filter(
          (trainer) =>
            trainer.status !== "Inactive" &&
            trainer.employmentType === "Monthly"
        )
        .reduce(
          (total, trainer) =>
            total +
            Number(trainer.salary || 0),
          0
        );

    return {
      total: trainers.length,
      active,
      onLeave,
      inactive,
      monthlyPayroll,
    };
  }, [trainers]);

  const openAddModal = () => {
    setEditingTrainer(null);
    setForm({
      ...emptyForm,
      joinDate: today,
    });
    setShowModal(true);
  };

  const openEditModal = (trainer) => {
    setEditingTrainer(trainer);

    setForm({
      name: trainer.name || "",
      email: trainer.email || "",
      phone: trainer.phone || "",
      specialization:
        trainer.specialization || "",
      gender: trainer.gender || "Male",
      dateOfBirth: trainer.dateOfBirth
        ? new Date(
            trainer.dateOfBirth
          )
            .toISOString()
            .split("T")[0]
        : "",
      address: trainer.address || "",
      emergencyName:
        trainer.emergencyContact?.name ||
        "",
      emergencyPhone:
        trainer.emergencyContact?.phone ||
        "",
      emergencyRelationship:
        trainer.emergencyContact
          ?.relationship || "",
      salary:
        trainer.salary !== undefined &&
        trainer.salary !== null
          ? trainer.salary
          : "",
      employmentType:
        trainer.employmentType ||
        "Monthly",
      joinDate: trainer.joinDate
        ? new Date(trainer.joinDate)
            .toISOString()
            .split("T")[0]
        : today,
      status:
        trainer.status || "Active",
      notes: trainer.notes || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingTrainer(null);
    setForm({
      ...emptyForm,
      joinDate: today,
    });
  };

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Trainer name required",
        text: "Please enter the trainer's name.",
        background: "#111827",
        color: "#fff",
      });

      return;
    }

    if (!form.phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Phone number required",
        text: "Please enter the trainer's phone number.",
        background: "#111827",
        color: "#fff",
      });

      return;
    }

    if (
      form.salary !== "" &&
      Number(form.salary) < 0
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid salary",
        text: "Salary cannot be negative.",
        background: "#111827",
        color: "#fff",
      });

      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        specialization:
          form.specialization.trim(),
        gender: form.gender,
        dateOfBirth:
          form.dateOfBirth || null,
        address:
          form.address.trim(),
        emergencyContact: {
          name:
            form.emergencyName.trim(),
          phone:
            form.emergencyPhone.trim(),
          relationship:
            form.emergencyRelationship.trim(),
        },
        salary:
          form.salary === ""
            ? 0
            : Number(form.salary),
        employmentType:
          form.employmentType,
        joinDate:
          form.joinDate || today,
        status: form.status,
        notes:
          form.notes.trim(),
      };

      if (editingTrainer) {
        await apiRequest(
          `/trainers/${editingTrainer._id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        await Swal.fire({
          icon: "success",
          title: "Trainer updated",
          text:
            "Trainer information updated successfully.",
          timer: 1400,
          showConfirmButton: false,
          background: "#111827",
          color: "#fff",
        });
      } else {
        await apiRequest(
          "/trainers",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

        await Swal.fire({
          icon: "success",
          title: "Trainer added",
          text:
            "New trainer added successfully.",
          timer: 1400,
          showConfirmButton: false,
          background: "#111827",
          color: "#fff",
        });
      }

      closeModal();
      await loadTrainers();
    } catch (error) {
      console.error(
        "Save trainer error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to save trainer",
        text:
          error.message ||
          "Something went wrong while saving the trainer.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (trainer) => {
    const result =
      await Swal.fire({
        icon: "warning",
        title: "Delete trainer?",
        text: `"${trainer.name}" will be permanently deleted.`,
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
        background: "#111827",
        color: "#fff",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#374151",
      });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await apiRequest(
        `/trainers/${trainer._id}`,
        {
          method: "DELETE",
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Trainer deleted",
        text:
          "Trainer deleted successfully.",
        timer: 1400,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });

      await loadTrainers();
    } catch (error) {
      console.error(
        "Delete trainer error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to delete",
        text:
          error.message ||
          "Something went wrong while deleting the trainer.",
        background: "#111827",
        color: "#fff",
      });
    }
  };

  const openWhatsApp = (phone) => {
    if (!phone) {
      Swal.fire({
        icon: "warning",
        title: "Phone number missing",
        text:
          "This trainer does not have a phone number.",
        background: "#111827",
        color: "#fff",
      });

      return;
    }

    const cleanedPhone =
      phone.replace(/\D/g, "");

    window.open(
      `https://wa.me/${cleanedPhone}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <DashboardLayout
      title="Trainers"
      subtitle="Manage your gym's trainers, staff details and employment information."
    >
      <div className="trainers-page">

        <div className="page-toolbar trainers-toolbar">
          <div>
            <span className="welcome-label">
              TEAM MANAGEMENT
            </span>

            <h2 className="page-title">
              Trainers
            </h2>

            <p className="page-description">
              Manage trainers and keep their
              employment information organized.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Trainer
          </button>
        </div>


        <div className="trainer-stats">

          <div className="trainer-stat-card">
            <div className="trainer-stat-icon">
              <Users size={19} />
            </div>

            <div>
              <span>TOTAL TRAINERS</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="trainer-stat-card">
            <div className="trainer-stat-icon active">
              <ShieldCheck size={19} />
            </div>

            <div>
              <span>ACTIVE</span>
              <strong>{stats.active}</strong>
            </div>
          </div>

          <div className="trainer-stat-card">
            <div className="trainer-stat-icon">
              <CalendarDays size={19} />
            </div>

            <div>
              <span>ON LEAVE</span>
              <strong>{stats.onLeave}</strong>
            </div>
          </div>

          <div className="trainer-stat-card">
            <div className="trainer-stat-icon">
              <WalletCards size={19} />
            </div>

            <div>
              <span>MONTHLY PAYROLL</span>
              <strong>
                {formatSalary(
                  stats.monthlyPayroll
                )}
              </strong>
            </div>
          </div>

        </div>


        <div className="trainers-filter-bar">

          <div className="trainers-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by name, ID, phone or specialization..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                onClick={() =>
                  setSearch("")
                }
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="trainer-status-filters">

            {[
              "All",
              "Active",
              "On Leave",
              "Inactive",
            ].map((status) => (
              <button
                key={status}
                className={
                  statusFilter === status
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setStatusFilter(status)
                }
              >
                {status}
              </button>
            ))}

          </div>

        </div>


        {loading ? (
          <div className="trainers-loading">
            <div className="loading-spinner" />
            <p>
              Loading trainers...
            </p>
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="trainers-empty">

            <div className="trainer-empty-icon">
              <UserRound size={29} />
            </div>

            <h3>
              {trainers.length === 0
                ? "No trainers yet"
                : "No trainers found"}
            </h3>

            <p>
              {trainers.length === 0
                ? "Add your first trainer to start managing your gym team."
                : "Try changing your search or status filter."}
            </p>

            {trainers.length === 0 && (
              <button
                className="primary-button"
                onClick={openAddModal}
              >
                <Plus size={18} />
                Add First Trainer
              </button>
            )}

          </div>
        ) : (
          <div className="trainers-grid">

            {filteredTrainers.map(
              (trainer) => (
                <div
                  className={`trainer-card ${
                    trainer.status ===
                    "Inactive"
                      ? "inactive"
                      : ""
                  }`}
                  key={trainer._id}
                >

                  <div className="trainer-card-header">

                    <div className="trainer-avatar">
                      {trainer.name
                        ?.charAt(0)
                        .toUpperCase() ||
                        "T"}
                    </div>

                    <div className="trainer-card-identity">

                      <div className="trainer-card-name-row">
                        <h3>
                          {trainer.name}
                        </h3>

                        <span
                          className={`trainer-status ${
                            trainer.status
                              .toLowerCase()
                              .replace(
                                " ",
                                "-"
                              )
                          }`}
                        >
                          <span />
                          {trainer.status}
                        </span>
                      </div>

                      <span className="trainer-id">
                        {trainer.trainerId}
                      </span>

                    </div>

                  </div>


                  <div className="trainer-specialization">

                    <BriefcaseBusiness
                      size={15}
                    />

                    <span>
                      {trainer.specialization ||
                        "General Trainer"}
                    </span>

                  </div>


                  <div className="trainer-contact-list">

                    <div>
                      <Phone size={14} />
                      <span>
                        {trainer.phone ||
                          "No phone"}
                      </span>
                    </div>

                    <div>
                      <Mail size={14} />
                      <span>
                        {trainer.email ||
                          "No email"}
                      </span>
                    </div>

                    <div>
                      <CalendarDays
                        size={14}
                      />
                      <span>
                        Joined{" "}
                        {formatDate(
                          trainer.joinDate
                        )}
                      </span>
                    </div>

                  </div>


                  <div className="trainer-card-details">

                    <div>
                      <span>
                        SALARY
                      </span>

                      <strong>
                        {formatSalary(
                          trainer.salary
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        EMPLOYMENT
                      </span>

                      <strong>
                        {trainer.employmentType ||
                          "Monthly"}
                      </strong>
                    </div>

                  </div>


                  <div className="trainer-card-footer">

                    <button
                      className="trainer-whatsapp"
                      onClick={() =>
                        openWhatsApp(
                          trainer.phone
                        )
                      }
                    >
                      <MessageCircle
                        size={15}
                      />
                      WhatsApp
                    </button>

                    <button
                      className="trainer-edit"
                      onClick={() =>
                        openEditModal(
                          trainer
                        )
                      }
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      className="trainer-delete"
                      onClick={() =>
                        handleDelete(
                          trainer
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>


      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="modal-card trainer-modal">

            <div className="modal-header">

              <div>
                <span className="modal-eyebrow">
                  {editingTrainer
                    ? "UPDATE TRAINER"
                    : "NEW TRAINER"}
                </span>

                <h2>
                  {editingTrainer
                    ? "Edit Trainer"
                    : "Add Trainer"}
                </h2>

                <p>
                  Add the trainer's professional
                  and employment information.
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
                  Personal Information
                </div>

                <div className="form-grid">

                  <div className="form-field">
                    <label>
                      Full Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Ahmed Khan"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Phone *
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="0300 1234567"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="trainer@example.com"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Gender
                    </label>

                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                    >
                      <option value="Male">
                        Male
                      </option>
                      <option value="Female">
                        Female
                      </option>
                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>
                      Date of Birth
                    </label>

                    <input
                      type="date"
                      name="dateOfBirth"
                      value={
                        form.dateOfBirth
                      }
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Specialization
                    </label>

                    <input
                      type="text"
                      name="specialization"
                      value={
                        form.specialization
                      }
                      onChange={handleChange}
                      placeholder="e.g. Strength Training"
                    />
                  </div>

                  <div className="form-field full">
                    <label>
                      Address
                    </label>

                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Trainer's address"
                    />
                  </div>

                </div>
              </div>


              <div className="form-section">

                <div className="form-section-title">
                  Employment Information
                </div>

                <div className="form-grid">

                  <div className="form-field">
                    <label>
                      Salary
                    </label>

                    <div className="input-with-prefix">
                      <span>PKR</span>

                      <input
                        type="number"
                        name="salary"
                        value={form.salary}
                        onChange={handleChange}
                        placeholder="50000"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>
                      Employment Type
                    </label>

                    <select
                      name="employmentType"
                      value={
                        form.employmentType
                      }
                      onChange={handleChange}
                    >
                      <option value="Monthly">
                        Monthly
                      </option>

                      <option value="Weekly">
                        Weekly
                      </option>

                      <option value="Daily">
                        Daily
                      </option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>
                      Join Date
                    </label>

                    <input
                      type="date"
                      name="joinDate"
                      value={form.joinDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
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

                      <option value="On Leave">
                        On Leave
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>
                  </div>

                </div>
              </div>


              <div className="form-section">

                <div className="form-section-title">
                  Emergency Contact
                </div>

                <div className="form-grid">

                  <div className="form-field">
                    <label>
                      Contact Name
                    </label>

                    <input
                      type="text"
                      name="emergencyName"
                      value={
                        form.emergencyName
                      }
                      onChange={handleChange}
                      placeholder="Emergency contact"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Contact Phone
                    </label>

                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={
                        form.emergencyPhone
                      }
                      onChange={handleChange}
                      placeholder="0300 1234567"
                    />
                  </div>

                  <div className="form-field full">
                    <label>
                      Relationship
                    </label>

                    <input
                      type="text"
                      name="emergencyRelationship"
                      value={
                        form.emergencyRelationship
                      }
                      onChange={handleChange}
                      placeholder="e.g. Brother, Father, Spouse"
                    />
                  </div>

                </div>
              </div>


              <div className="form-section">

                <div className="form-section-title">
                  Notes
                </div>

                <div className="form-grid">

                  <div className="form-field full">

                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="Additional information about this trainer..."
                      rows="3"
                    />

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
                    : editingTrainer
                    ? "Update Trainer"
                    : "Add Trainer"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </DashboardLayout>
  );
}