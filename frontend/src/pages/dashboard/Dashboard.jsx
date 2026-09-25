import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Users,
  UserCheck,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Clock3,
  ArrowUpRight,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import DashboardLayout from "../../components/layout/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import { apiRequest } from "../../services/api";

export default function Dashboard() {
  const navigate = useNavigate();

  const gym = JSON.parse(
    localStorage.getItem(
      "gympilot_gym"
    ) || "{}"
  );

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const response =
        await apiRequest(
          "/dashboard"
        );

      setDashboard(
        response.data
      );
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      Swal.fire({
        icon: "error",
        title: "Dashboard error",
        text:
          error.message ||
          "Unable to load dashboard data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleAddMember = () => {
    navigate("/members?add=true");
  };

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

    return formatCurrency(amount);
  };

  const formatRelativeTime = (
    date
  ) => {
    if (!date) return "—";

    const now = new Date();

    const then = new Date(date);

    const seconds = Math.floor(
      (now - then) / 1000
    );

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(
      seconds / 60
    );

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours} hour${
        hours === 1 ? "" : "s"
      } ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  };

  const stats =
    dashboard?.stats || {
      activeMembers: 0,
      todayCheckIns: 0,
      monthlyRevenue: 0,
      outstanding: 0,
      overduePayments: 0,
      expiringMemberships: 0,
      inactiveMembers: 0,
    };

  const revenueOverview =
    dashboard?.revenueOverview ||
    [];

  const recentActivity =
    dashboard?.recentActivity ||
    [];

  const maxRevenue = useMemo(() => {
    return Math.max(
      ...revenueOverview.map(
        (item) =>
          item.revenue || 0
      ),
      1
    );
  }, [revenueOverview]);

  if (loading) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle={`Welcome back. Here's what's happening at ${
          gym.name ||
          "your gym"
        }.`}
      >
        <div className="dashboard-loading">
          <Loader2
            size={28}
            className="spin"
          />

          <p>
            Loading your dashboard...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome back. Here's what's happening at ${
        gym.name ||
        "your gym"
      }.`}
    >
      <div className="dashboard-welcome">
        <div>
          <span className="welcome-label">
            OVERVIEW
          </span>

          <h2>
            Your gym at a glance
          </h2>

          <p>
            Monitor members, revenue,
            attendance and memberships
            from one place.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={
            handleAddMember
          }
        >
          + Add Member
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Active Members"
          value={
            stats.activeMembers.toLocaleString()
          }
          icon={Users}
          description="currently active"
        />

        <StatCard
          title="Today's Check-ins"
          value={
            stats.todayCheckIns.toLocaleString()
          }
          icon={UserCheck}
          description="members checked in today"
        />

        <StatCard
          title="Monthly Revenue"
          value={formatCompactCurrency(
            stats.monthlyRevenue
          )}
          icon={TrendingUp}
          description="paid this month"
        />

        <StatCard
          title="Outstanding"
          value={formatCompactCurrency(
            stats.outstanding
          )}
          icon={CreditCard}
          description={`${stats.overduePayments} overdue payment${
            stats.overduePayments ===
            1
              ? ""
              : "s"
          }`}
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel revenue-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                REVENUE
              </span>

              <h3>
                Revenue overview
              </h3>
            </div>

            <button className="period-button">
              Last 7 months
              <MoreHorizontal
                size={17}
              />
            </button>
          </div>

          <div className="fake-chart">
            <div className="chart-value">
              {formatCompactCurrency(
                stats.monthlyRevenue
              )}
            </div>

            <div className="chart-bars">
              {revenueOverview.map(
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
                      className="chart-column"
                      key={`${item.month}-${index}`}
                    >
                      <div
                        className="chart-bar"
                        style={{
                          height: `${height}%`,
                        }}
                        title={`${item.month}: ${formatCurrency(
                          item.revenue
                        )}`}
                      />

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
          </div>
        </div>

        <div className="dashboard-panel alerts-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">
                ATTENTION
              </span>

              <h3>
                Needs attention
              </h3>
            </div>

            <button
              className="text-button"
              onClick={() =>
                navigate(
                  "/members"
                )
              }
            >
              View all
              <ArrowUpRight
                size={16}
              />
            </button>
          </div>

          <div className="alert-list">
            <div className="alert-item warning">
              <div className="alert-icon">
                <Clock3
                  size={18}
                />
              </div>

              <div>
                <strong>
                  {
                    stats.expiringMemberships
                  }{" "}
                  membership
                  {stats.expiringMemberships ===
                  1
                    ? ""
                    : "s"}{" "}
                  expiring
                </strong>

                <p>
                  Within the next
                  7 days
                </p>
              </div>

              <ArrowUpRight
                size={17}
              />
            </div>

            <div className="alert-item danger">
              <div className="alert-icon">
                <AlertTriangle
                  size={18}
                />
              </div>

              <div>
                <strong>
                  {
                    stats.overduePayments
                  }{" "}
                  overdue payment
                  {stats.overduePayments ===
                  1
                    ? ""
                    : "s"}
                </strong>

                <p>
                  Outstanding:{" "}
                  {formatCompactCurrency(
                    stats.outstanding
                  )}
                </p>
              </div>

              <ArrowUpRight
                size={17}
              />
            </div>

            <div className="alert-item">
              <div className="alert-icon">
                <Users
                  size={18}
                />
              </div>

              <div>
                <strong>
                  {
                    stats.inactiveMembers
                  }{" "}
                  inactive member
                  {stats.inactiveMembers ===
                  1
                    ? ""
                    : "s"}
                </strong>

                <p>
                  No visit in
                  14+ days
                </p>
              </div>

              <ArrowUpRight
                size={17}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-panel activity-panel">
        <div className="panel-header">
          <div>
            <span className="panel-eyebrow">
              RECENT ACTIVITY
            </span>

            <h3>
              Latest gym activity
            </h3>
          </div>

          <button
            className="text-button"
            onClick={() =>
              navigate(
                "/attendance"
              )
            }
          >
            View activity
            <ArrowUpRight
              size={16}
            />
          </button>
        </div>

        <div className="activity-table">
          <div className="activity-row table-heading">
            <span>
              MEMBER
            </span>

            <span>
              ACTIVITY
            </span>

            <span>
              TIME
            </span>

            <span>
              STATUS
            </span>
          </div>

          {recentActivity.length ===
          0 ? (
            <div className="empty-activity">
              <Users
                size={22}
              />

              <span>
                No activity yet.
              </span>

              <p>
                Member check-ins and
                payments will appear
                here.
              </p>
            </div>
          ) : (
            recentActivity.map(
              (
                item,
                index
              ) => (
                <div
                  className="activity-row"
                  key={`${item.member}-${item.date}-${index}`}
                >
                  <strong>
                    {item.member}
                  </strong>

                  <span>
                    {item.activity}
                  </span>

                  <span>
                    {formatRelativeTime(
                      item.date
                    )}
                  </span>

                  <span className="status-pill">
                    {item.status}
                  </span>
                </div>
              )
            )
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}