import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  UserCheck,
  AlertTriangle,
  Receipt,
} from "lucide-react";

import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { apiRequest } from "../../services/api";

export default function Reports() {
  const today = new Date();

  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const formatDateInput = (
    date
  ) => {
    return date
      .toISOString()
      .split("T")[0];
  };

  const [startDate, setStartDate] =
    useState(
      formatDateInput(firstDay)
    );

  const [endDate, setEndDate] =
    useState(
      formatDateInput(today)
    );

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);

      const response =
        await apiRequest(
          `/reports?startDate=${startDate}&endDate=${endDate}`
        );

      setReport(
        response.data
      );
    } catch (error) {
      console.error(
        "Reports loading error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Reports error",
        text:
          error.message ||
          "Unable to load reports.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatCurrency = (
    amount = 0
  ) => {
    return new Intl.NumberFormat(
      "en-PK",
      {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
      }
    ).format(amount);
  };

  const formatCompactCurrency = (
    amount = 0
  ) => {
    if (amount >= 1000000) {
      return `PKR ${(
        amount / 1000000
      ).toFixed(2)}M`;
    }

    if (amount >= 1000) {
      return `PKR ${(
        amount / 1000
      ).toFixed(0)}K`;
    }

    return formatCurrency(
      amount
    );
  };

  const revenue =
    report?.revenue || {};

  const members =
    report?.members || {};

  const attendance =
    report?.attendance || {};

  const outstanding =
    report?.outstanding || {};

  const paymentMethods =
    report?.paymentMethods || [];

  const revenueByMonth =
    revenue.revenueByMonth || [];

  const recentTransactions =
    report?.recentTransactions || [];

  const maxRevenue =
    useMemo(() => {
      return Math.max(
        ...revenueByMonth.map(
          (item) =>
            item.revenue || 0
        ),
        1
      );
    }, [revenueByMonth]);

  const maxPaymentMethod =
    useMemo(() => {
      return Math.max(
        ...paymentMethods.map(
          (item) =>
            item.amount || 0
        ),
        1
      );
    }, [paymentMethods]);

  const handleGenerate = () => {
    loadReports();
  };

  const setThisMonth = () => {
    const now =
      new Date();

    const first =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    setStartDate(
      formatDateInput(first)
    );

    setEndDate(
      formatDateInput(now)
    );
  };

  const setLastMonth = () => {
    const now =
      new Date();

    const first =
      new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

    const last =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        0
      );

    setStartDate(
      formatDateInput(first)
    );

    setEndDate(
      formatDateInput(last)
    );
  };

  const setLast30Days = () => {
    const now =
      new Date();

    const start =
      new Date(now);

    start.setDate(
      start.getDate() - 29
    );

    setStartDate(
      formatDateInput(start)
    );

    setEndDate(
      formatDateInput(now)
    );
  };

  const exportCSV = () => {
    if (
      recentTransactions.length ===
      0
    ) {
      Swal.fire({
        icon: "info",
        title: "No transactions",
        text:
          "There are no transactions to export for this period.",
      });

      return;
    }

    const rows = [
      [
        "Member",
        "Amount",
        "Payment Method",
        "Status",
        "Date",
      ],

      ...recentTransactions.map(
        (item) => [
          item.member,
          item.amount,
          item.method,
          item.status,
          new Date(
            item.date
          ).toLocaleDateString(
            "en-PK"
          ),
        ]
      ),
    ];

    const csv =
      rows
        .map((row) =>
          row
            .map(
              (value) =>
                `"${String(
                  value
                ).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
        )
        .join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `gympilot-report-${startDate}-to-${endDate}.csv`;

    link.click();

    URL.revokeObjectURL(
      url
    );
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Reports"
        subtitle="Analyze your gym's performance."
      >
        <div className="dashboard-loading">
          <Loader2
            size={28}
            className="spin"
          />

          <p>
            Generating reports...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Reports"
      subtitle="Analyze revenue, members, attendance and payments."
    >
      <div className="reports-page">

        {/* HEADER */}

        <div className="reports-header">
          <div>
            <span className="welcome-label">
              BUSINESS INTELLIGENCE
            </span>

            <h2>
              Gym performance reports
            </h2>

            <p>
              Understand how your gym
              is performing across
              revenue, members and
              attendance.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={
              handleGenerate
            }
          >
            <RefreshCw
              size={17}
            />

            Generate Report
          </button>
        </div>

        {/* DATE FILTER */}

        <div className="reports-filter">
          <div className="filter-title">
            <CalendarDays
              size={18}
            />

            <strong>
              Report period
            </strong>
          </div>

          <div className="date-fields">
            <label>
              From

              <input
                type="date"
                value={
                  startDate
                }
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
              />
            </label>

            <label>
              To

              <input
                type="date"
                value={
                  endDate
                }
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
              />
            </label>
          </div>

          <div className="quick-filters">
            <button
              onClick={
                setThisMonth
              }
            >
              This month
            </button>

            <button
              onClick={
                setLastMonth
              }
            >
              Last month
            </button>

            <button
              onClick={
                setLast30Days
              }
            >
              Last 30 days
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS */}

        <div className="stats-grid reports-stats">

          <ReportStat
            title="Revenue"
            value={formatCompactCurrency(
              revenue.total
            )}
            description={`${revenue.paidTransactions || 0} paid transactions`}
            icon={TrendingUp}
          />

          <ReportStat
            title="Active Members"
            value={
              members.active ||
              0
            }
            description={`${members.new || 0} new in this period`}
            icon={Users}
          />

          <ReportStat
            title="Attendance"
            value={
              attendance.totalCheckIns ||
              0
            }
            description={`${attendance.uniqueAttendees || 0} unique members`}
            icon={UserCheck}
          />

          <ReportStat
            title="Outstanding"
            value={formatCompactCurrency(
              outstanding.amount
            )}
            description={`${outstanding.count || 0} unpaid payments`}
            icon={CreditCard}
          />

        </div>

        {/* MAIN GRID */}

        <div className="reports-grid">

          {/* REVENUE */}

          <div className="dashboard-panel report-panel">

            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">
                  REVENUE
                </span>

                <h3>
                  Revenue by month
                </h3>
              </div>

              <TrendingUp
                size={20}
              />
            </div>

            {revenueByMonth.length ===
            0 ? (
              <div className="report-empty">
                No revenue recorded
                during this period.
              </div>
            ) : (
              <div className="report-chart">

                {revenueByMonth.map(
                  (
                    item,
                    index
                  ) => {
                    const height =
                      Math.max(
                        (item.revenue /
                          maxRevenue) *
                          100,
                        item.revenue >
                          0
                          ? 5
                          : 0
                      );

                    return (
                      <div
                        className="report-chart-column"
                        key={`${item.month}-${item.year}-${index}`}
                      >
                        <strong>
                          {formatCompactCurrency(
                            item.revenue
                          )}
                        </strong>

                        <div className="report-chart-track">
                          <div
                            className="report-chart-bar"
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <span>
                          {
                            item.month
                          }
                        </span>
                      </div>
                    );
                  }
                )}

              </div>
            )}
          </div>

          {/* PAYMENT METHODS */}

          <div className="dashboard-panel report-panel">

            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">
                  PAYMENTS
                </span>

                <h3>
                  Payment methods
                </h3>
              </div>

              <CreditCard
                size={20}
              />
            </div>

            {paymentMethods.length ===
            0 ? (
              <div className="report-empty">
                No paid transactions
                during this period.
              </div>
            ) : (
              <div className="method-list">

                {paymentMethods.map(
                  (item) => (
                    <div
                      className="method-row"
                      key={
                        item.method
                      }
                    >
                      <div className="method-info">
                        <strong>
                          {
                            item.method
                          }
                        </strong>

                        <span>
                          {formatCurrency(
                            item.amount
                          )}
                        </span>
                      </div>

                      <div className="method-track">
                        <div
                          className="method-fill"
                          style={{
                            width: `${Math.max(
                              (item.amount /
                                maxPaymentMethod) *
                                100,
                              4
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}

              </div>
            )}
          </div>

        </div>

        {/* MEMBER + ATTENDANCE */}

        <div className="reports-grid">

          <div className="dashboard-panel report-panel">

            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">
                  MEMBERS
                </span>

                <h3>
                  Member overview
                </h3>
              </div>

              <Users
                size={20}
              />
            </div>

            <div className="member-report-grid">

              <ReportMini
                label="Total"
                value={
                  members.total ||
                  0
                }
              />

              <ReportMini
                label="Active"
                value={
                  members.active ||
                  0
                }
              />

              <ReportMini
                label="Expired"
                value={
                  members.expired ||
                  0
                }
              />

              <ReportMini
                label="Suspended"
                value={
                  members.suspended ||
                  0
                }
              />

              <ReportMini
                label="Inactive"
                value={
                  members.inactive ||
                  0
                }
              />

              <ReportMini
                label="New"
                value={
                  members.new ||
                  0
                }
              />

            </div>
          </div>

          <div className="dashboard-panel report-panel">

            <div className="panel-header">
              <div>
                <span className="panel-eyebrow">
                  ATTENDANCE
                </span>

                <h3>
                  Attendance overview
                </h3>
              </div>

              <UserCheck
                size={20}
              />
            </div>

            <div className="attendance-summary">

              <div>
                <span>
                  Total check-ins
                </span>

                <strong>
                  {
                    attendance.totalCheckIns ||
                    0
                  }
                </strong>
              </div>

              <div>
                <span>
                  Unique members
                </span>

                <strong>
                  {
                    attendance.uniqueAttendees ||
                    0
                  }
                </strong>
              </div>

              <div>
                <span>
                  Average / active day
                </span>

                <strong>
                  {
                    attendance.averageDailyAttendance ||
                    0
                  }
                </strong>
              </div>

            </div>

            <div className="attendance-days">

              {(
                attendance.attendanceByDay ||
                []
              )
                .slice(-10)
                .map(
                  (item) => (
                    <div
                      className="attendance-day"
                      key={
                        item.date
                      }
                    >
                      <span>
                        {new Date(
                          `${item.date}T00:00:00`
                        ).toLocaleDateString(
                          "en-US",
                          {
                            weekday:
                              "short",
                          }
                        )}
                      </span>

                      <strong>
                        {
                          item.count
                        }
                      </strong>
                    </div>
                  )
                )}

            </div>
          </div>

        </div>

        {/* OUTSTANDING */}

        <div className="dashboard-panel report-panel">

          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                COLLECTIONS
              </span>

              <h3>
                Outstanding payments
              </h3>
            </div>

            <div className="report-header-actions">

              <span className="report-total">
                {formatCompactCurrency(
                  outstanding.amount
                )}
              </span>

            </div>
          </div>

          {(
            outstanding.payments ||
            []
          ).length === 0 ? (
            <div className="report-empty">
              <CreditCard
                size={24}
              />

              <strong>
                No outstanding
                payments
              </strong>

              <span>
                Your current
                outstanding balance
                is clear.
              </span>
            </div>
          ) : (
            <div className="report-table">

              <div className="report-table-row report-table-heading">
                <span>
                  MEMBER
                </span>

                <span>
                  AMOUNT
                </span>

                <span>
                  DUE DATE
                </span>

                <span>
                  STATUS
                </span>
              </div>

              {outstanding.payments
                .slice(0, 10)
                .map(
                  (payment) => (
                    <div
                      className="report-table-row"
                      key={
                        payment._id
                      }
                    >
                      <strong>
                        {payment
                          .member
                          ?.name ||
                          "Unknown"}
                      </strong>

                      <span>
                        {formatCurrency(
                          payment.amount
                        )}
                      </span>

                      <span>
                        {payment.dueDate
                          ? new Date(
                              payment.dueDate
                            ).toLocaleDateString(
                              "en-PK"
                            )
                          : "—"}
                      </span>

                      <span className="status-pill">
                        {
                          payment.status
                        }
                      </span>
                    </div>
                  )
                )}

            </div>
          )}

        </div>

        {/* RECENT TRANSACTIONS */}

        <div className="dashboard-panel report-panel">

          <div className="panel-header">

            <div>
              <span className="panel-eyebrow">
                TRANSACTIONS
              </span>

              <h3>
                Recent payments
              </h3>
            </div>

            <button
              className="text-button"
              onClick={
                exportCSV
              }
            >
              <Download
                size={16}
              />

              Export CSV
            </button>

          </div>

          {recentTransactions.length ===
          0 ? (
            <div className="report-empty">
              No transactions in this
              period.
            </div>
          ) : (
            <div className="report-table">

              <div className="report-table-row report-table-heading">
                <span>
                  MEMBER
                </span>

                <span>
                  AMOUNT
                </span>

                <span>
                  METHOD
                </span>

                <span>
                  STATUS
                </span>

                <span>
                  DATE
                </span>
              </div>

              {recentTransactions
                .map(
                  (item) => (
                    <div
                      className="report-table-row five-columns"
                      key={
                        item.id
                      }
                    >
                      <strong>
                        {
                          item.member
                        }
                      </strong>

                      <span>
                        {formatCurrency(
                          item.amount
                        )}
                      </span>

                      <span>
                        {
                          item.method
                        }
                      </span>

                      <span className="status-pill">
                        {
                          item.status
                        }
                      </span>

                      <span>
                        {new Date(
                          item.date
                        ).toLocaleDateString(
                          "en-PK"
                        )}
                      </span>
                    </div>
                  )
                )}

            </div>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}

/* ==========================================================================
   SMALL COMPONENTS
========================================================================== */

function ReportStat({
  title,
  value,
  description,
  icon: Icon,
}) {
  return (
    <div className="report-stat-card">

      <div className="report-stat-icon">
        <Icon size={20} />
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {description}
        </small>
      </div>

    </div>
  );
}

function ReportMini({
  label,
  value,
}) {
  return (
    <div className="report-mini">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}