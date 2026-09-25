import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  X,
  Loader2,
  CalendarDays,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from "lucide-react";
import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { apiRequest } from "../../services/api";

const categories = [
  "Rent",
  "Utilities",
  "Salaries",
  "Equipment",
  "Maintenance",
  "Marketing",
  "Supplies",
  "Software",
  "Other",
];

const paymentMethods = [
  "Cash",
  "Bank Transfer",
  "Card",
  "JazzCash",
  "Easypaisa",
  "Other",
];

const getToday = () => {
  const date = new Date();
  return date.toISOString().split("T")[0];
};

const getMonthStart = () => {
  const date = new Date();
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  )
    .toISOString()
    .split("T")[0];
};

const formatMoney = (amount) => {
  return `PKR ${Number(amount || 0).toLocaleString()}`;
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const emptyForm = {
  category: "Other",
  amount: "",
  paymentMethod: "Cash",
  expenseDate: getToday(),
  description: "",
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    expenseCount: 0,
    categoryBreakdown: [],
    monthlyExpenses: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [editingExpense, setEditingExpense] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [startDate, setStartDate] =
    useState(getMonthStart());

  const [endDate, setEndDate] =
    useState(getToday());

  const [revenue, setRevenue] =
    useState(0);

  /* =========================
     LOAD DATA
  ========================= */

const loadData = async () => {
  try {
    setLoading(true);

    const query = new URLSearchParams({
      startDate,
      endDate,
    });

    /* =========================
       LOAD EXPENSE DATA
    ========================= */

    const [expenseResponse, summaryResponse] =
      await Promise.all([
        apiRequest(
          `/expenses?${query.toString()}`
        ),
        apiRequest(
          `/expenses/summary?${query.toString()}`
        ),
      ]);

    setExpenses(
      Array.isArray(expenseResponse.data)
        ? expenseResponse.data
        : expenseResponse.data?.expenses || []
    );

    setSummary(
      summaryResponse.data || {
        totalExpenses: 0,
        expenseCount: 0,
        categoryBreakdown: [],
        monthlyExpenses: [],
      }
    );

    /* =========================
       LOAD REVENUE
    ========================= */

    try {
      const reportResponse = await apiRequest(
        `/reports?${query.toString()}`
      );

      const reportData =
        reportResponse?.data || {};

      /*
       * Support the different possible
       * report response structures.
       */
      const reportRevenue =
        Number(
          reportData.totalRevenue
        ) ||
        Number(
          reportData.revenue
        ) ||
        Number(
          reportData.summary?.totalRevenue
        ) ||
        Number(
          reportData.summary?.revenue
        ) ||
        Number(
          reportData.overview?.totalRevenue
        ) ||
        Number(
          reportData.overview?.revenue
        ) ||
        0;

      if (reportRevenue > 0) {
        setRevenue(reportRevenue);
        return;
      }

      /* =========================
         FALLBACK TO PAYMENTS
      ========================= */

      const paymentResponse =
        await apiRequest(
          `/payments?${query.toString()}`
        );

      /*
       * Different APIs may return:
       *
       * data: [...]
       * data: { payments: [...] }
       * payments: [...]
       * data: { transactions: [...] }
       */

      const paymentData =
        paymentResponse?.data;

      let payments = [];

      if (Array.isArray(paymentData)) {
        payments = paymentData;
      } else if (
        Array.isArray(
          paymentData?.payments
        )
      ) {
        payments =
          paymentData.payments;
      } else if (
        Array.isArray(
          paymentData?.transactions
        )
      ) {
        payments =
          paymentData.transactions;
      } else if (
        Array.isArray(
          paymentResponse?.payments
        )
      ) {
        payments =
          paymentResponse.payments;
      } else if (
        Array.isArray(
          paymentResponse?.transactions
        )
      ) {
        payments =
          paymentResponse.transactions;
      }

      const paidRevenue =
        payments.reduce(
          (total, payment) => {
            if (
              payment.status === "Paid"
            ) {
              return (
                total +
                Number(
                  payment.amount || 0
                )
              );
            }

            return total;
          },
          0
        );

      setRevenue(paidRevenue);
    } catch (revenueError) {
      console.error(
        "Revenue load error:",
        revenueError
      );

      setRevenue(0);
    }
  } catch (error) {
    console.error(
      "Expenses load error:",
      error
    );

    Swal.fire({
      icon: "error",
      title: "Unable to load expenses",
      text: error.message,
    });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  /* =========================
     FORM HANDLING
  ========================= */

  const openAddModal = () => {
    setEditingExpense(null);
    setForm({
      ...emptyForm,
      expenseDate: getToday(),
    });
    setShowModal(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);

    setForm({
      category:
        expense.category || "Other",

      amount:
        expense.amount ?? "",

      paymentMethod:
        expense.paymentMethod || "Cash",

      expenseDate: expense.expenseDate
        ? new Date(expense.expenseDate)
            .toISOString()
            .split("T")[0]
        : getToday(),

      description:
        expense.description || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingExpense(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.amount ||
      Number(form.amount) < 0
    ) {
      Swal.fire({
        icon: "warning",
        title: "Invalid amount",
        text: "Please enter a valid expense amount.",
      });

      return;
    }

    try {
      setSaving(true);

      const payload = {
        category: form.category,
        amount: Number(form.amount),
        paymentMethod:
          form.paymentMethod,
        expenseDate: form.expenseDate,
        description: form.description,
      };

      if (editingExpense) {
        await apiRequest(
          `/expenses/${editingExpense._id}`,
          {
            method: "PUT",
            body: payload,
          }
        );
      } else {
        await apiRequest("/expenses", {
          method: "POST",
          body: payload,
        });
      }

      await loadData();

      closeModal();

      Swal.fire({
        icon: "success",
        title: editingExpense
          ? "Expense updated"
          : "Expense added",
        text: editingExpense
          ? "The expense has been updated successfully."
          : "The expense has been added successfully.",
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     DELETE
  ========================= */

  const deleteExpense = async (
    expense
  ) => {
    const result =
      await Swal.fire({
        icon: "warning",
        title: "Delete expense?",
        text: `This will permanently remove ${formatMoney(
          expense.amount
        )} from your expenses.`,
        showCancelButton: true,
        confirmButtonText:
          "Yes, delete it",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#dc2626",
      });

    if (!result.isConfirmed) return;

    try {
      await apiRequest(
        `/expenses/${expense._id}`,
        {
          method: "DELETE",
        }
      );

      await loadData();

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Expense deleted successfully.",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.message,
      });
    }
  };

  /* =========================
     FILTER
  ========================= */

  const filteredExpenses = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        !term ||
        expense.description
          ?.toLowerCase()
          .includes(term) ||
        expense.category
          ?.toLowerCase()
          .includes(term) ||
        expense.paymentMethod
          ?.toLowerCase()
          .includes(term);

      const matchesCategory =
        categoryFilter === "All" ||
        expense.category ===
          categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    expenses,
    search,
    categoryFilter,
  ]);

  /* =========================
     PROFIT
  ========================= */

  const totalExpenses =
    Number(summary.totalExpenses || 0);

  const netProfit =
    Number(revenue || 0) -
    totalExpenses;

  const profitMargin =
    Number(revenue || 0) > 0
      ? (netProfit / revenue) * 100
      : 0;

  /* =========================
     CSV EXPORT
  ========================= */

  const exportCSV = () => {
    if (!filteredExpenses.length) {
      Swal.fire({
        icon: "info",
        title: "Nothing to export",
        text: "There are no expenses in the current filter.",
      });

      return;
    }

    const headers = [
      "Date",
      "Category",
      "Amount",
      "Payment Method",
      "Description",
    ];

    const rows = filteredExpenses.map(
      (expense) => [
        formatDate(
          expense.expenseDate
        ),
        expense.category,
        expense.amount,
        expense.paymentMethod,
        `"${(
          expense.description || ""
        ).replaceAll('"', '""')}"`,
      ]
    );

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = `gympilot-expenses-${startDate}-${endDate}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="expenses-page">
        {/* =========================
            HEADER
        ========================= */}

        <div className="page-header">
          <div>
            <h1>Expenses & Profit</h1>

            <p>
              Track gym expenses and
              understand your real
              profitability.
            </p>
          </div>

          <div className="page-header-actions">
            <button
              className="secondary-button"
              onClick={exportCSV}
            >
              <Download size={18} />
              Export
            </button>

            <button
              className="primary-button"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Add Expense
            </button>
          </div>
        </div>

        {/* =========================
            DATE FILTER
        ========================= */}

        <div className="expenses-filter-bar">
          <div className="filter-date">
            <CalendarDays size={17} />

            <div>
              <span>From</span>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <div className="filter-date">
            <CalendarDays size={17} />

            <div>
              <span>To</span>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          <button
            className="date-reset-button"
            onClick={() => {
              setStartDate(
                getMonthStart()
              );
              setEndDate(getToday());
            }}
          >
            This Month
          </button>
        </div>

        {/* =========================
            PROFIT CARDS
        ========================= */}

        <div className="profit-grid">
          <div className="profit-card revenue-card">
            <div className="profit-card-icon">
              <TrendingUp size={21} />
            </div>

            <div>
              <span>Total Revenue</span>

              <strong>
                {formatMoney(revenue)}
              </strong>

              <small>
                Paid memberships
              </small>
            </div>

            <ArrowUpRight
              className="profit-card-arrow"
              size={20}
            />
          </div>

          <div className="profit-card expense-card">
            <div className="profit-card-icon">
              <TrendingDown size={21} />
            </div>

            <div>
              <span>Total Expenses</span>

              <strong>
                {formatMoney(
                  totalExpenses
                )}
              </strong>

              <small>
                {summary.expenseCount}{" "}
                transactions
              </small>
            </div>

            <ArrowDownRight
              className="profit-card-arrow"
              size={20}
            />
          </div>

          <div
            className={`profit-card ${
              netProfit >= 0
                ? "profit-positive"
                : "profit-negative"
            }`}
          >
            <div className="profit-card-icon">
              <Wallet size={21} />
            </div>

            <div>
              <span>Net Profit</span>

              <strong>
                {formatMoney(netProfit)}
              </strong>

              <small>
                Revenue − Expenses
              </small>
            </div>

            {netProfit >= 0 ? (
              <ArrowUpRight
                className="profit-card-arrow"
                size={20}
              />
            ) : (
              <ArrowDownRight
                className="profit-card-arrow"
                size={20}
              />
            )}
          </div>

          <div className="profit-card margin-card">
            <div className="profit-card-icon">
              <PieChart size={21} />
            </div>

            <div>
              <span>Profit Margin</span>

              <strong>
                {profitMargin.toFixed(1)}%
              </strong>

              <small>
                Net profit percentage
              </small>
            </div>
          </div>
        </div>

        {/* =========================
            ANALYTICS
        ========================= */}

        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-card-header">
              <div>
                <h3>Expense Breakdown</h3>

                <p>
                  Where your money is going
                </p>
              </div>

              <PieChart size={20} />
            </div>

            {summary.categoryBreakdown
              ?.length ? (
              <div className="category-list">
                {summary.categoryBreakdown.map(
                  (item) => {
                    const percentage =
                      totalExpenses > 0
                        ? (Number(
                            item.total
                          ) /
                            totalExpenses) *
                          100
                        : 0;

                    return (
                      <div
                        className="category-row"
                        key={item._id}
                      >
                        <div className="category-row-top">
                          <span>
                            {item._id}
                          </span>

                          <strong>
                            {formatMoney(
                              item.total
                            )}
                          </strong>
                        </div>

                        <div className="category-progress">
                          <div
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <small>
                          {percentage.toFixed(
                            1
                          )}
                          %
                        </small>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="empty-analytics">
                <PieChart size={30} />

                <p>
                  No expenses recorded
                  for this period.
                </p>
              </div>
            )}
          </div>

          <div className="analytics-card">
            <div className="analytics-card-header">
              <div>
                <h3>Financial Overview</h3>

                <p>
                  Revenue versus expenses
                </p>
              </div>

              <TrendingUp size={20} />
            </div>

            <div className="financial-overview">
              <div className="financial-row">
                <span>
                  <i className="revenue-dot" />
                  Revenue
                </span>

                <strong>
                  {formatMoney(revenue)}
                </strong>
              </div>

              <div className="financial-row">
                <span>
                  <i className="expense-dot" />
                  Expenses
                </span>

                <strong>
                  {formatMoney(
                    totalExpenses
                  )}
                </strong>
              </div>

              <div className="financial-divider" />

              <div className="financial-row total">
                <span>Net Profit</span>

                <strong
                  className={
                    netProfit >= 0
                      ? "text-positive"
                      : "text-negative"
                  }
                >
                  {formatMoney(netProfit)}
                </strong>
              </div>

              <div className="profit-meter">
                <div
                  className="profit-meter-fill"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        profitMargin,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="profit-meter-labels">
                <span>0%</span>

                <span>
                  {profitMargin.toFixed(
                    1
                  )}
                  % margin
                </span>

                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================
            EXPENSE TABLE
        ========================= */}

        <div className="expenses-table-card">
          <div className="table-header">
            <div>
              <h3>Expense Transactions</h3>

              <p>
                {filteredExpenses.length}{" "}
                transactions found
              </p>
            </div>

            <div className="table-tools">
              <div className="search-box">
                <Search size={17} />

                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(
                    e.target.value
                  )
                }
              >
                <option value="All">
                  All Categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="expenses-loading">
              <Loader2
                size={28}
                className="spin"
              />

              <span>
                Loading expenses...
              </span>
            </div>
          ) : filteredExpenses.length ===
            0 ? (
            <div className="expenses-empty">
              <div className="empty-icon">
                <Receipt size={28} />
              </div>

              <h3>
                No expenses found
              </h3>

              <p>
                Add your first gym expense
                to start tracking
                profitability.
              </p>

              <button
                className="primary-button"
                onClick={openAddModal}
              >
                <Plus size={17} />
                Add Expense
              </button>
            </div>
          ) : (
            <div className="expenses-table-wrapper">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredExpenses.map(
                    (expense) => (
                      <tr
                        key={expense._id}
                      >
                        <td>
                          <span className="date-cell">
                            {formatDate(
                              expense.expenseDate
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="category-badge">
                            {expense.category}
                          </span>
                        </td>

                        <td>
                          <span className="description-cell">
                            {expense.description ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <span className="payment-method-cell">
                            {
                              expense.paymentMethod
                            }
                          </span>
                        </td>

                        <td>
                          <strong className="amount-cell">
                            {formatMoney(
                              expense.amount
                            )}
                          </strong>
                        </td>

                        <td>
                          <div className="row-actions">
                            <button
                              title="Edit"
                              onClick={() =>
                                openEditModal(
                                  expense
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <button
                              title="Delete"
                              className="delete-action"
                              onClick={() =>
                                deleteExpense(
                                  expense
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =========================
            ADD / EDIT MODAL
        ========================= */}

        {showModal && (
          <div
            className="modal-overlay"
            onMouseDown={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <div className="expense-modal">
              <div className="modal-header">
                <div>
                  <h2>
                    {editingExpense
                      ? "Edit Expense"
                      : "Add Expense"}
                  </h2>

                  <p>
                    Record a gym business
                    expense.
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
                onSubmit={handleSubmit}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      Category
                    </label>

                    <select
                      name="category"
                      value={
                        form.category
                      }
                      onChange={
                        handleChange
                      }
                    >
                      {categories.map(
                        (category) => (
                          <option
                            key={category}
                            value={category}
                          >
                            {category}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Amount
                    </label>

                    <div className="input-with-prefix">
                      <span>PKR</span>

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

                  <div className="form-group">
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
                      {paymentMethods.map(
                        (method) => (
                          <option
                            key={method}
                            value={method}
                          >
                            {method}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Expense Date
                    </label>

                    <input
                      type="date"
                      name="expenseDate"
                      value={
                        form.expenseDate
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      rows="4"
                      placeholder="e.g. Monthly gym rent..."
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="cancel-button"
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
                    {saving ? (
                      <>
                        <Loader2
                          size={17}
                          className="spin"
                        />

                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus size={17} />

                        {editingExpense
                          ? "Update Expense"
                          : "Save Expense"}
                      </>
                    )}
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