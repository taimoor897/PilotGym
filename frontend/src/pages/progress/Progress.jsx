
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Camera,
  ChevronDown,
  Dumbbell,
  Edit3,
  Eye,
  Gauge,
  HeartPulse,
  Plus,
  Ruler,
  Search,
  Scale,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  X,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { apiRequest } from "../../services/api";

const EMPTY_FORM = {
  recordDate: new Date().toISOString().split("T")[0],
  weight: "",
  bodyFat: "",
  chest: "",
  waist: "",
  arms: "",
  hips: "",
  thighs: "",
  height: "",
  notes: "",
  progressPhoto: "",
};

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatShortDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatValue = (value, unit = "") => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return `${value}${unit ? ` ${unit}` : ""}`;
};

export default function Progress() {
  const [members, setMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");

  const [records, setRecords] = useState([]);

  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const selectedMember = useMemo(
    () =>
      members.find(
        (member) =>
          String(member._id) === String(selectedMemberId)
      ) || null,
    [members, selectedMemberId]
  );

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();

    if (!query) {
      return members.slice(0, 12);
    }

    return members
      .filter((member) => {
        const name = member.name?.toLowerCase() || "";
        const memberId = member.memberId?.toLowerCase() || "";
        const phone = member.phone?.toLowerCase() || "";
        const email = member.email?.toLowerCase() || "";

        return (
          name.includes(query) ||
          memberId.includes(query) ||
          phone.includes(query) ||
          email.includes(query)
        );
      })
      .slice(0, 12);
  }, [members, memberSearch]);

  const currentRecord = records[0] || null;
  const previousRecord = records[1] || null;

  const weightChange =
    currentRecord?.weight != null &&
    previousRecord?.weight != null
      ? Number(
          (currentRecord.weight - previousRecord.weight).toFixed(1)
        )
      : null;

  const bmi = useMemo(() => {
    const weight = currentRecord?.weight;
    const height =
      currentRecord?.height || selectedMember?.height;

    if (!weight || !height) {
      return null;
    }

    const heightInMeters = Number(height) / 100;

    if (!heightInMeters) {
      return null;
    }

    return Number(
      (Number(weight) / (heightInMeters * heightInMeters)).toFixed(1)
    );
  }, [currentRecord, selectedMember]);

  const bmiLabel = useMemo(() => {
    if (bmi === null) return "No data";

    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Healthy range";
    if (bmi < 30) return "Overweight";

    return "High range";
  }, [bmi]);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);

      const data = await apiRequest("/members?limit=1000");

      const list = Array.isArray(data)
        ? data
        : data.members || data.data || [];

      setMembers(list);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Could not load members",
        text: error.message || "Please try again.",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadProgress = async (memberId) => {
    if (!memberId) {
      setRecords([]);
      return;
    }

    try {
      setLoadingProgress(true);

      const data = await apiRequest(
        `/progress/member/${memberId}`
      );

      const list = Array.isArray(data)
        ? data
        : data.progress || data.records || data.data || [];

      const sorted = [...list].sort(
        (a, b) =>
          new Date(b.recordDate) - new Date(a.recordDate)
      );

      setRecords(sorted);
    } catch (error) {
      console.error(error);

      setRecords([]);

      Swal.fire({
        icon: "error",
        title: "Could not load progress",
        text: error.message || "Please try again.",
      });
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      loadProgress(selectedMemberId);
    }
  }, [selectedMemberId]);

  const selectMember = (member) => {
    setSelectedMemberId(member._id);
    setMemberSearch("");
    setShowMemberDropdown(false);
  };

  const clearSelectedMember = () => {
    setSelectedMemberId("");
    setRecords([]);
    setMemberSearch("");
    setShowMemberDropdown(false);
  };

  const openCreateModal = () => {
    if (!selectedMember) {
      Swal.fire({
        icon: "info",
        title: "Select a member first",
        text: "Choose a member before adding a progress record.",
      });

      return;
    }

    setEditingRecord(null);

    setForm({
      ...EMPTY_FORM,
      height: currentRecord?.height ?? "",
    });

    setShowModal(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);

    setForm({
      recordDate: record.recordDate
        ? new Date(record.recordDate)
            .toISOString()
            .split("T")[0]
        : EMPTY_FORM.recordDate,
      weight: record.weight ?? "",
      bodyFat: record.bodyFat ?? "",
      chest: record.chest ?? "",
      waist: record.waist ?? "",
      arms: record.arms ?? "",
      hips: record.hips ?? "",
      thighs: record.thighs ?? "",
      height: record.height ?? "",
      notes: record.notes || "",
      progressPhoto: record.progressPhoto || "",
    });

    setShowModal(true);
  };

  const openDetails = (record) => {
    setViewingRecord(record);
    setShowDetails(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingRecord(null);
    setForm(EMPTY_FORM);
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedMember) {
      Swal.fire({
        icon: "error",
        title: "Member required",
        text: "Please select a member first.",
      });

      return;
    }

    if (!form.recordDate) {
      Swal.fire({
        icon: "error",
        title: "Date required",
        text: "Please select a record date.",
      });

      return;
    }

    if (
      form.bodyFat !== "" &&
      (Number(form.bodyFat) < 0 ||
        Number(form.bodyFat) > 100)
    ) {
      Swal.fire({
        icon: "error",
        title: "Invalid body fat",
        text: "Body fat must be between 0 and 100.",
      });

      return;
    }

    const payload = {
      member: selectedMember._id,
      recordDate: form.recordDate,
      weight: toNumberOrNull(form.weight),
      bodyFat: toNumberOrNull(form.bodyFat),
      chest: toNumberOrNull(form.chest),
      waist: toNumberOrNull(form.waist),
      arms: toNumberOrNull(form.arms),
      hips: toNumberOrNull(form.hips),
      thighs: toNumberOrNull(form.thighs),
      height: toNumberOrNull(form.height),
      notes: form.notes.trim(),
      progressPhoto: form.progressPhoto.trim(),
    };

    try {
      setSaving(true);

      if (editingRecord) {
        await apiRequest(`/progress/${editingRecord._id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest("/progress", {
          method: "POST",
          body: payload,
        });
      }

      closeModal();

      await loadProgress(selectedMember._id);

      Swal.fire({
        icon: "success",
        title: editingRecord
          ? "Progress updated"
          : "Progress recorded",
        text: editingRecord
          ? "The progress record has been updated successfully."
          : "The new progress record has been saved successfully.",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Could not save progress",
        text: error.message || "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete progress record?",
      text: `The record from ${formatDate(
        record.recordDate
      )} will be permanently removed.`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Keep record",
      confirmButtonColor: "#ef4444",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await apiRequest(`/progress/${record._id}`, {
        method: "DELETE",
      });

      await loadProgress(selectedMemberId);

      Swal.fire({
        icon: "success",
        title: "Record deleted",
        text: "The progress record has been removed.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Could not delete record",
        text: error.message || "Please try again.",
      });
    }
  };

  const weightChart = useMemo(() => {
    if (!records.length) return [];

    return [...records]
      .filter((record) => record.weight != null)
      .sort(
        (a, b) =>
          new Date(a.recordDate) -
          new Date(b.recordDate)
      )
      .slice(-8);
  }, [records]);

  const chartStats = useMemo(() => {
    if (!weightChart.length) {
      return {
        min: 0,
        max: 100,
        range: 100,
      };
    }

    const values = weightChart.map((item) =>
      Number(item.weight)
    );

    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      min,
      max,
      range: Math.max(max - min, 1),
    };
  }, [weightChart]);

  const getChartPosition = (weight) => {
    if (!weight) return 50;

    return (
      92 -
      ((Number(weight) - chartStats.min) /
        chartStats.range) *
        76
    );
  };

  const recentRecords = records.slice(0, 8);

  return (
    <DashboardLayout
      title="Progress"
      subtitle="Track member fitness progress and body measurements."
    >
      <div className="progress-page">
        <div className="progress-header">
          <div>
            <div className="progress-eyebrow">
              <Activity size={15} />
              FITNESS TRACKING
            </div>

            <h2>Member Progress</h2>

            <p>
              Monitor weight, body measurements, body fat and
              fitness changes over time.
            </p>
          </div>

          <button
            className="primary-button progress-add-button"
            onClick={openCreateModal}
            disabled={!selectedMember}
          >
            <Plus size={18} />
            Add Progress
          </button>
        </div>

        <div className="progress-member-selector">
          <div className="progress-member-search">
            <Search size={18} />

            <input
              value={
                selectedMember
                  ? `${selectedMember.name} ${
                      selectedMember.memberId
                        ? `• ${selectedMember.memberId}`
                        : ""
                    }`
                  : memberSearch
              }
              placeholder={
                loadingMembers
                  ? "Loading members..."
                  : "Search and select a member..."
              }
              disabled={loadingMembers}
              onFocus={() => {
                if (!selectedMember) {
                  setShowMemberDropdown(true);
                }
              }}
              onChange={(event) => {
                if (selectedMember) {
                  clearSelectedMember();
                }

                setMemberSearch(event.target.value);
                setShowMemberDropdown(true);
              }}
            />

            {selectedMember ? (
              <button
                className="progress-clear-member"
                onClick={clearSelectedMember}
                type="button"
                aria-label="Clear member"
              >
                <X size={17} />
              </button>
            ) : (
              <ChevronDown size={18} />
            )}

            {showMemberDropdown && !selectedMember && (
              <div className="progress-member-dropdown">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <button
                      type="button"
                      key={member._id}
                      className="progress-member-option"
                      onClick={() => selectMember(member)}
                    >
                      <div className="progress-member-avatar">
                        {member.profilePhoto ? (
                          <img
                            src={member.profilePhoto}
                            alt={member.name}
                          />
                        ) : (
                          member.name
                            ?.charAt(0)
                            .toUpperCase() || "M"
                        )}
                      </div>

                      <div className="progress-member-option-info">
                        <strong>{member.name}</strong>

                        <span>
                          {member.memberId || "No ID"}
                          {member.phone
                            ? ` • ${member.phone}`
                            : ""}
                        </span>
                      </div>

                      <ArrowUp
                        size={15}
                        className="progress-option-arrow"
                      />
                    </button>
                  ))
                ) : (
                  <div className="progress-no-members">
                    <User size={24} />
                    <span>No members found</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {!selectedMember ? (
          <div className="progress-empty-state">
            <div className="progress-empty-icon">
              <Scale size={34} />
            </div>

            <h3>Select a member to view progress</h3>

            <p>
              Choose a member above to see their fitness
              history, measurements and progress trends.
            </p>

            <button
              className="primary-button"
              onClick={() => {
                setShowMemberDropdown(true);
              }}
            >
              <Search size={17} />
              Find a Member
            </button>
          </div>
        ) : (
          <>
            <div className="progress-selected-member">
              <div className="progress-selected-avatar">
                {selectedMember.profilePhoto ? (
                  <img
                    src={selectedMember.profilePhoto}
                    alt={selectedMember.name}
                  />
                ) : (
                  selectedMember.name
                    ?.charAt(0)
                    .toUpperCase() || "M"
                )}
              </div>

              <div className="progress-selected-info">
                <div>
                  <span className="progress-selected-label">
                    TRACKING MEMBER
                  </span>

                  <h3>{selectedMember.name}</h3>

                  <p>
                    {selectedMember.memberId || "No member ID"}
                    {selectedMember.phone
                      ? ` • ${selectedMember.phone}`
                      : ""}
                  </p>
                </div>

                <div
                  className={`progress-member-status ${
                    selectedMember.status?.toLowerCase() || ""
                  }`}
                >
                  {selectedMember.status || "Active"}
                </div>
              </div>
            </div>

            {loadingProgress ? (
              <div className="progress-loading">
                <div className="progress-spinner" />
                <span>Loading progress...</span>
              </div>
            ) : (
              <>
                <div className="progress-stat-grid">
                  <div className="progress-stat-card weight-card">
                    <div className="progress-stat-top">
                      <div className="progress-stat-icon">
                        <Scale size={20} />
                      </div>

                      <span>Current Weight</span>
                    </div>

                    <div className="progress-stat-value">
                      {currentRecord?.weight != null
                        ? `${currentRecord.weight} kg`
                        : "—"}
                    </div>

                    <div className="progress-stat-bottom">
                      <span>
                        {currentRecord
                          ? formatShortDate(
                              currentRecord.recordDate
                            )
                          : "No record"}
                      </span>

                      {weightChange !== null && (
                        <span
                          className={
                            weightChange < 0
                              ? "progress-change positive"
                              : weightChange > 0
                              ? "progress-change neutral"
                              : "progress-change"
                          }
                        >
                          {weightChange > 0 ? (
                            <ArrowUp size={13} />
                          ) : weightChange < 0 ? (
                            <ArrowDown size={13} />
                          ) : null}

                          {weightChange > 0 ? "+" : ""}
                          {weightChange} kg
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="progress-stat-card bodyfat-card">
                    <div className="progress-stat-top">
                      <div className="progress-stat-icon">
                        <HeartPulse size={20} />
                      </div>

                      <span>Body Fat</span>
                    </div>

                    <div className="progress-stat-value">
                      {currentRecord?.bodyFat != null
                        ? `${currentRecord.bodyFat}%`
                        : "—"}
                    </div>

                    <div className="progress-stat-bottom">
                      <span>Latest measurement</span>

                      {currentRecord?.bodyFat != null &&
                        previousRecord?.bodyFat != null && (
                          <span
                            className={
                              currentRecord.bodyFat <
                              previousRecord.bodyFat
                                ? "progress-change positive"
                                : "progress-change neutral"
                            }
                          >
                            {currentRecord.bodyFat >
                            previousRecord.bodyFat
                              ? "+" 
                              : ""}
                            {(
                              currentRecord.bodyFat -
                              previousRecord.bodyFat
                            ).toFixed(1)}
                            %
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="progress-stat-card bmi-card">
                    <div className="progress-stat-top">
                      <div className="progress-stat-icon">
                        <Gauge size={20} />
                      </div>

                      <span>BMI</span>
                    </div>

                    <div className="progress-stat-value">
                      {bmi !== null ? bmi : "—"}
                    </div>

                    <div className="progress-stat-bottom">
                      <span>{bmiLabel}</span>

                      {currentRecord?.height != null && (
                        <span>
                          {currentRecord.height} cm
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="progress-stat-card records-card">
                    <div className="progress-stat-top">
                      <div className="progress-stat-icon">
                        <CalendarDays size={20} />
                      </div>

                      <span>Total Records</span>
                    </div>

                    <div className="progress-stat-value">
                      {records.length}
                    </div>

                    <div className="progress-stat-bottom">
                      <span>
                        {records.length
                          ? `Since ${formatDate(
                              records[records.length - 1]
                                .recordDate
                            )}`
                          : "No progress history"}
                      </span>
                    </div>
                  </div>
                </div>

                {records.length === 0 ? (
                  <div className="progress-no-history">
                    <div className="progress-no-history-icon">
                      <TrendingUp size={28} />
                    </div>

                    <div>
                      <h3>No progress records yet</h3>
                      <p>
                        Start tracking this member's fitness
                        journey by adding their first measurement.
                      </p>
                    </div>

                    <button
                      className="primary-button"
                      onClick={openCreateModal}
                    >
                      <Plus size={17} />
                      Add First Record
                    </button>
                  </div>
                ) : (
                  <div className="progress-content-grid">
                    <div className="progress-main-column">
                      <div className="progress-panel progress-chart-panel">
                        <div className="progress-panel-header">
                          <div>
                            <span className="progress-panel-kicker">
                              TREND
                            </span>
                            <h3>Weight Progress</h3>
                            <p>
                              Latest weight measurements over
                              time.
                            </p>
                          </div>

                          <div className="progress-chart-current">
                            <strong>
                              {currentRecord?.weight ?? "—"}
                              {currentRecord?.weight != null
                                ? " kg"
                                : ""}
                            </strong>
                            <span>Current</span>
                          </div>
                        </div>

                        {weightChart.length > 0 ? (
                          <div className="progress-chart">
                            <div className="progress-chart-y">
                              <span>
                                {Math.ceil(
                                  chartStats.max
                                )}
                              </span>
                              <span>
                                {Math.round(
                                  (chartStats.max +
                                    chartStats.min) /
                                    2
                                )}
                              </span>
                              <span>
                                {Math.floor(
                                  chartStats.min
                                )}
                              </span>
                            </div>

                            <div className="progress-chart-area">
                              <div className="progress-chart-grid">
                                <span />
                                <span />
                                <span />
                              </div>

                              <svg
                                className="progress-chart-svg"
                                viewBox="0 0 800 260"
                                preserveAspectRatio="none"
                              >
                                <defs>
                                  <linearGradient
                                    id="progressAreaGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopOpacity="0.22"
                                    />
                                    <stop
                                      offset="100%"
                                      stopOpacity="0"
                                    />
                                  </linearGradient>
                                </defs>

                                {weightChart.length > 1 && (
                                  <polygon
                                    className="progress-chart-area-fill"
                                    points={[
                                      ...weightChart.map(
                                        (
                                          item,
                                          index
                                        ) => {
                                          const x =
                                            (index /
                                              (weightChart.length -
                                                1)) *
                                            760 +
                                            20;

                                          const y =
                                            getChartPosition(
                                              item.weight
                                            ) *
                                            2.6;

                                          return `${x},${y}`;
                                        }
                                      ),
                                      `${
                                        ((weightChart.length -
                                          1) /
                                          (weightChart.length -
                                            1)) *
                                          760 +
                                        20
                                      },260`,
                                      `20,260`,
                                    ].join(" ")}
                                  />
                                )}

                                {weightChart.length > 1 && (
                                  <polyline
                                    className="progress-chart-line"
                                    points={weightChart
                                      .map(
                                        (
                                          item,
                                          index
                                        ) => {
                                          const x =
                                            (index /
                                              (weightChart.length -
                                                1)) *
                                            760 +
                                            20;

                                          const y =
                                            getChartPosition(
                                              item.weight
                                            ) *
                                            2.6;

                                          return `${x},${y}`;
                                        }
                                      )
                                      .join(" ")}
                                  />
                                )}

                                {weightChart.map(
                                  (item, index) => {
                                    const x =
                                      weightChart.length ===
                                      1
                                        ? 400
                                        : (index /
                                            (weightChart.length -
                                              1)) *
                                            760 +
                                          20;

                                    const y =
                                      getChartPosition(
                                        item.weight
                                      ) * 2.6;

                                    return (
                                      <circle
                                        key={item._id}
                                        className="progress-chart-point"
                                        cx={x}
                                        cy={y}
                                        r="5"
                                      />
                                    );
                                  }
                                )}
                              </svg>

                              <div className="progress-chart-labels">
                                {weightChart.map((item) => (
                                  <span key={item._id}>
                                    {formatShortDate(
                                      item.recordDate
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="progress-chart-empty">
                            <Scale size={26} />
                            <span>
                              Add weight measurements to see
                              your trend.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="progress-panel">
                        <div className="progress-panel-header">
                          <div>
                            <span className="progress-panel-kicker">
                              HISTORY
                            </span>
                            <h3>Progress Records</h3>
                            <p>
                              Review and manage all recorded
                              measurements.
                            </p>
                          </div>

                          <span className="progress-record-count">
                            {records.length}{" "}
                            {records.length === 1
                              ? "record"
                              : "records"}
                          </span>
                        </div>

                        <div className="progress-table-wrap">
                          <table className="progress-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Weight</th>
                                <th>Body Fat</th>
                                <th>Chest</th>
                                <th>Waist</th>
                                <th>Arms</th>
                                <th>Actions</th>
                              </tr>
                            </thead>

                            <tbody>
                              {recentRecords.map((record) => (
                                <tr key={record._id}>
                                  <td>
                                    <div className="progress-date-cell">
                                      <CalendarDays size={15} />
                                      {formatDate(
                                        record.recordDate
                                      )}
                                    </div>
                                  </td>

                                  <td className="progress-strong-cell">
                                    {formatValue(
                                      record.weight,
                                      "kg"
                                    )}
                                  </td>

                                  <td>
                                    {formatValue(
                                      record.bodyFat,
                                      "%"
                                    )}
                                  </td>

                                  <td>
                                    {formatValue(
                                      record.chest,
                                      "cm"
                                    )}
                                  </td>

                                  <td>
                                    {formatValue(
                                      record.waist,
                                      "cm"
                                    )}
                                  </td>

                                  <td>
                                    {formatValue(
                                      record.arms,
                                      "cm"
                                    )}
                                  </td>

                                  <td>
                                    <div className="progress-row-actions">
                                      <button
                                        type="button"
                                        title="View"
                                        onClick={() =>
                                          openDetails(
                                            record
                                          )
                                        }
                                      >
                                        <Eye size={16} />
                                      </button>

                                      <button
                                        type="button"
                                        title="Edit"
                                        onClick={() =>
                                          openEditModal(
                                            record
                                          )
                                        }
                                      >
                                        <Edit3 size={16} />
                                      </button>

                                      <button
                                        type="button"
                                        title="Delete"
                                        className="danger"
                                        onClick={() =>
                                          handleDelete(
                                            record
                                          )
                                        }
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {records.length > 8 && (
                          <div className="progress-history-note">
                            Showing the latest 8 records. Your
                            complete history is retained in the
                            member record.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="progress-side-column">
                      <div className="progress-panel measurement-panel">
                        <div className="progress-panel-header compact">
                          <div>
                            <span className="progress-panel-kicker">
                              MEASUREMENTS
                            </span>
                            <h3>Latest Body Stats</h3>
                          </div>

                          <Ruler size={20} />
                        </div>

                        <div className="measurement-grid">
                          <div className="measurement-item">
                            <span>Chest</span>
                            <strong>
                              {formatValue(
                                currentRecord?.chest,
                                "cm"
                              )}
                            </strong>
                          </div>

                          <div className="measurement-item">
                            <span>Waist</span>
                            <strong>
                              {formatValue(
                                currentRecord?.waist,
                                "cm"
                              )}
                            </strong>
                          </div>

                          <div className="measurement-item">
                            <span>Arms</span>
                            <strong>
                              {formatValue(
                                currentRecord?.arms,
                                "cm"
                              )}
                            </strong>
                          </div>

                          <div className="measurement-item">
                            <span>Hips</span>
                            <strong>
                              {formatValue(
                                currentRecord?.hips,
                                "cm"
                              )}
                            </strong>
                          </div>

                          <div className="measurement-item">
                            <span>Thighs</span>
                            <strong>
                              {formatValue(
                                currentRecord?.thighs,
                                "cm"
                              )}
                            </strong>
                          </div>

                          <div className="measurement-item">
                            <span>Height</span>
                            <strong>
                              {formatValue(
                                currentRecord?.height,
                                "cm"
                              )}
                            </strong>
                          </div>
                        </div>

                        {currentRecord && (
                          <div className="measurement-date">
                            Last measured{" "}
                            {formatDate(
                              currentRecord.recordDate
                            )}
                          </div>
                        )}
                      </div>

                      <div className="progress-panel photo-panel">
                        <div className="progress-panel-header compact">
                          <div>
                            <span className="progress-panel-kicker">
                              PROGRESS PHOTO
                            </span>
                            <h3>Latest Snapshot</h3>
                          </div>

                          <Camera size={20} />
                        </div>

                        {currentRecord?.progressPhoto ? (
                          <div className="progress-photo-preview">
                            <img
                              src={currentRecord.progressPhoto}
                              alt={`${selectedMember.name} progress`}
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />

                            <div className="progress-photo-overlay">
                              <span>
                                {formatDate(
                                  currentRecord.recordDate
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="progress-photo-empty">
                            <Camera size={30} />
                            <strong>No photo added</strong>
                            <span>
                              Add a progress photo when recording
                              new measurements.
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="progress-panel journey-panel">
                        <div className="progress-panel-header compact">
                          <div>
                            <span className="progress-panel-kicker">
                              JOURNEY
                            </span>
                            <h3>Progress Overview</h3>
                          </div>

                          <Dumbbell size={20} />
                        </div>

                        <div className="journey-timeline">
                          <div className="journey-line" />

                          <div className="journey-step">
                            <div className="journey-dot">
                              <User size={13} />
                            </div>

                            <div>
                              <strong>Member selected</strong>
                              <span>
                                {selectedMember.name}
                              </span>
                            </div>
                          </div>

                          <div className="journey-step">
                            <div className="journey-dot">
                              <CalendarDays size={13} />
                            </div>

                            <div>
                              <strong>Tracking started</strong>
                              <span>
                                {records.length
                                  ? formatDate(
                                      records[
                                        records.length - 1
                                      ].recordDate
                                    )
                                  : "Not started"}
                              </span>
                            </div>
                          </div>

                          <div className="journey-step">
                            <div className="journey-dot">
                              <TrendingUp size={13} />
                            </div>

                            <div>
                              <strong>Latest update</strong>
                              <span>
                                {currentRecord
                                  ? formatDate(
                                      currentRecord.recordDate
                                    )
                                  : "No update yet"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {showModal && (
          <div
            className="progress-modal-backdrop"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !saving
              ) {
                closeModal();
              }
            }}
          >
            <div className="progress-modal">
              <div className="progress-modal-header">
                <div>
                  <span className="progress-modal-kicker">
                    {editingRecord
                      ? "UPDATE RECORD"
                      : "NEW RECORD"}
                  </span>

                  <h3>
                    {editingRecord
                      ? "Edit Progress"
                      : "Add Progress"}
                  </h3>

                  <p>
                    {selectedMember.name} •{" "}
                    {formatDate(
                      form.recordDate
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  className="progress-modal-close"
                  onClick={closeModal}
                  disabled={saving}
                >
                  <X size={19} />
                </button>
              </div>

              <form
                className="progress-form"
                onSubmit={handleSubmit}
              >
                <div className="progress-form-section">
                  <div className="progress-form-section-heading">
                    <CalendarDays size={17} />
                    <span>Record Details</span>
                  </div>

                  <div className="progress-form-grid one">
                    <label className="progress-field">
                      <span>
                        Record Date
                        <b>*</b>
                      </span>

                      <input
                        type="date"
                        value={form.recordDate}
                        onChange={(event) =>
                          updateForm(
                            "recordDate",
                            event.target.value
                          )
                        }
                        required
                      />
                    </label>
                  </div>
                </div>

                <div className="progress-form-section">
                  <div className="progress-form-section-heading">
                    <Scale size={17} />
                    <span>Body Composition</span>
                  </div>

                  <div className="progress-form-grid">
                    <label className="progress-field">
                      <span>Weight</span>
                      <div className="progress-input-unit">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 72.5"
                          value={form.weight}
                          onChange={(event) =>
                            updateForm(
                              "weight",
                              event.target.value
                            )
                          }
                        />
                        <small>kg</small>
                      </div>
                    </label>

                    <label className="progress-field">
                      <span>Body Fat</span>
                      <div className="progress-input-unit">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="e.g. 18.5"
                          value={form.bodyFat}
                          onChange={(event) =>
                            updateForm(
                              "bodyFat",
                              event.target.value
                            )
                          }
                        />
                        <small>%</small>
                      </div>
                    </label>

                    <label className="progress-field">
                      <span>Height</span>
                      <div className="progress-input-unit">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 175"
                          value={form.height}
                          onChange={(event) =>
                            updateForm(
                              "height",
                              event.target.value
                            )
                          }
                        />
                        <small>cm</small>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="progress-form-section">
                  <div className="progress-form-section-heading">
                    <Ruler size={17} />
                    <span>Body Measurements</span>
                  </div>

                  <div className="progress-form-grid">
                    <label className="progress-field">
                      <span>Chest</span>
                      <div className="progress-input-unit">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 98"
                          value={form.chest}
                          onChange={(event) =>
                            updateForm(
                              "chest",
                              event.target.value
                            )
                          }
                        />
                        <small>cm</small>
                      </div>
                    </label>

                    <label className="progress-field">
                      <span>Waist</span>
                      <div className="progress-input-unit">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 82"
                          value={form.waist}
                          onChange={(event) =>
                            updateForm(
                              "waist",
                              event.target.value
                            )
                          }
                        />
                        <small>cm</small>
                      </div>
                    </label>

                    <label className="progress-field">
                      <span>Arms</span>
                      <div className="progress-input-unit">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 36"
                          value={form.arms}
                          onChange={(event) =>
                            updateForm(
                              "arms",
                              event.target.value
                            )
                          }
                        />
                        <small>cm</small>
                      </div>
                    </label>

                    <label className="progress-field">
                      <span>Hips</span>
                      <div className="progress-input-unit">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 96"
                          value={form.hips}
                          onChange={(event) =>
                            updateForm(
                              "hips",
                              event.target.value
                            )
                          }
                        />
                        <small>cm</small>
                      </div>
                    </label>

                    <label className="progress-field">
                      <span>Thighs</span>
                      <div className="progress-input-unit">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g. 55"
                          value={form.thighs}
                          onChange={(event) =>
                            updateForm(
                              "thighs",
                              event.target.value
                            )
                          }
                        />
                        <small>cm</small>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="progress-form-section">
                  <div className="progress-form-section-heading">
                    <Camera size={17} />
                    <span>Progress Photo</span>
                  </div>

                  <label className="progress-field">
                    <span>Photo URL</span>

                    <input
                      type="url"
                      placeholder="https://example.com/progress-photo.jpg"
                      value={form.progressPhoto}
                      onChange={(event) =>
                        updateForm(
                          "progressPhoto",
                          event.target.value
                        )
                      }
                    />

                    <small className="progress-field-help">
                      Paste an image URL. Cloud upload can be
                      connected later.
                    </small>
                  </label>
                </div>

                <div className="progress-form-section">
                  <div className="progress-form-section-heading">
                    <Activity size={17} />
                    <span>Notes</span>
                  </div>

                  <label className="progress-field">
                    <span>Trainer Notes</span>

                    <textarea
                      rows="4"
                      placeholder="Add observations, goals or trainer notes..."
                      value={form.notes}
                      onChange={(event) =>
                        updateForm(
                          "notes",
                          event.target.value
                        )
                      }
                    />
                  </label>
                </div>

                <div className="progress-modal-footer">
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
                    {saving ? (
                      <>
                        <span className="button-spinner" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus size={17} />
                        {editingRecord
                          ? "Update Record"
                          : "Save Progress"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDetails && viewingRecord && (
          <div
            className="progress-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowDetails(false);
              }
            }}
          >
            <div className="progress-details-modal">
              <div className="progress-modal-header">
                <div>
                  <span className="progress-modal-kicker">
                    PROGRESS RECORD
                  </span>

                  <h3>Measurement Details</h3>

                  <p>
                    {selectedMember.name} •{" "}
                    {formatDate(
                      viewingRecord.recordDate
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  className="progress-modal-close"
                  onClick={() => setShowDetails(false)}
                >
                  <X size={19} />
                </button>
              </div>

              <div className="progress-details-body">
                <div className="progress-detail-highlight-grid">
                  <div>
                    <span>Weight</span>
                    <strong>
                      {formatValue(
                        viewingRecord.weight,
                        "kg"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Body Fat</span>
                    <strong>
                      {formatValue(
                        viewingRecord.bodyFat,
                        "%"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Height</span>
                    <strong>
                      {formatValue(
                        viewingRecord.height,
                        "cm"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>BMI</span>
                    <strong>
                      {viewingRecord.weight &&
                      viewingRecord.height
                        ? (
                            Number(
                              viewingRecord.weight
                            ) /
                            Math.pow(
                              Number(
                                viewingRecord.height
                              ) / 100,
                              2
                            )
                          ).toFixed(1)
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div className="progress-details-section">
                  <div className="progress-form-section-heading">
                    <Ruler size={17} />
                    <span>Body Measurements</span>
                  </div>

                  <div className="progress-details-measurements">
                    <div>
                      <span>Chest</span>
                      <strong>
                        {formatValue(
                          viewingRecord.chest,
                          "cm"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Waist</span>
                      <strong>
                        {formatValue(
                          viewingRecord.waist,
                          "cm"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Arms</span>
                      <strong>
                        {formatValue(
                          viewingRecord.arms,
                          "cm"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Hips</span>
                      <strong>
                        {formatValue(
                          viewingRecord.hips,
                          "cm"
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Thighs</span>
                      <strong>
                        {formatValue(
                          viewingRecord.thighs,
                          "cm"
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                {viewingRecord.notes && (
                  <div className="progress-details-section">
                    <div className="progress-form-section-heading">
                      <Activity size={17} />
                      <span>Trainer Notes</span>
                    </div>

                    <div className="progress-notes-box">
                      {viewingRecord.notes}
                    </div>
                  </div>
                )}

                {viewingRecord.progressPhoto && (
                  <div className="progress-details-section">
                    <div className="progress-form-section-heading">
                      <Camera size={17} />
                      <span>Progress Photo</span>
                    </div>

                    <div className="progress-details-photo">
                      <img
                        src={viewingRecord.progressPhoto}
                        alt="Progress"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="progress-details-footer">
                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowDetails(false)
                  }
                >
                  Close
                </button>

                <button
                  className="primary-button"
                  onClick={() => {
                    setShowDetails(false);
                    openEditModal(viewingRecord);
                  }}
                >
                  <Edit3 size={17} />
                  Edit Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}



