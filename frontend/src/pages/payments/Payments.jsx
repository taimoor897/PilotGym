import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Receipt,
  CreditCard,
  Clock3,
  Wallet,
  UserRound,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { apiRequest } from "../../services/api";


// ======================================================
// HELPERS
// ======================================================

const getToday = () =>
  new Date().toISOString().split("T")[0];


const emptyForm = {
  member: "",
  membershipPlan: "",
  amount: "",
  paymentMethod: "Cash",
  status: "Paid",
  paymentDate: getToday(),
  dueDate: getToday(),
  reference: "",
  notes: "",
};


export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingPayment, setEditingPayment] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const [saving, setSaving] =
    useState(false);


  // ======================================================
  // LOAD DATA
  // ======================================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        paymentsResponse,
        membersResponse,
        plansResponse,
      ] = await Promise.all([
        apiRequest("/payments"),
        apiRequest("/members?limit=1000"),
        apiRequest("/membership-plans"),
      ]);

      setPayments(
        paymentsResponse?.payments ||
          paymentsResponse?.data ||
          []
      );

      setMembers(
        membersResponse?.members ||
          membersResponse?.data ||
          []
      );

      setPlans(
        plansResponse?.plans ||
          plansResponse?.data ||
          []
      );
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Unable to load payments",
        text:
          error.message ||
          "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, []);


  // ======================================================
  // FORM HELPERS
  // ======================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));


    // Automatically use membership
    // plan price as payment amount.
    if (name === "membershipPlan") {
      const selectedPlan =
        plans.find(
          (plan) =>
            plan._id === value
        );

      if (selectedPlan) {
        setForm((prev) => ({
          ...prev,
          membershipPlan: value,
          amount: selectedPlan.price,
        }));
      }
    }
  };


  const openAddModal = () => {
    setEditingPayment(null);

    const today = getToday();

    setForm({
      ...emptyForm,
      paymentDate: today,
      dueDate: today,
    });

    setShowModal(true);
  };


  const openEditModal = (payment) => {
    setEditingPayment(payment);

    const paymentDate =
      payment.paymentDate
        ? new Date(
            payment.paymentDate
          )
            .toISOString()
            .split("T")[0]
        : "";

    const dueDate =
      payment.dueDate
        ? new Date(
            payment.dueDate
          )
            .toISOString()
            .split("T")[0]
        : paymentDate;

    setForm({
      member:
        payment.member?._id ||
        payment.member ||
        "",

      membershipPlan:
        payment.membershipPlan?._id ||
        payment.membershipPlan ||
        "",

      amount:
        payment.amount ?? "",

      paymentMethod:
        payment.paymentMethod ||
        "Cash",

      status:
        payment.status ||
        "Paid",

      paymentDate,

      dueDate,

      reference:
        payment.reference || "",

      notes:
        payment.notes || "",
    });

    setShowModal(true);
  };


  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingPayment(null);
    setForm(emptyForm);
  };


  // ======================================================
  // SAVE PAYMENT
  // ======================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.member) {
      Swal.fire({
        icon: "warning",
        title: "Select a member",
        text:
          "Please select the member making this payment.",
      });

      return;
    }

    if (
      !form.amount ||
      Number(form.amount) <= 0
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid amount",
        text:
          "Please enter a payment amount greater than zero.",
      });

      return;
    }

    if (!form.paymentDate) {
      Swal.fire({
        icon: "warning",
        title: "Payment date required",
        text:
          "Please select the payment date.",
      });

      return;
    }

    if (!form.dueDate) {
      Swal.fire({
        icon: "warning",
        title: "Due date required",
        text:
          "Please select the payment due date.",
      });

      return;
    }

    try {
      setSaving(true);

      const payload = {
        member: form.member,

        membershipPlan:
          form.membershipPlan || null,

        amount: Number(form.amount),

        paymentMethod:
          form.paymentMethod,

        status:
          form.status,

        paymentDate:
          form.paymentDate,

        dueDate:
          form.dueDate,

        reference:
          form.reference,

        notes:
          form.notes,
      };

      if (editingPayment) {
        await apiRequest(
          `/payments/${editingPayment._id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await apiRequest(
          "/payments",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }

      await Swal.fire({
        icon: "success",
        title: editingPayment
          ? "Payment updated"
          : "Payment recorded",
        text: editingPayment
          ? "The payment has been updated successfully."
          : "The payment has been added successfully.",
        timer: 1600,
        showConfirmButton: false,
      });

      closeModal();
      await loadData();
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Payment failed",
        text:
          error.message ||
          "Unable to save payment.",
      });
    } finally {
      setSaving(false);
    }
  };


  // ======================================================
  // DELETE
  // ======================================================

  const handleDelete = async (payment) => {
    const memberName =
      payment.member?.name ||
      "this member";

    const result =
      await Swal.fire({
        icon: "warning",
        title: "Delete payment?",
        text: `This payment from ${memberName} will be permanently removed.`,
        showCancelButton: true,
        confirmButtonText:
          "Yes, delete it",
        cancelButtonText:
          "Cancel",
        reverseButtons: true,
      });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await apiRequest(
        `/payments/${payment._id}`,
        {
          method: "DELETE",
        }
      );

      Swal.fire({
        icon: "success",
        title: "Payment deleted",
        timer: 1300,
        showConfirmButton: false,
      });

      await loadData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text:
          error.message ||
          "Unable to delete payment.",
      });
    }
  };


  // ======================================================
  // FILTER
  // ======================================================

  const filteredPayments =
    useMemo(() => {
      const keyword =
        search.trim().toLowerCase();

      return payments.filter(
        (payment) => {
          const memberName =
            payment.member?.name?.toLowerCase() ||
            "";

          const memberId =
            payment.member?.memberId?.toLowerCase() ||
            "";

          const phone =
            payment.member?.phone?.toLowerCase() ||
            "";

          const reference =
            payment.reference?.toLowerCase() ||
            "";

          const matchesSearch =
            !keyword ||
            memberName.includes(keyword) ||
            memberId.includes(keyword) ||
            phone.includes(keyword) ||
            reference.includes(keyword);

          const matchesStatus =
            !statusFilter ||
            payment.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      payments,
      search,
      statusFilter,
    ]);


  // ======================================================
  // STATISTICS
  // ======================================================

  const stats = useMemo(() => {
    const paid = payments
      .filter(
        (payment) =>
          payment.status === "Paid"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

    const pending = payments
      .filter(
        (payment) =>
          payment.status === "Pending"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

    const partial = payments
      .filter(
        (payment) =>
          payment.status === "Partial"
      )
      .reduce(
        (sum, payment) =>
          sum + Number(payment.amount || 0),
        0
      );

    return {
      paid,
      pending,
      partial,
      total: payments.length,
    };
  }, [payments]);


  // ======================================================
  // FORMATTERS
  // ======================================================

  const formatCurrency = (value) => {
    return `PKR ${Number(
      value || 0
    ).toLocaleString()}`;
  };


  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(
      date
    ).toLocaleDateString(
      "en-PK",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  // ======================================================
  // DUE DATE HELPERS
  // ======================================================

  const isPaymentOverdue = (payment) => {
    if (
      payment.status === "Paid" ||
      payment.status === "Refunded"
    ) {
      return false;
    }

    if (!payment.dueDate) {
      return false;
    }

    const due = new Date(
      payment.dueDate
    );

    const today = new Date();

    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return due < today;
  };


  const isDueToday = (payment) => {
    if (
      payment.status === "Paid" ||
      payment.status === "Refunded"
    ) {
      return false;
    }

    if (!payment.dueDate) {
      return false;
    }

    const due = new Date(
      payment.dueDate
    );

    const today = new Date();

    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return (
      due.getTime() ===
      today.getTime()
    );
  };


  const selectedPlan =
    plans.find(
      (plan) =>
        plan._id ===
        form.membershipPlan
    );


  // ======================================================
  // RENDER
  // ======================================================

  return (
    <DashboardLayout
      title="Payments"
      subtitle="Track membership payments and gym revenue."
    >
      <div className="payments-page">

        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <div className="page-toolbar">
          <div>
            <div className="page-title">
              <h2>Payment Management</h2>

              <span>
                {payments.length}{" "}
                payment
                {payments.length !== 1
                  ? "s"
                  : ""}
              </span>
            </div>

            <p className="page-description">
              Record payments, monitor
              outstanding amounts, and
              manage member transactions.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Payment
          </button>
        </div>


        {/* ========================= */}
        {/* STATS */}
        {/* ========================= */}

        <div className="payment-stats">

          <div className="payment-stat-card">
            <div className="payment-stat-icon revenue">
              <Wallet size={21} />
            </div>

            <div>
              <span>Collected</span>

              <strong>
                {formatCurrency(
                  stats.paid
                )}
              </strong>
            </div>
          </div>


          <div className="payment-stat-card">
            <div className="payment-stat-icon pending">
              <Clock3 size={21} />
            </div>

            <div>
              <span>Pending</span>

              <strong>
                {formatCurrency(
                  stats.pending
                )}
              </strong>
            </div>
          </div>


          <div className="payment-stat-card">
            <div className="payment-stat-icon partial">
              <AlertCircle
                size={21}
              />
            </div>

            <div>
              <span>Partial</span>

              <strong>
                {formatCurrency(
                  stats.partial
                )}
              </strong>
            </div>
          </div>


          <div className="payment-stat-card">
            <div className="payment-stat-icon total">
              <Receipt size={21} />
            </div>

            <div>
              <span>Total Transactions</span>

              <strong>
                {stats.total}
              </strong>
            </div>
          </div>

        </div>


        {/* ========================= */}
        {/* PAYMENTS PANEL */}
        {/* ========================= */}

        <div className="payments-panel">

          <div className="payments-toolbar">

            <div className="payment-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search member, ID, phone or reference..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>


            <select
              className="payment-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="">
                All Statuses
              </option>

              <option value="Paid">
                Paid
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Partial">
                Partial
              </option>

              <option value="Refunded">
                Refunded
              </option>
            </select>

          </div>


          {/* ========================= */}
          {/* TABLE */}
          {/* ========================= */}

          {loading ? (
            <div className="payments-loading">
              <div className="loading-spinner" />

              <p>
                Loading payments...
              </p>
            </div>
          ) : filteredPayments.length ===
            0 ? (
            <div className="payments-empty">

              <div className="empty-payment-icon">
                <Receipt size={30} />
              </div>

              <h3>
                No payments found
              </h3>

              <p>
                {search ||
                statusFilter
                  ? "Try changing your search or filter."
                  : "Start recording payments to see them here."}
              </p>

              {!search &&
                !statusFilter && (
                  <button
                    className="primary-button"
                    onClick={
                      openAddModal
                    }
                  >
                    <Plus size={17} />
                    Record First Payment
                  </button>
                )}

            </div>
          ) : (
            <div className="payments-table-wrap">

              <table className="payments-table">

                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Payment Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Reference</th>
                    <th>Actions</th>
                  </tr>
                </thead>


                <tbody>

                  {filteredPayments.map(
                    (payment) => {

                      const overdue =
                        isPaymentOverdue(
                          payment
                        );

                      const dueToday =
                        isDueToday(
                          payment
                        );

                      return (
                        <tr
                          key={
                            payment._id
                          }
                        >

                          {/* MEMBER */}

                          <td>
                            <div className="payment-member-cell">

                              <div className="payment-member-avatar">
                                {payment.member?.name
                                  ?.charAt(
                                    0
                                  )
                                  .toUpperCase() ||
                                  "M"}
                              </div>

                              <div>
                                <strong>
                                  {
                                    payment
                                      .member
                                      ?.name
                                  }
                                </strong>

                                <span>
                                  {
                                    payment
                                      .member
                                      ?.memberId
                                  }
                                </span>
                              </div>

                            </div>
                          </td>


                          {/* PLAN */}

                          <td>
                            <div className="payment-plan-cell">
                              {payment
                                .membershipPlan
                                ?.name ||
                                "—"}
                            </div>
                          </td>


                          {/* AMOUNT */}

                          <td>
                            <strong className="payment-amount">
                              {formatCurrency(
                                payment.amount
                              )}
                            </strong>
                          </td>


                          {/* METHOD */}

                          <td>
                            <span className="payment-method">
                              <CreditCard
                                size={15}
                              />

                              {
                                payment.paymentMethod
                              }
                            </span>
                          </td>


                          {/* PAYMENT DATE */}

                          <td>
                            <span className="payment-date">
                              <CalendarDays
                                size={15}
                              />

                              {formatDate(
                                payment.paymentDate
                              )}
                            </span>
                          </td>


                          {/* DUE DATE */}

                          <td>
                            <div
                              className={`payment-due-date ${
                                overdue
                                  ? "overdue"
                                  : dueToday
                                  ? "today"
                                  : ""
                              }`}
                            >

                              <CalendarDays
                                size={15}
                              />

                              <div>
                                <span>
                                  {formatDate(
                                    payment.dueDate
                                  )}
                                </span>

                                {overdue && (
                                  <small>
                                    Overdue
                                  </small>
                                )}

                                {dueToday && (
                                  <small>
                                    Due today
                                  </small>
                                )}
                              </div>

                            </div>
                          </td>


                          {/* STATUS */}

                          <td>
                            <span
                              className={`payment-status ${
                                payment.status
                                  ?.toLowerCase()
                              }`}
                            >

                              {payment.status ===
                                "Paid" && (
                                <CheckCircle2
                                  size={14}
                                />
                              )}

                              {payment.status ===
                                "Pending" && (
                                <Clock3
                                  size={14}
                                />
                              )}

                              {payment.status ===
                                "Partial" && (
                                <AlertCircle
                                  size={14}
                                />
                              )}

                              {payment.status}

                            </span>
                          </td>


                          {/* REFERENCE */}

                          <td>
                            <span className="payment-reference">
                              {payment.reference ||
                                "—"}
                            </span>
                          </td>


                          {/* ACTIONS */}

                          <td>
                            <div className="payment-actions">

                              <button
                                className="table-action edit"
                                onClick={() =>
                                  openEditModal(
                                    payment
                                  )
                                }
                                title="Edit payment"
                              >
                                <Pencil
                                  size={16}
                                />
                              </button>


                              <button
                                className="table-action delete"
                                onClick={() =>
                                  handleDelete(
                                    payment
                                  )
                                }
                                title="Delete payment"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>


        {/* ========================= */}
        {/* PAYMENT MODAL */}
        {/* ========================= */}

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

            <div className="payment-modal">

              {/* MODAL HEADER */}

              <div className="modal-header">

                <div>
                  <span className="modal-eyebrow">
                    TRANSACTION
                  </span>

                  <h2>
                    {editingPayment
                      ? "Edit Payment"
                      : "Record Payment"}
                  </h2>

                  <p>
                    Add a membership
                    payment for a gym
                    member.
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={
                    closeModal
                  }
                >
                  <X size={19} />
                </button>

              </div>


              <form
                className="payment-form"
                onSubmit={
                  handleSubmit
                }
              >

                {/* ========================= */}
                {/* MEMBER */}
                {/* ========================= */}

                <div className="form-section">

                  <div className="form-section-title">
                    <UserRound
                      size={17}
                    />

                    Member Information
                  </div>


                  <div className="form-grid">

                    <div className="form-field full">

                      <label>
                        Member
                        <span>*</span>
                      </label>

                      <select
                        name="member"
                        value={
                          form.member
                        }
                        onChange={
                          handleChange
                        }
                        required
                      >

                        <option value="">
                          Select member
                        </option>

                        {members.map(
                          (member) => (
                            <option
                              key={
                                member._id
                              }
                              value={
                                member._id
                              }
                            >
                              {
                                member.name
                              }{" "}
                              —{" "}
                              {
                                member.memberId
                              }
                            </option>
                          )
                        )}

                      </select>

                    </div>


                    <div className="form-field full">

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
                      >

                        <option value="">
                          No plan
                        </option>

                        {plans
                          .filter(
                            (plan) =>
                              plan.status ===
                              "Active"
                          )
                          .map(
                            (plan) => (
                              <option
                                key={
                                  plan._id
                                }
                                value={
                                  plan._id
                                }
                              >
                                {
                                  plan.name
                                }{" "}
                                —{" "}
                                {formatCurrency(
                                  plan.price
                                )}
                              </option>
                            )
                          )}

                      </select>

                    </div>

                  </div>

                </div>


                {/* ========================= */}
                {/* PAYMENT DETAILS */}
                {/* ========================= */}

                <div className="form-section">

                  <div className="form-section-title">

                    <CreditCard
                      size={17}
                    />

                    Payment Details

                  </div>


                  <div className="form-grid">

                    {/* AMOUNT */}

                    <div className="form-field">

                      <label>
                        Amount
                        <span>*</span>
                      </label>

                      <div className="input-with-prefix">

                        <span>
                          PKR
                        </span>

                        <input
                          type="number"
                          name="amount"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={
                            form.amount
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />

                      </div>

                    </div>


                    {/* PAYMENT DATE */}

                    <div className="form-field">

                      <label>
                        Payment Date
                      </label>

                      <input
                        type="date"
                        name="paymentDate"
                        value={
                          form.paymentDate
                        }
                        onChange={
                          handleChange
                        }
                      />

                    </div>


                    {/* DUE DATE */}

                    <div className="form-field">

                      <label>
                        Due Date
                        <span>*</span>
                      </label>

                      <div className="input-with-icon">

                        <CalendarDays
                          size={16}
                        />

                        <input
                          type="date"
                          name="dueDate"
                          value={
                            form.dueDate
                          }
                          onChange={
                            handleChange
                          }
                          required
                        />

                      </div>

                      <small className="field-hint">
                        Used for overdue tracking and WhatsApp reminders.
                      </small>

                    </div>


                    {/* PAYMENT METHOD */}

                    <div className="form-field">

                      <label>
                        Payment Method
                      </label>

                      <select
                        name="paymentMethod"
                        value={
                          form.paymentMethod
                        }
                        onChange={
                          handleChange
                        }
                      >

                        <option value="Cash">
                          Cash
                        </option>

                        <option value="Bank Transfer">
                          Bank Transfer
                        </option>

                        <option value="Card">
                          Card
                        </option>

                        <option value="JazzCash">
                          JazzCash
                        </option>

                        <option value="Easypaisa">
                          Easypaisa
                        </option>

                        <option value="Other">
                          Other
                        </option>

                      </select>

                    </div>


                    {/* STATUS */}

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

                        <option value="Paid">
                          Paid
                        </option>

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Partial">
                          Partial
                        </option>

                        <option value="Refunded">
                          Refunded
                        </option>

                      </select>

                    </div>


                    {/* REFERENCE */}

                    <div className="form-field">

                      <label>
                        Reference
                      </label>

                      <input
                        type="text"
                        name="reference"
                        placeholder="e.g. TXN-10023"
                        value={
                          form.reference
                        }
                        onChange={
                          handleChange
                        }
                      />

                    </div>

                  </div>

                </div>


                {/* ========================= */}
                {/* PLAN PREVIEW */}
                {/* ========================= */}

                {selectedPlan && (
                  <div className="payment-plan-preview">

                    <div className="payment-plan-preview-icon">
                      <CreditCard
                        size={20}
                      />
                    </div>

                    <div>

                      <span>
                        Selected Plan
                      </span>

                      <strong>
                        {
                          selectedPlan.name
                        }
                      </strong>

                      <small>
                        {
                          selectedPlan.duration
                        }{" "}
                        days ·{" "}
                        {formatCurrency(
                          selectedPlan.price
                        )}
                      </small>

                    </div>

                  </div>
                )}


                {/* ========================= */}
                {/* NOTES */}
                {/* ========================= */}

                <div className="form-section">

                  <div className="form-section-title">
                    Notes
                  </div>

                  <div className="form-field full">

                    <textarea
                      name="notes"
                      rows="4"
                      placeholder="Add any payment notes..."
                      value={
                        form.notes
                      }
                      onChange={
                        handleChange
                      }
                    />

                  </div>

                </div>


                {/* ========================= */}
                {/* FOOTER */}
                {/* ========================= */}

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
                      : editingPayment
                      ? "Update Payment"
                      : "Record Payment"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}