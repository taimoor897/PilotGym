import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MessageCircle,
  X,
  UserPlus,
  CreditCard,
  Send,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { apiRequest } from "../../services/api";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  gender: "Male",
  dateOfBirth: "",
  address: "",

  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",

  joinDate: new Date().toISOString().split("T")[0],
  membershipStart: "",
  membershipEnd: "",

  membershipPlan: "",
  status: "Active",
  notes: "",
};

export default function Members() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] =
    useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingMember, setEditingMember] =
    useState(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] =
    useState(emptyForm);

  // ============================
  // WHATSAPP MESSAGE
  // ============================

  const [whatsappMember, setWhatsappMember] =
    useState(null);

  const [whatsappMessage, setWhatsappMessage] =
    useState("");

  const [sendingWhatsApp, setSendingWhatsApp] =
    useState(false);

  const [showWhatsAppModal, setShowWhatsAppModal] =
    useState(false);

  // ============================
  // LOAD MEMBERS
  // ============================

  const loadMembers = async () => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      if (search.trim()) {
        query.append(
          "search",
          search.trim()
        );
      }

      if (status) {
        query.append("status", status);
      }

      const data = await apiRequest(
        `/members?${query.toString()}`
      );

      setMembers(data.members || []);
    } catch (error) {
      console.error(
        "Load members error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Unable to load members",
        text:
          error.message ||
          "Something went wrong.",
        background: "#111827",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // LOAD PLANS
  // ============================

  const loadPlans = async () => {
    try {
      setPlansLoading(true);

      const data = await apiRequest(
        "/membership-plans"
      );

      setPlans(
        (data.plans || []).filter(
          (plan) =>
            plan.status === "Active"
        )
      );
    } catch (error) {
      console.error(
        "Load plans error:",
        error
      );
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    loadPlans();
  }, []);

  // ============================
  // DASHBOARD ADD MEMBER
  // ============================

  useEffect(() => {
    if (
      searchParams.get("add") === "true"
    ) {
      openAddModal();

      searchParams.delete("add");

      setSearchParams(
        searchParams,
        { replace: true }
      );
    }
  }, []);

  // ============================
  // SEARCH
  // ============================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMembers();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, status]);

  // ============================
  // DATE CALCULATION
  // ============================

  const calculateEndDate = (
    startDate,
    planId
  ) => {
    if (!startDate || !planId) {
      return "";
    }

    const plan = plans.find(
      (item) => item._id === planId
    );

    if (!plan) {
      return "";
    }

    const date = new Date(
      `${startDate}T00:00:00`
    );

    date.setDate(
      date.getDate() +
        Number(plan.duration)
    );

    return date
      .toISOString()
      .split("T")[0];
  };

  // ============================
  // FORM CHANGE
  // ============================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (
        name === "membershipPlan" ||
        name === "membershipStart"
      ) {
        updated.membershipEnd =
          calculateEndDate(
            name ===
              "membershipStart"
              ? value
              : prev.membershipStart,
            name ===
              "membershipPlan"
              ? value
              : prev.membershipPlan
          );
      }

      return updated;
    });
  };

  // ============================
  // OPEN ADD
  // ============================

  function openAddModal() {
    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    setEditingMember(null);

    setForm({
      ...emptyForm,
      joinDate: today,
      membershipStart: today,
      membershipEnd: "",
    });

    setShowModal(true);
  }

  // ============================
  // OPEN EDIT
  // ============================

  const openEditModal = (member) => {
    setEditingMember(member);

    setForm({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
      gender:
        member.gender || "Male",

      dateOfBirth:
        member.dateOfBirth
          ? member.dateOfBirth.split(
              "T"
            )[0]
          : "",

      address:
        member.address || "",

      emergencyName:
        member.emergencyContact
          ?.name || "",

      emergencyPhone:
        member.emergencyContact
          ?.phone || "",

      emergencyRelationship:
        member.emergencyContact
          ?.relationship || "",

      joinDate:
        member.joinDate
          ? member.joinDate.split(
              "T"
            )[0]
          : "",

      membershipStart:
        member.membershipStart
          ? member.membershipStart.split(
              "T"
            )[0]
          : "",

      membershipEnd:
        member.membershipEnd
          ? member.membershipEnd.split(
              "T"
            )[0]
          : "",

      membershipPlan:
        member.membershipPlan?._id ||
        member.membershipPlan ||
        "",

      status:
        member.status || "Active",

      notes:
        member.notes || "",
    });

    setShowModal(true);
  };

  // ============================
  // CLOSE MEMBER MODAL
  // ============================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingMember(null);
    setForm(emptyForm);
  };

  // ============================
  // SAVE MEMBER
  // ============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name required",
        text:
          "Please enter the member's name.",
        background: "#111827",
        color: "#fff",
      });

      return;
    }

    if (!form.phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Phone required",
        text:
          "Please enter the member's phone number.",
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

        joinDate:
          form.joinDate || null,

        membershipStart:
          form.membershipStart || null,

        membershipEnd:
          form.membershipEnd || null,

        membershipPlan:
          form.membershipPlan || null,

        status: form.status,

        notes:
          form.notes.trim(),
      };

      if (editingMember) {
        await apiRequest(
          `/members/${editingMember._id}`,
          {
            method: "PUT",
            body: JSON.stringify(
              payload
            ),
          }
        );
      } else {
        await apiRequest(
          "/members",
          {
            method: "POST",
            body: JSON.stringify(
              payload
            ),
          }
        );
      }

      await Swal.fire({
        icon: "success",
        title: editingMember
          ? "Member updated"
          : "Member added",

        text: editingMember
          ? "Member information updated successfully."
          : "New member added successfully.",

        timer: 1400,
        showConfirmButton: false,
        background: "#111827",
        color: "#fff",
      });

      closeModal();

      await loadMembers();
    } catch (error) {
      console.error(
        "Save member error:",
        error
      );

      Swal.fire({
        icon: "error",
        title:
          "Unable to save member",

        text:
          error.message ||
          "Something went wrong.",

        background: "#111827",
        color: "#fff",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // DELETE
  // ============================

  const handleDelete = async (
    member
  ) => {
    const result =
      await Swal.fire({
        icon: "warning",

        title:
          "Delete member?",

        text: `${member.name} will be permanently removed.`,

        showCancelButton: true,

        confirmButtonText:
          "Delete",

        cancelButtonText:
          "Cancel",

        background: "#111827",

        color: "#fff",

        confirmButtonColor:
          "#dc2626",

        cancelButtonColor:
          "#374151",
      });

    if (!result.isConfirmed)
      return;

    try {
      await apiRequest(
        `/members/${member._id}`,
        {
          method: "DELETE",
        }
      );

      await Swal.fire({
        icon: "success",

        title: "Deleted",

        text:
          "Member deleted successfully.",

        timer: 1300,

        showConfirmButton: false,

        background: "#111827",

        color: "#fff",
      });

      loadMembers();
    } catch (error) {
      Swal.fire({
        icon: "error",

        title:
          "Unable to delete",

        text:
          error.message ||
          "Something went wrong.",

        background: "#111827",

        color: "#fff",
      });
    }
  };

  // ============================
  // WHATSAPP
  // ============================

  const openWhatsApp = (member) => {
    if (!member.phone?.trim()) {
      Swal.fire({
        icon: "warning",

        title:
          "Phone number missing",

        text:
          "This member does not have a phone number.",

        background: "#111827",

        color: "#fff",
      });

      return;
    }

    const gym = JSON.parse(
      localStorage.getItem(
        "gympilot_gym"
      ) || "{}"
    );

    const gymName =
      gym.name || "your gym";

    setWhatsappMember(member);

    setWhatsappMessage(
      `Hello ${member.name}, this is ${gymName}. How can we help you today?`
    );

    setShowWhatsAppModal(true);
  };

  const closeWhatsAppModal = () => {
    if (sendingWhatsApp) return;

    setShowWhatsAppModal(false);
    setWhatsappMember(null);
    setWhatsappMessage("");
  };

  const sendWhatsApp = async () => {
    if (!whatsappMember) {
      return;
    }

    if (!whatsappMessage.trim()) {
      Swal.fire({
        icon: "warning",

        title:
          "Message required",

        text:
          "Please enter a message before sending.",

        background: "#111827",

        color: "#fff",
      });

      return;
    }

    try {
      setSendingWhatsApp(true);

      await apiRequest(
        "/whatsapp/send",
        {
          method: "POST",

          body: JSON.stringify({
            phone:
              whatsappMember.phone,

            message:
              whatsappMessage.trim(),
          }),
        }
      );

      const memberName =
        whatsappMember.name;

      setShowWhatsAppModal(false);
      setWhatsappMember(null);
      setWhatsappMessage("");

      await Swal.fire({
        icon: "success",

        title:
          "Message sent",

        text: `WhatsApp message sent to ${memberName}.`,

        timer: 1600,

        showConfirmButton: false,

        background: "#111827",

        color: "#fff",
      });
    } catch (error) {
      console.error(
        "Send WhatsApp message error:",
        error
      );

      Swal.fire({
        icon: "error",

        title:
          "Message not sent",

        text:
          error.message ||
          "Unable to send WhatsApp message.",

        background: "#111827",

        color: "#fff",
      });
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // ============================
  // QUICK WHATSAPP MESSAGES
  // ============================

  const setQuickMessage = (
    type
  ) => {
    if (!whatsappMember) {
      return;
    }

    const gym = JSON.parse(
      localStorage.getItem(
        "gympilot_gym"
      ) || "{}"
    );

    const gymName =
      gym.name || "our gym";

    const name =
      whatsappMember.name;

    const messages = {
      welcome: `Hello ${name}, welcome to ${gymName}! 🎉 We're happy to have you as a member. We look forward to seeing you at the gym! 💪`,

      membership: `Hello ${name}, this is a friendly reminder from ${gymName} regarding your membership. Please contact us if you need any assistance. 📅💪`,

      payment: `Hello ${name}, this is a friendly reminder from ${gymName} regarding your gym payment. Please contact us if you have any questions. 💳`,

      comeback: `Hello ${name}! 👋 We haven't seen you at ${gymName} recently. We'd love to have you back. Come in and keep working toward your fitness goals! 💪`,
    };

    setWhatsappMessage(
      messages[type] || ""
    );
  };

  // ============================
  // HELPERS
  // ============================

  const initials = (name) => {
    return (
      name
        ?.split(" ")
        .map(
          (word) =>
            word[0]
        )
        .join("")
        .slice(0, 2)
        .toUpperCase() ||
      "M"
    );
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(
      date
    ).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const selectedPlan = plans.find(
    (plan) =>
      plan._id ===
      form.membershipPlan
  );

  return (
    <DashboardLayout
      title="Members"
      subtitle="Manage your gym members, memberships and contact information."
    >
      {/* =========================
          HEADER
      ========================== */}

      <div className="page-toolbar">
        <div>
          <span className="welcome-label">
            MEMBERS
          </span>

          <h2 className="page-title">
            Member Management
          </h2>

          <p className="page-description">
            Add, update and manage your
            gym members.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Member
        </button>
      </div>

      {/* =========================
          STATS
      ========================== */}

      <div className="member-stats">
        <div className="member-stat-card">
          <span>
            TOTAL MEMBERS
          </span>

          <strong>
            {members.length}
          </strong>
        </div>

        <div className="member-stat-card">
          <span>ACTIVE</span>

          <strong>
            {
              members.filter(
                (member) =>
                  member.status ===
                  "Active"
              ).length
            }
          </strong>
        </div>

        <div className="member-stat-card">
          <span>EXPIRED</span>

          <strong>
            {
              members.filter(
                (member) =>
                  member.status ===
                  "Expired"
              ).length
            }
          </strong>
        </div>
      </div>

      {/* =========================
          MEMBERS PANEL
      ========================== */}

      <div className="members-panel">
        <div className="members-toolbar">
          <div className="member-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />
          </div>

          <select
            className="status-filter"
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value
              )
            }
          >
            <option value="">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Expired">
              Expired
            </option>

            <option value="Suspended">
              Suspended
            </option>

            <option value="Inactive">
              Inactive
            </option>
          </select>
        </div>

        {loading ? (
          <div className="members-loading">
            <div className="loading-spinner" />

            <p>
              Loading members...
            </p>
          </div>
        ) : members.length === 0 ? (
          <div className="members-empty">
            <div className="empty-member-icon">
              <UserPlus size={28} />
            </div>

            <h3>
              No members found
            </h3>

            <p>
              Add your first gym member
              to get started.
            </p>

            <button
              className="primary-button"
              onClick={
                openAddModal
              }
            >
              <Plus size={18} />
              Add Member
            </button>
          </div>
        ) : (
          <div className="members-table">
            <div className="member-row member-heading">
              <span>
                MEMBER
              </span>

              <span>
                CONTACT
              </span>

              <span>
                MEMBERSHIP
              </span>

              <span>
                JOINED
              </span>

              <span>
                STATUS
              </span>

              <span />
            </div>

            {members.map(
              (member) => (
                <div
                  className="member-row"
                  key={
                    member._id
                  }
                >
                  <div className="member-name-cell">
                    <div className="member-avatar">
                      {initials(
                        member.name
                      )}
                    </div>

                    <div>
                      <strong>
                        {
                          member.name
                        }
                      </strong>

                      <span>
                        {
                          member.memberId
                        }
                      </span>
                    </div>
                  </div>

                  <div className="contact-cell">
                    <strong>
                      {
                        member.phone
                      }
                    </strong>

                    <span>
                      {
                        member.email ||
                        "No email"
                      }
                    </span>
                  </div>

                  <div className="membership-cell">
                    <strong>
                      {
                        member
                          .membershipPlan
                          ?.name ||
                        "No plan"
                      }
                    </strong>

                    <span>
                      {member.membershipEnd
                        ? `Until ${formatDate(
                            member.membershipEnd
                          )}`
                        : "No expiry"}
                    </span>
                  </div>

                  <div className="joined-cell">
                    {formatDate(
                      member.joinDate
                    )}
                  </div>

                  <span
                    className={`member-status ${String(
                      member.status ||
                        ""
                    ).toLowerCase()}`}
                  >
                    {
                      member.status
                    }
                  </span>

                  <div className="member-actions">
                    <button
                      title="WhatsApp"
                      onClick={() =>
                        openWhatsApp(
                          member
                        )
                      }
                    >
                      <MessageCircle
                        size={16}
                      />
                    </button>

                    <button
                      title="Edit"
                      onClick={() =>
                        openEditModal(
                          member
                        )
                      }
                    >
                      <Pencil
                        size={16}
                      />
                    </button>

                    <button
                      title="Delete"
                      className="danger"
                      onClick={() =>
                        handleDelete(
                          member
                        )
                      }
                    >
                      <Trash2
                        size={16}
                      />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* =========================
          MEMBER MODAL
      ========================== */}

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="modal-card member-modal">
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  {editingMember
                    ? "UPDATE MEMBER"
                    : "NEW MEMBER"}
                </span>

                <h2>
                  {editingMember
                    ? "Edit Member"
                    : "Add New Member"}
                </h2>

                <p>
                  Enter the member's
                  information and
                  membership details.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={
                  closeModal
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="member-form"
              onSubmit={
                handleSubmit
              }
            >
              {/* BASIC INFO */}

              <div className="form-section">
                <div className="form-section-title">
                  Basic Information
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label>
                      Full Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Ahmed Khan"
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
                      value={
                        form.phone
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="03001234567"
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
                      value={
                        form.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="member@email.com"
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Gender
                    </label>

                    <select
                      name="gender"
                      value={
                        form.gender
                      }
                      onChange={
                        handleChange
                      }
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
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                  <div className="form-field full">
                    <label>
                      Address
                    </label>

                    <input
                      type="text"
                      name="address"
                      value={
                        form.address
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Member address"
                    />
                  </div>
                </div>
              </div>

              {/* MEMBERSHIP */}

              <div className="form-section">
                <div className="form-section-title">
                  Membership
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label>
                      Membership Plan
                    </label>

                    <select
                      name="membershipPlan"
                      value={
                        form.membershipPlan
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        plansLoading
                      }
                    >
                      <option value="">
                        {plansLoading
                          ? "Loading plans..."
                          : plans.length ===
                            0
                          ? "No active plans"
                          : "Select a plan"}
                      </option>

                      {plans.map(
                        (plan) => (
                          <option
                            value={
                              plan._id
                            }
                            key={
                              plan._id
                            }
                          >
                            {plan.name} — PKR{" "}
                            {Number(
                              plan.price
                            ).toLocaleString()}{" "}
                            /{" "}
                            {plan.duration}{" "}
                            days
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>
                      Join Date
                    </label>

                    <input
                      type="date"
                      name="joinDate"
                      value={
                        form.joinDate
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Membership Start
                    </label>

                    <input
                      type="date"
                      name="membershipStart"
                      value={
                        form.membershipStart
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>

                  <div className="form-field">
                    <label>
                      Membership End
                    </label>

                    <input
                      type="date"
                      name="membershipEnd"
                      value={
                        form.membershipEnd
                      }
                      onChange={
                        handleChange
                      }
                      readOnly={
                        Boolean(
                          selectedPlan
                        )
                      }
                    />
                  </div>

                  {selectedPlan && (
                    <div className="membership-preview">
                      <div className="membership-preview-icon">
                        <CreditCard
                          size={18}
                        />
                      </div>

                      <div>
                        <strong>
                          {
                            selectedPlan.name
                          }
                        </strong>

                        <span>
                          PKR{" "}
                          {Number(
                            selectedPlan.price
                          ).toLocaleString()}{" "}
                          ·{" "}
                          {
                            selectedPlan.duration
                          }{" "}
                          days
                        </span>
                      </div>

                      <div className="membership-preview-end">
                        <small>
                          EXPIRES
                        </small>

                        <strong>
                          {form.membershipEnd
                            ? formatDate(
                                form.membershipEnd
                              )
                            : "Select start"}
                        </strong>
                      </div>
                    </div>
                  )}

                  <div className="form-field">
                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        form.status
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="Expired">
                        Expired
                      </option>

                      <option value="Suspended">
                        Suspended
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* EMERGENCY */}

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
                      onChange={
                        handleChange
                      }
                      placeholder="Contact name"
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
                      onChange={
                        handleChange
                      }
                      placeholder="03001234567"
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
                      onChange={
                        handleChange
                      }
                      placeholder="Father, Mother, Brother..."
                    />
                  </div>
                </div>
              </div>

              {/* NOTES */}

              <div className="form-section">
                <div className="form-section-title">
                  Notes
                </div>

                <div className="form-grid">
                  <div className="form-field full">
                    <textarea
                      name="notes"
                      value={
                        form.notes
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Additional notes about this member..."
                      rows="4"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeModal
                  }
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
                    : editingMember
                    ? "Update Member"
                    : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          WHATSAPP MESSAGE MODAL
      ========================== */}

      {showWhatsAppModal &&
        whatsappMember && (
          <div
            className="modal-backdrop"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                closeWhatsAppModal();
              }
            }}
          >
            <div className="modal-card whatsapp-message-modal">
              <div className="modal-header">
                <div>
                  <span className="modal-eyebrow">
                    WHATSAPP
                  </span>

                  <h2>
                    Send Message
                  </h2>

                  <p>
                    Send a WhatsApp
                    message directly to
                    this member.
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={
                    closeWhatsAppModal
                  }
                  disabled={
                    sendingWhatsApp
                  }
                >
                  <X size={20} />
                </button>
              </div>

              {/* MEMBER PREVIEW */}

              <div className="whatsapp-member-preview">
                <div className="whatsapp-member-avatar">
                  {initials(
                    whatsappMember.name
                  )}
                </div>

                <div className="whatsapp-member-info">
                  <strong>
                    {
                      whatsappMember.name
                    }
                  </strong>

                  <span>
                    {
                      whatsappMember.phone
                    }
                  </span>
                </div>

                <div className="whatsapp-member-status">
                  <MessageCircle
                    size={16}
                  />

                  WhatsApp
                </div>
              </div>

              {/* QUICK MESSAGES */}

              <div className="whatsapp-quick-section">
                <label>
                  QUICK MESSAGE
                </label>

                <div className="whatsapp-quick-buttons">
                  <button
                    type="button"
                    onClick={() =>
                      setQuickMessage(
                        "welcome"
                      )
                    }
                  >
                    👋 Welcome
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setQuickMessage(
                        "membership"
                      )
                    }
                  >
                    📅 Membership
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setQuickMessage(
                        "payment"
                      )
                    }
                  >
                    💳 Payment
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setQuickMessage(
                        "comeback"
                      )
                    }
                  >
                    💪 Come Back
                  </button>
                </div>
              </div>

              {/* MESSAGE */}

              <div className="whatsapp-message-field">
                <div className="whatsapp-message-label">
                  <label>
                    MESSAGE
                  </label>

                  <span>
                    {
                      whatsappMessage.length
                    }
                    /2000
                  </span>
                </div>

                <textarea
                  value={
                    whatsappMessage
                  }
                  onChange={(e) =>
                    setWhatsappMessage(
                      e.target.value.slice(
                        0,
                        2000
                      )
                    )
                  }
                  placeholder="Type your WhatsApp message..."
                  rows="7"
                  disabled={
                    sendingWhatsApp
                  }
                />
              </div>

              {/* FOOTER */}

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    closeWhatsAppModal
                  }
                  disabled={
                    sendingWhatsApp
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="whatsapp-send-button"
                  onClick={
                    sendWhatsApp
                  }
                  disabled={
                    sendingWhatsApp ||
                    !whatsappMessage.trim()
                  }
                >
                  {sendingWhatsApp ? (
                    <>
                      <Loader2
                        size={17}
                        className="spin"
                      />

                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={17} />

                      Send WhatsApp
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}