import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Dumbbell,
  Flame,
  Timer,
  Target,
  Play,
  RotateCcw,
  Layers3,
  CircleGauge,
  Activity,
} from "lucide-react";
import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { apiRequest } from "../../services/api";

const emptyForm = {
  name: "",
  category: "Strength",
  muscleGroup: "",
  difficulty: "Beginner",
  equipment: "",
  description: "",
  instructions: "",
  imageUrl: "",
  videoUrl: "",
  sets: "",
  reps: "",
  duration: "",
  restTime: "",
  status: "Active",
  notes: "",
};

const categories = [
  "All",
  "Strength",
  "Cardio",
  "HIIT",
  "Flexibility",
  "Functional",
  "Core",
  "Weight Loss",
  "General",
];

const difficulties = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
];

const formatDuration = (minutes) => {
  const value = Number(minutes || 0);

  if (!value) {
    return "--";
  }

  if (value < 60) {
    return `${value} min`;
  }

  const hours = Math.floor(value / 60);
  const remaining = value % 60;

  return remaining
    ? `${hours}h ${remaining}m`
    : `${hours}h`;
};

export default function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("All");
  const [difficultyFilter, setDifficultyFilter] =
    useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingWorkout, setEditingWorkout] =
    useState(null);

  const [selectedWorkout, setSelectedWorkout] =
    useState(null);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadWorkouts = async () => {
    try {
      setLoading(true);

      const data = await apiRequest(
        "/workouts?limit=1000"
      );

      setWorkouts(data.workouts || []);
    } catch (error) {
      console.error(
        "Load workouts error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to load workouts",
        text:
          error.message ||
          "Something went wrong while loading workouts.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const filteredWorkouts = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return workouts.filter((workout) => {
      const matchesSearch =
        !searchValue ||
        workout.name
          ?.toLowerCase()
          .includes(searchValue) ||
        workout.workoutId
          ?.toLowerCase()
          .includes(searchValue) ||
        workout.muscleGroup
          ?.toLowerCase()
          .includes(searchValue) ||
        workout.equipment
          ?.toLowerCase()
          .includes(searchValue) ||
        workout.description
          ?.toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        categoryFilter === "All" ||
        workout.category === categoryFilter;

      const matchesDifficulty =
        difficultyFilter === "All" ||
        workout.difficulty ===
          difficultyFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty
      );
    });
  }, [
    workouts,
    search,
    categoryFilter,
    difficultyFilter,
  ]);

  const stats = useMemo(() => {
    const active = workouts.filter(
      (workout) =>
        workout.status === "Active"
    ).length;

    const strength = workouts.filter(
      (workout) =>
        workout.category === "Strength"
    ).length;

    const cardio = workouts.filter(
      (workout) =>
        workout.category === "Cardio"
    ).length;

    const hiit = workouts.filter(
      (workout) =>
        workout.category === "HIIT"
    ).length;

    return {
      total: workouts.length,
      active,
      strength,
      cardio,
      hiit,
    };
  }, [workouts]);

  const openAddModal = () => {
    setEditingWorkout(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (workout) => {
    setEditingWorkout(workout);

    setForm({
      name: workout.name || "",
      category:
        workout.category || "Strength",
      muscleGroup:
        workout.muscleGroup || "",
      difficulty:
        workout.difficulty || "Beginner",
      equipment:
        workout.equipment || "",
      description:
        workout.description || "",
      instructions:
        workout.instructions || "",
      imageUrl:
        workout.imageUrl || "",
      videoUrl:
        workout.videoUrl || "",
      sets:
        workout.sets !== undefined &&
        workout.sets !== null
          ? workout.sets
          : "",
      reps:
        workout.reps !== undefined &&
        workout.reps !== null
          ? workout.reps
          : "",
      duration:
        workout.duration !== undefined &&
        workout.duration !== null
          ? workout.duration
          : "",
      restTime:
        workout.restTime !== undefined &&
        workout.restTime !== null
          ? workout.restTime
          : "",
      status:
        workout.status || "Active",
      notes:
        workout.notes || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingWorkout(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

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
        title: "Workout name required",
        text:
          "Please enter the workout name.",
        background: "#111827",
        color: "#fff",
      });

      return;
    }

    const numericFields = [
      {
        name: "Sets",
        value: form.sets,
      },
      {
        name: "Reps",
        value: form.reps,
      },
      {
        name: "Duration",
        value: form.duration,
      },
      {
        name: "Rest time",
        value: form.restTime,
      },
    ];

    const invalidNumericField =
      numericFields.find(
        (field) =>
          field.value !== "" &&
          Number(field.value) < 0
      );

    if (invalidNumericField) {
      Swal.fire({
        icon: "warning",
        title: "Invalid value",
        text:
          `${invalidNumericField.name} cannot be negative.`,
        background: "#111827",
        color: "#fff",
      });

      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        category: form.category,
        muscleGroup:
          form.muscleGroup.trim(),
        difficulty: form.difficulty,
        equipment:
          form.equipment.trim(),
        description:
          form.description.trim(),
        instructions:
          form.instructions.trim(),
        imageUrl:
          form.imageUrl.trim(),
        videoUrl:
          form.videoUrl.trim(),
        sets:
          form.sets === ""
            ? 0
            : Number(form.sets),
        reps:
          form.reps === ""
            ? 0
            : Number(form.reps),
        duration:
          form.duration === ""
            ? 0
            : Number(form.duration),
        restTime:
          form.restTime === ""
            ? 0
            : Number(form.restTime),
        status: form.status,
        notes:
          form.notes.trim(),
      };

      if (editingWorkout) {
        await apiRequest(
          `/workouts/${editingWorkout._id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        await Swal.fire({
          icon: "success",
          title: "Workout updated",
          text:
            "Workout information updated successfully.",
          timer: 1400,
          showConfirmButton: false,
          background: "#111827",
          color: "#fff",
        });
      } else {
        await apiRequest("/workouts", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        await Swal.fire({
          icon: "success",
          title: "Workout added",
          text:
            "New workout added successfully.",
          timer: 1400,
          showConfirmButton: false,
          background: "#111827",
          color: "#fff",
        });
      }

      closeModal();
      await loadWorkouts();
    } catch (error) {
      console.error(
        "Save workout error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to save workout",
        text:
          error.message ||
          "Something went wrong while saving the workout.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (workout) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete workout?",
      text:
        `"${workout.name}" will be permanently deleted.`,
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
        `/workouts/${workout._id}`,
        {
          method: "DELETE",
        }
      );

      if (
        selectedWorkout?._id ===
        workout._id
      ) {
        setSelectedWorkout(null);
      }

      await Swal.fire({
        icon: "success",
        title: "Workout deleted",
        text:
          "Workout deleted successfully.",
        timer: 1400,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });

      await loadWorkouts();
    } catch (error) {
      console.error(
        "Delete workout error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to delete",
        text:
          error.message ||
          "Something went wrong while deleting the workout.",
        background: "#111827",
        color: "#fff",
      });
    }
  };

  return (
    <DashboardLayout
      title="Workouts"
      subtitle="Build and manage your gym's exercise library."
    >
      <div className="workouts-page">
        <div className="page-toolbar workouts-toolbar">
          <div>
            <span className="welcome-label">
              WORKOUT LIBRARY
            </span>

            <h2 className="page-title">
              Workouts
            </h2>

            <p className="page-description">
              Create a structured library of exercises
              for your gym's training programs.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Workout
          </button>
        </div>

        <div className="workout-stats">
          <div className="workout-stat-card">
            <div className="workout-stat-icon">
              <Dumbbell size={19} />
            </div>

            <div>
              <span>TOTAL WORKOUTS</span>
              <strong>{stats.total}</strong>
            </div>
          </div>

          <div className="workout-stat-card">
            <div className="workout-stat-icon active">
              <Activity size={19} />
            </div>

            <div>
              <span>ACTIVE</span>
              <strong>{stats.active}</strong>
            </div>
          </div>

          <div className="workout-stat-card">
            <div className="workout-stat-icon">
              <Target size={19} />
            </div>

            <div>
              <span>STRENGTH</span>
              <strong>{stats.strength}</strong>
            </div>
          </div>

          <div className="workout-stat-card">
            <div className="workout-stat-icon">
              <Flame size={19} />
            </div>

            <div>
              <span>CARDIO / HIIT</span>
              <strong>
                {stats.cardio + stats.hiit}
              </strong>
            </div>
          </div>
        </div>

        <div className="workouts-filter-bar">
          <div className="workouts-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search workouts, muscle groups, equipment..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="workout-filter-group">
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category === "All"
                    ? "All Categories"
                    : category}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(event) =>
                setDifficultyFilter(
                  event.target.value
                )
              }
            >
              {difficulties.map(
                (difficulty) => (
                  <option
                    key={difficulty}
                    value={difficulty}
                  >
                    {difficulty === "All"
                      ? "All Levels"
                      : difficulty}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="workouts-loading">
            <div className="loading-spinner" />
            <p>Loading workouts...</p>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="workouts-empty">
            <div className="workout-empty-icon">
              <Dumbbell size={29} />
            </div>

            <h3>
              {workouts.length === 0
                ? "No workouts yet"
                : "No workouts found"}
            </h3>

            <p>
              {workouts.length === 0
                ? "Build your exercise library by adding your first workout."
                : "Try changing your search or filters."}
            </p>

            {workouts.length === 0 && (
              <button
                className="primary-button"
                onClick={openAddModal}
              >
                <Plus size={18} />
                Add First Workout
              </button>
            )}
          </div>
        ) : (
          <div className="workouts-grid">
            {filteredWorkouts.map(
              (workout) => (
                <div
                  className={`workout-card ${
                    workout.status ===
                    "Inactive"
                      ? "inactive"
                      : ""
                  }`}
                  key={workout._id}
                >
                  <div className="workout-card-visual">
                    {workout.imageUrl ? (
                      <img
                        src={workout.imageUrl}
                        alt={workout.name}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                          event.currentTarget.nextSibling.style.display =
                            "flex";
                        }}
                      />
                    ) : null}

                    <div
                      className="workout-visual-placeholder"
                      style={{
                        display:
                          workout.imageUrl
                            ? "none"
                            : "flex",
                      }}
                    >
                      <Dumbbell
                        size={35}
                      />
                    </div>

                    <span className="workout-category-badge">
                      {workout.category}
                    </span>

                    <span
                      className={`workout-difficulty-badge ${workout.difficulty
                        ?.toLowerCase()
                        .replace(
                          " ",
                          "-"
                        )}`}
                    >
                      {workout.difficulty}
                    </span>
                  </div>

                  <div className="workout-card-body">
                    <div className="workout-card-heading">
                      <div>
                        <span className="workout-id">
                          {workout.workoutId}
                        </span>

                        <h3>
                          {workout.name}
                        </h3>
                      </div>

                      <span
                        className={`workout-status ${
                          workout.status ===
                          "Active"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        <span />
                        {workout.status}
                      </span>
                    </div>

                    <p className="workout-description">
                      {workout.description ||
                        "No workout description added yet."}
                    </p>

                    <div className="workout-meta">
                      <div>
                        <Target
                          size={14}
                        />
                        <span>
                          {workout.muscleGroup ||
                            "Full Body"}
                        </span>
                      </div>

                      <div>
                        <Layers3
                          size={14}
                        />
                        <span>
                          {workout.equipment ||
                            "No equipment"}
                        </span>
                      </div>
                    </div>

                    <div className="workout-prescription">
                      <div>
                        <span>SETS</span>
                        <strong>
                          {workout.sets ||
                            "--"}
                        </strong>
                      </div>

                      <div>
                        <span>REPS</span>
                        <strong>
                          {workout.reps ||
                            "--"}
                        </strong>
                      </div>

                      <div>
                        <span>DURATION</span>
                        <strong>
                          {formatDuration(
                            workout.duration
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>REST</span>
                        <strong>
                          {workout.restTime
                            ? `${workout.restTime}s`
                            : "--"}
                        </strong>
                      </div>
                    </div>

                    <div className="workout-card-footer">
                      <button
                        className="workout-view-button"
                        onClick={() =>
                          setSelectedWorkout(
                            workout
                          )
                        }
                      >
                        View Details
                      </button>

                      {workout.videoUrl && (
                        <button
                          className="workout-video-button"
                          onClick={() =>
                            window.open(
                              workout.videoUrl,
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                        >
                          <Play
                            size={14}
                          />
                        </button>
                      )}

                      <button
                        className="workout-edit-button"
                        onClick={() =>
                          openEditModal(
                            workout
                          )
                        }
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        className="workout-delete-button"
                        onClick={() =>
                          handleDelete(
                            workout
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
          <div className="modal-card workout-modal">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  {editingWorkout
                    ? "UPDATE WORKOUT"
                    : "NEW WORKOUT"}
                </span>

                <h2>
                  {editingWorkout
                    ? "Edit Workout"
                    : "Add Workout"}
                </h2>

                <p>
                  Create a detailed exercise for
                  your workout library.
                </p>
              </div>

              <button
                className="modal-close"
                type="button"
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
                  Workout Information
                </div>

                <div className="form-grid">
                  <div className="form-field full">
                    <label>
                      Workout Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Barbell Bench Press"
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label>Category</label>

                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                    >
                      {categories
                        .filter(
                          (item) =>
                            item !== "All"
                        )
                        .map(
                          (category) => (
                            <option
                              key={
                                category
                              }
                              value={
                                category
                              }
                            >
                              {category}
                            </option>
                          )
                        )}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>
                      Difficulty
                    </label>

                    <select
                      name="difficulty"
                      value={
                        form.difficulty
                      }
                      onChange={
                        handleChange
                      }
                    >
                      {difficulties
                        .filter(
                          (item) =>
                            item !== "All"
                        )
                        .map(
                          (difficulty) => (
                            <option
                              key={
                                difficulty
                              }
                              value={
                                difficulty
                              }
                            >
                              {difficulty}
                            </option>
                          )
                        )}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>
                      Muscle Group
                    </label>

                    <input
                      type="text"
                      name="muscleGroup"
                      value={
                        form.muscleGroup
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Chest"
                    />
                  </div>

                  <div className="form-field">
                    <label>Equipment</label>

                    <input
                      type="text"
                      name="equipment"
                      value={
                        form.equipment
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Barbell, Bench"
                    />
                  </div>

                  <div className="form-field full">
                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Briefly describe the exercise..."
                      rows="3"
                    />
                  </div>

                  <div className="form-field full">
                    <label>
                      Instructions
                    </label>

                    <textarea
                      name="instructions"
                      value={
                        form.instructions
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Explain how the exercise should be performed..."
                      rows="4"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  Training Prescription
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label>Sets</label>

                    <input
                      type="number"
                      name="sets"
                      value={form.sets}
                      onChange={
                        handleChange
                      }
                      placeholder="4"
                      min="0"
                    />
                  </div>

                  <div className="form-field">
                    <label>Reps</label>

                    <input
                      type="number"
                      name="reps"
                      value={form.reps}
                      onChange={
                        handleChange
                      }
                      placeholder="12"
                      min="0"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Duration (minutes)
                    </label>

                    <input
                      type="number"
                      name="duration"
                      value={
                        form.duration
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="20"
                      min="0"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Rest Time (seconds)
                    </label>

                    <input
                      type="number"
                      name="restTime"
                      value={
                        form.restTime
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="60"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  Media
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label>
                      Image URL
                    </label>

                    <input
                      type="url"
                      name="imageUrl"
                      value={
                        form.imageUrl
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Video URL
                    </label>

                    <input
                      type="url"
                      name="videoUrl"
                      value={
                        form.videoUrl
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">
                  Status & Notes
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label>Status</label>

                    <select
                      name="status"
                      value={form.status}
                      onChange={
                        handleChange
                      }
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>
                  </div>

                  <div className="form-field full">
                    <label>Notes</label>

                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={
                        handleChange
                      }
                      placeholder="Additional notes about this exercise..."
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
                    : editingWorkout
                    ? "Update Workout"
                    : "Add Workout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedWorkout && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedWorkout(null);
            }
          }}
        >
          <div className="modal-card workout-details-modal">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  {selectedWorkout.workoutId}
                </span>

                <h2>
                  {selectedWorkout.name}
                </h2>

                <p>
                  {selectedWorkout.category} ·{" "}
                  {selectedWorkout.difficulty}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedWorkout(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            {selectedWorkout.imageUrl && (
              <div className="workout-details-image">
                <img
                  src={
                    selectedWorkout.imageUrl
                  }
                  alt={
                    selectedWorkout.name
                  }
                />
              </div>
            )}

            <div className="workout-detail-stats">
              <div>
                <CircleGauge size={18} />
                <span>Sets</span>
                <strong>
                  {selectedWorkout.sets ||
                    "--"}
                </strong>
              </div>

              <div>
                <RotateCcw size={18} />
                <span>Reps</span>
                <strong>
                  {selectedWorkout.reps ||
                    "--"}
                </strong>
              </div>

              <div>
                <Timer size={18} />
                <span>Duration</span>
                <strong>
                  {formatDuration(
                    selectedWorkout.duration
                  )}
                </strong>
              </div>

              <div>
                <Timer size={18} />
                <span>Rest</span>
                <strong>
                  {selectedWorkout.restTime
                    ? `${selectedWorkout.restTime}s`
                    : "--"}
                </strong>
              </div>
            </div>

            <div className="workout-details-content">
              <div>
                <span>MUSCLE GROUP</span>
                <strong>
                  {selectedWorkout.muscleGroup ||
                    "Full Body"}
                </strong>
              </div>

              <div>
                <span>EQUIPMENT</span>
                <strong>
                  {selectedWorkout.equipment ||
                    "No equipment"}
                </strong>
              </div>

              <div className="full">
                <span>DESCRIPTION</span>
                <p>
                  {selectedWorkout.description ||
                    "No description available."}
                </p>
              </div>

              <div className="full">
                <span>INSTRUCTIONS</span>
                <p>
                  {selectedWorkout.instructions ||
                    "No instructions available."}
                </p>
              </div>

              {selectedWorkout.notes && (
                <div className="full">
                  <span>NOTES</span>
                  <p>
                    {selectedWorkout.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedWorkout.videoUrl && (
                <button
                  className="secondary-button"
                  onClick={() =>
                    window.open(
                      selectedWorkout.videoUrl,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  <Play size={16} />
                  Watch Video
                </button>
              )}

              <button
                className="primary-button"
                onClick={() => {
                  const workout =
                    selectedWorkout;

                  setSelectedWorkout(null);
                  openEditModal(workout);
                }}
              >
                <Pencil size={16} />
                Edit Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}