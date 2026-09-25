import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
Activity,
CalendarDays,
CheckCircle2,
Clock3,
LogIn,
LogOut,
RefreshCw,
Search,
Trash2,
Users,
X,
History,
BarChart3,
ChevronLeft,
ChevronRight,
UserRound,
TrendingUp,
Timer,
Flame,
CalendarCheck2,
CircleUserRound,
} from "lucide-react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { apiRequest } from "../../services/api";

const today = new Date().toISOString().split("T")[0];

const formatTime = (date) => {
if (!date) return "--";

return new Date(date).toLocaleTimeString([], {
hour: "2-digit",
minute: "2-digit",
});
};

const formatDate = (date) => {
if (!date) return "--";

return new Date(date).toLocaleDateString([], {
day: "2-digit",
month: "short",
year: "numeric",
});
};

const formatDuration = (minutes) => {
const value = Number(minutes || 0);

if (value < 1) return "< 1 min";

const hours = Math.floor(value / 60);
const mins = value % 60;

if (hours === 0) {
return `${mins} min`;
}

if (mins === 0) {
return `${hours}h`;
}

return `${hours}h ${mins}m`;
};

export default function Attendance() {
const [attendance, setAttendance] = useState([]);
const [history, setHistory] = useState([]);
const [members, setMembers] = useState([]);
const [allMembers, setAllMembers] = useState([]);

const [stats, setStats] = useState({
todayTotal: 0,
currentlyInside: 0,
todayCompleted: 0,
totalVisits: 0,
activeMembers: 0,
uniqueVisitors: 0,
});

const [search, setSearch] = useState("");

const [historySearch, setHistorySearch] =
useState("");

const [historyFrom, setHistoryFrom] =
useState("");

const [historyTo, setHistoryTo] =
useState("");

const [historyPage, setHistoryPage] =
useState(1);

const [historyPages, setHistoryPages] =
useState(1);

const [historyTotal, setHistoryTotal] =
useState(0);

const [loading, setLoading] =
useState(true);

const [historyLoading, setHistoryLoading] =
useState(false);

const [actionLoading, setActionLoading] =
useState(false);

const [showCheckInModal, setShowCheckInModal] =
useState(false);

const [selectedMember, setSelectedMember] =
useState("");

const [notes, setNotes] =
useState("");

// =====================================================
// MEMBER ATTENDANCE INSIGHTS
// =====================================================

const [insightMemberId, setInsightMemberId] =
useState("");

const [insightData, setInsightData] =
useState(null);

const [insightLoading, setInsightLoading] =
useState(false);

// =====================================================
// LOAD TODAY'S ATTENDANCE
// =====================================================

const loadAttendance = async () => {
try {
setLoading(true);


  const [todayResponse, statsResponse] =
    await Promise.all([
      apiRequest("/attendance/today"),
      apiRequest("/attendance/stats"),
    ]);

  setAttendance(
    todayResponse.attendance || []
  );

  setStats(
    statsResponse.stats || {
      todayTotal: 0,
      currentlyInside: 0,
      todayCompleted: 0,
      totalVisits: 0,
      activeMembers: 0,
      uniqueVisitors: 0,
    }
  );
} catch (error) {
  console.error(
    "Load attendance error:",
    error
  );

  Swal.fire({
    icon: "error",
    title: "Unable to load attendance",
    text:
      error.message ||
      "Something went wrong while loading attendance.",
  });
} finally {
  setLoading(false);
}


};

// =====================================================
// LOAD ACTIVE MEMBERS
// =====================================================

const loadMembers = async () => {
try {
const response = await apiRequest(
"/members?limit=1000&status=Active"
);


  setMembers(
    response.members || []
  );
} catch (error) {
  console.error(
    "Load members error:",
    error
  );
}


};

// =====================================================
// LOAD ALL MEMBERS FOR INSIGHTS
// =====================================================

const loadAllMembers = async () => {
try {
const response = await apiRequest(
"/members?limit=1000"
);


  setAllMembers(
    response.members || []
  );
} catch (error) {
  console.error(
    "Load all members error:",
    error
  );
}


};

// =====================================================
// LOAD HISTORY
// =====================================================

const loadHistory = async (
requestedPage = historyPage
) => {
try {
setHistoryLoading(true);


  const params = new URLSearchParams();

  params.set(
    "page",
    requestedPage
  );

  params.set(
    "limit",
    "20"
  );

  if (historyFrom) {
    params.set(
      "from",
      historyFrom
    );
  }

  if (historyTo) {
    params.set(
      "to",
      historyTo
    );
  }

  const response =
    await apiRequest(
      `/attendance/history?${params.toString()}`
    );

  setHistory(
    response.attendance || []
  );

  setHistoryTotal(
    Number(
      response.total || 0
    )
  );

  setHistoryPages(
    Math.max(
      1,
      Number(
        response.pages || 1
      )
    )
  );

  setHistoryPage(
    Number(
      response.page ||
        requestedPage
    )
  );
} catch (error) {
  console.error(
    "Load attendance history error:",
    error
  );

  Swal.fire({
    icon: "error",
    title: "Unable to load history",
    text:
      error.message ||
      "Something went wrong while loading attendance history.",
  });
} finally {
  setHistoryLoading(false);
}


};

// =====================================================
// LOAD MEMBER INSIGHTS
// =====================================================

const loadMemberInsights = async (
memberId
) => {
if (!memberId) {
setInsightData(null);
return;
}


try {
  setInsightLoading(true);

  const response =
    await apiRequest(
      `/attendance/member/${memberId}`
    );

  setInsightData(
    response
  );
} catch (error) {
  console.error(
    "Load member attendance insights error:",
    error
  );

  setInsightData(null);

  Swal.fire({
    icon: "error",
    title:
      "Unable to load member insights",
    text:
      error.message ||
      "Something went wrong while loading member attendance.",
  });
} finally {
  setInsightLoading(false);
}


};

// =====================================================
// INITIAL LOAD
// =====================================================

useEffect(() => {
loadAttendance();
loadMembers();
loadAllMembers();
loadHistory(1);
}, []);

// =====================================================
// LOAD SELECTED MEMBER INSIGHTS
// =====================================================

useEffect(() => {
if (insightMemberId) {
loadMemberInsights(
insightMemberId
);
} else {
setInsightData(null);
}
}, [insightMemberId]);

// =====================================================
// LIVE REFRESH
// =====================================================

useEffect(() => {
const interval =
setInterval(() => {
loadAttendance();


    if (insightMemberId) {
      loadMemberInsights(
        insightMemberId
      );
    }
  }, 30000);

return () =>
  clearInterval(interval);


}, [insightMemberId]);

// =====================================================
// CURRENTLY INSIDE
// =====================================================

const currentlyInside =
useMemo(() => {
return attendance.filter(
(item) =>
item.status ===
"Checked In"
);
}, [attendance]);

// =====================================================
// TODAY SEARCH
// =====================================================

const filteredAttendance =
useMemo(() => {
const term =
search
.trim()
.toLowerCase();


  if (!term) {
    return attendance;
  }

  return attendance.filter(
    (item) => {
      const member =
        item.member || {};

      return (
        member.name
          ?.toLowerCase()
          .includes(term) ||
        member.memberId
          ?.toLowerCase()
          .includes(term) ||
        member.phone
          ?.toLowerCase()
          .includes(term)
      );
    }
  );
}, [attendance, search]);


// =====================================================
// HISTORY SEARCH
// =====================================================

const filteredHistory =
useMemo(() => {
const term =
historySearch
.trim()
.toLowerCase();


  if (!term) {
    return history;
  }

  return history.filter(
    (item) => {
      const member =
        item.member || {};

      return (
        member.name
          ?.toLowerCase()
          .includes(term) ||
        member.memberId
          ?.toLowerCase()
          .includes(term) ||
        member.phone
          ?.toLowerCase()
          .includes(term)
      );
    }
  );
}, [
  history,
  historySearch,
]);


// =====================================================
// AVAILABLE MEMBERS
// =====================================================

const availableMembers =
useMemo(() => {
const activeIds =
new Set(
currentlyInside.map(
(item) =>
item.member?._id
)
);


  return members.filter(
    (member) =>
      !activeIds.has(
        member._id
      )
  );
}, [
  members,
  currentlyInside,
]);


// =====================================================
// SELECTED INSIGHT MEMBER
// =====================================================

const selectedInsightMember =
useMemo(() => {
return (
insightData?.member ||
allMembers.find(
(member) =>
member._id ===
insightMemberId
) ||
null
);
}, [
insightData,
allMembers,
insightMemberId,
]);

// =====================================================
// CHECK IN
// =====================================================

const handleCheckIn = async (
event
) => {
event.preventDefault();


if (!selectedMember) {
  Swal.fire({
    icon: "warning",
    title: "Select a member",
    text:
      "Please select a member before checking in.",
  });

  return;
}

try {
  setActionLoading(true);

  await apiRequest(
    "/attendance/check-in",
    {
      method: "POST",
      body: {
        memberId:
          selectedMember,
        notes,
      },
    }
  );

  setShowCheckInModal(false);
  setSelectedMember("");
  setNotes("");

  await Promise.all([
    loadAttendance(),
    loadHistory(1),
    loadMembers(),
  ]);

  if (insightMemberId) {
    await loadMemberInsights(
      insightMemberId
    );
  }

  Swal.fire({
    icon: "success",
    title: "Checked in",
    text:
      "Member has been checked in successfully.",
    timer: 1600,
    showConfirmButton: false,
  });
} catch (error) {
  Swal.fire({
    icon: "error",
    title: "Check-in failed",
    text:
      error.message ||
      "Unable to check in this member.",
  });
} finally {
  setActionLoading(false);
}


};

// =====================================================
// CHECK OUT
// =====================================================

const handleCheckOut = async (
attendanceId
) => {
const result =
await Swal.fire({
title:
"Check out member?",
text:
"This will complete the member's current visit.",
icon: "question",
showCancelButton: true,
confirmButtonText:
"Check Out",
cancelButtonText:
"Cancel",
});


if (!result.isConfirmed) {
  return;
}

try {
  setActionLoading(true);

  await apiRequest(
    `/attendance/check-out/${attendanceId}`,
    {
      method: "PUT",
    }
  );

  await Promise.all([
    loadAttendance(),
    loadHistory(
      historyPage
    ),
  ]);

  if (insightMemberId) {
    await loadMemberInsights(
      insightMemberId
    );
  }

  Swal.fire({
    icon: "success",
    title: "Checked out",
    text:
      "Member has been checked out successfully.",
    timer: 1500,
    showConfirmButton: false,
  });
} catch (error) {
  Swal.fire({
    icon: "error",
    title:
      "Check-out failed",
    text:
      error.message ||
      "Unable to check out this member.",
  });
} finally {
  setActionLoading(false);
}


};

// =====================================================
// DELETE
// =====================================================

const handleDelete = async (
attendanceId
) => {
const result =
await Swal.fire({
title:
"Delete attendance record?",
text:
"This action cannot be undone.",
icon: "warning",
showCancelButton: true,
confirmButtonText:
"Delete",
cancelButtonText:
"Cancel",
});


if (!result.isConfirmed) {
  return;
}

try {
  setActionLoading(true);

  await apiRequest(
    `/attendance/${attendanceId}`,
    {
      method: "DELETE",
    }
  );

  await Promise.all([
    loadAttendance(),
    loadHistory(
      historyPage
    ),
  ]);

  if (insightMemberId) {
    await loadMemberInsights(
      insightMemberId
    );
  }

  Swal.fire({
    icon: "success",
    title: "Deleted",
    text:
      "Attendance record deleted.",
    timer: 1400,
    showConfirmButton: false,
  });
} catch (error) {
  Swal.fire({
    icon: "error",
    title:
      "Delete failed",
    text:
      error.message ||
      "Unable to delete attendance record.",
  });
} finally {
  setActionLoading(false);
}


};

// =====================================================
// HISTORY FILTER
// =====================================================

const handleHistoryFilter =
() => {
setHistoryPage(1);
loadHistory(1);
};

const clearHistoryFilters =
() => {
setHistoryFrom("");
setHistoryTo("");
setHistorySearch("");
setHistoryPage(1);


  setTimeout(() => {
    loadHistory(1);
  }, 0);
};


// =====================================================
// REFRESH EVERYTHING
// =====================================================

const handleRefreshAll =
async () => {
await Promise.all([
loadAttendance(),
loadHistory(
historyPage
),
loadMembers(),
loadAllMembers(),
]);


  if (insightMemberId) {
    await loadMemberInsights(
      insightMemberId
    );
  }
};


// =====================================================
// RENDER
// =====================================================

const insightStats =
insightData?.stats || {};

const recentVisits =
insightData?.recentVisits ||
insightData?.attendance?.slice(
0,
5
) ||
[];

return ( <DashboardLayout
   title="Attendance"
   subtitle="Track member check-ins, check-outs and daily gym activity."
 > <div className="attendance-page">


    {/* =================================================
        HERO
    ================================================= */}

    <div className="attendance-hero">
      <div>
        <div className="attendance-eyebrow">
          <Activity size={15} />
          LIVE GYM ACTIVITY
        </div>

        <h2>
          Keep your gym moving.
        </h2>

        <p>
          Monitor who's inside,
          record visits instantly,
          and keep your attendance
          history organized.
        </p>
      </div>

      <div className="attendance-hero-actions">

        <button
          className="attendance-refresh-button"
          onClick={
            handleRefreshAll
          }
          disabled={
            loading ||
            historyLoading ||
            insightLoading
          }
        >
          <RefreshCw
            size={17}
            className={
              loading ||
              historyLoading ||
              insightLoading
                ? "attendance-spin"
                : ""
            }
          />

          Refresh
        </button>

        <button
          className="attendance-checkin-button"
          onClick={() =>
            setShowCheckInModal(
              true
            )
          }
        >
          <LogIn size={18} />
          Check In Member
        </button>

      </div>
    </div>

    {/* =================================================
        STATS
    ================================================= */}

    <div className="attendance-stat-grid">

      <div className="attendance-stat-card">

        <div className="attendance-stat-icon">
          <Users size={21} />
        </div>

        <div>
          <span>
            Today's Visits
          </span>

          <strong>
            {stats.todayTotal}
          </strong>

          <small>
            {stats.uniqueVisitors}{" "}
            unique members
          </small>
        </div>

      </div>

      <div className="attendance-stat-card">

        <div className="attendance-stat-icon inside">
          <Activity size={21} />
        </div>

        <div>
          <span>
            Currently Inside
          </span>

          <strong>
            {stats.currentlyInside}
          </strong>

          <small>
            Active right now
          </small>
        </div>

      </div>

      <div className="attendance-stat-card">

        <div className="attendance-stat-icon completed">
          <CheckCircle2 size={21} />
        </div>

        <div>
          <span>
            Completed Visits
          </span>

          <strong>
            {stats.todayCompleted}
          </strong>

          <small>
            Checked out today
          </small>
        </div>

      </div>

      <div className="attendance-stat-card">

        <div className="attendance-stat-icon total">
          <Clock3 size={21} />
        </div>

        <div>
          <span>
            Total Visits
          </span>

          <strong>
            {stats.totalVisits}
          </strong>

          <small>
            All-time records
          </small>
        </div>

      </div>

    </div>

    {/* =================================================
        MEMBER ATTENDANCE INSIGHTS
    ================================================= */}

    <section className="attendance-section attendance-insights-section">

      <div className="attendance-section-heading attendance-insights-heading">

        <div>
          <div className="attendance-section-title">
            <BarChart3 size={19} />
            Member Attendance Insights
          </div>

          <p>
            Analyze an individual member's
            attendance, consistency and
            training activity.
          </p>
        </div>

        {selectedInsightMember && (
          <span className="attendance-insight-member-badge">
            <CircleUserRound size={14} />
            {selectedInsightMember.name}
          </span>
        )}

      </div>

      <div className="attendance-insight-selector">

        <div className="attendance-insight-selector-icon">
          <UserRound size={19} />
        </div>

        <div className="attendance-insight-selector-content">

          <label>
            Select Member
          </label>

          <select
            value={
              insightMemberId
            }
            onChange={(event) =>
              setInsightMemberId(
                event.target.value
              )
            }
          >
            <option value="">
              Choose a member to view insights
            </option>

            {allMembers.map(
              (member) => (
                <option
                  key={member._id}
                  value={member._id}
                >
                  {member.name} —{" "}
                  {member.memberId}
                </option>
              )
            )}
          </select>

        </div>

        {insightMemberId && (
          <button
            className="attendance-insight-clear"
            onClick={() =>
              setInsightMemberId(
                ""
              )
            }
          >
            <X size={15} />
            Clear
          </button>
        )}

      </div>

      {!insightMemberId ? (
        <div className="attendance-insight-empty">

          <div className="attendance-insight-empty-icon">
            <TrendingUp size={28} />
          </div>

          <div>
            <strong>
              Select a member to explore their attendance
            </strong>

            <p>
              View visits, training time,
              session duration, consistency
              and recent activity.
            </p>
          </div>

        </div>
      ) : insightLoading ? (
        <div className="attendance-loading attendance-insight-loading">
          <div className="attendance-loader" />
          Loading member insights...
        </div>
      ) : insightData ? (
        <div className="attendance-insight-content">

          {/* MEMBER HEADER */}

          <div className="attendance-insight-member-header">

            <div className="attendance-insight-avatar">
              {selectedInsightMember?.name
                ? selectedInsightMember.name
                    .charAt(0)
                    .toUpperCase()
                : "M"}
            </div>

            <div className="attendance-insight-member-info">

              <div>
                <h3>
                  {selectedInsightMember?.name ||
                    "Member"}
                </h3>

                <span>
                  {selectedInsightMember?.memberId ||
                    "No member ID"}
                </span>
              </div>

              <div className="attendance-insight-status-area">

                <span
                  className={`attendance-insight-status ${
                    insightStats.activeVisit
                      ? "inside"
                      : "outside"
                  }`}
                >
                  <span />
                  {insightStats.activeVisit
                    ? "Currently Inside"
                    : "Not Inside"}
                </span>

                {selectedInsightMember?.membershipPlan?.name && (
                  <span className="attendance-insight-plan">
                    {selectedInsightMember.membershipPlan.name}
                  </span>
                )}

              </div>

            </div>

          </div>

          {/* KPI CARDS */}

          <div className="attendance-insight-kpis">

            <div className="attendance-insight-kpi">

              <div className="attendance-insight-kpi-icon visits">
                <CalendarCheck2 size={19} />
              </div>

              <div>
                <span>
                  Total Visits
                </span>

                <strong>
                  {insightStats.totalVisits ||
                    0}
                </strong>

                <small>
                  All-time visits
                </small>
              </div>

            </div>

            <div className="attendance-insight-kpi">

              <div className="attendance-insight-kpi-icon completed">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <span>
                  Completed
                </span>

                <strong>
                  {insightStats.completedVisits ||
                    0}
                </strong>

                <small>
                  Finished sessions
                </small>
              </div>

            </div>

            <div className="attendance-insight-kpi">

              <div className="attendance-insight-kpi-icon training">
                <Timer size={19} />
              </div>

              <div>
                <span>
                  Training Time
                </span>

                <strong>
                  {formatDuration(
                    insightStats.totalMinutes
                  )}
                </strong>

                <small>
                  Total recorded time
                </small>
              </div>

            </div>

            <div className="attendance-insight-kpi">

              <div className="attendance-insight-kpi-icon average">
                <Clock3 size={19} />
              </div>

              <div>
                <span>
                  Avg. Session
                </span>

                <strong>
                  {formatDuration(
                    insightStats.averageSessionMinutes
                  )}
                </strong>

                <small>
                  Average completed session
                </small>
              </div>

            </div>

          </div>

          {/* ACTIVITY + MEMBERSHIP */}

          <div className="attendance-insight-lower-grid">

            {/* ACTIVITY */}

            <div className="attendance-insight-panel">

              <div className="attendance-insight-panel-header">

                <div>
                  <h4>
                    Activity Overview
                  </h4>

                  <p>
                    Recent attendance consistency
                  </p>
                </div>

                <div className="attendance-consistency-badge">
                  <Flame size={15} />
                  {insightStats.consistency ||
                    "No activity"}
                </div>

              </div>

              <div className="attendance-activity-row">

                <div className="attendance-activity-label">

                  <span>
                    Last 7 Days
                  </span>

                  <strong>
                    {insightStats.last7Days
                      ?.activeDays ||
                      0}
                    <small>
                      {" "}
                      active days
                    </small>
                  </strong>

                </div>

                <div className="attendance-activity-track">
                  <div
                    className="attendance-activity-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        ((insightStats
                          .last7Days
                          ?.activeDays ||
                          0) /
                          7) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                <span className="attendance-activity-visits">
                  {insightStats.last7Days
                    ?.visits ||
                    0}{" "}
                  visits
                </span>

              </div>

              <div className="attendance-activity-row">

                <div className="attendance-activity-label">

                  <span>
                    Last 30 Days
                  </span>

                  <strong>
                    {insightStats.last30Days
                      ?.activeDays ||
                      0}
                    <small>
                      {" "}
                      active days
                    </small>
                  </strong>

                </div>

                <div className="attendance-activity-track">
                  <div
                    className="attendance-activity-fill"
                    style={{
                      width: `${Math.min(
                        100,
                        ((insightStats
                          .last30Days
                          ?.activeDays ||
                          0) /
                          30) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                <span className="attendance-activity-visits">
                  {insightStats.last30Days
                    ?.visits ||
                    0}{" "}
                  visits
                </span>

              </div>

              <div className="attendance-activity-rate">

                <div>
                  <span>
                    30-Day Activity
                  </span>

                  <strong>
                    {insightStats.activityRate ||
                      0}
                    %
                  </strong>
                </div>

                <p>
                  Based on active days
                  during the last 30 days.
                </p>

              </div>

            </div>

            {/* MEMBERSHIP */}

            <div className="attendance-insight-panel">

              <div className="attendance-insight-panel-header">

                <div>
                  <h4>
                    Membership
                  </h4>

                  <p>
                    Current membership status
                  </p>
                </div>

                <CalendarDays size={19} />

              </div>

              <div className="attendance-membership-details">

                <div>
                  <span>
                    Plan
                  </span>

                  <strong>
                    {selectedInsightMember?.membershipPlan?.name ||
                      "No plan"}
                  </strong>
                </div>

                <div>
                  <span>
                    Start Date
                  </span>

                  <strong>
                    {selectedInsightMember?.membershipStart
                      ? formatDate(
                          selectedInsightMember.membershipStart
                        )
                      : "--"}
                  </strong>
                </div>

                <div>
                  <span>
                    Expiry Date
                  </span>

                  <strong>
                    {selectedInsightMember?.membershipEnd
                      ? formatDate(
                          selectedInsightMember.membershipEnd
                        )
                      : "--"}
                  </strong>
                </div>

                <div className="attendance-membership-days">

                  <span>
                    Membership Remaining
                  </span>

                  <strong
                    className={
                      insightStats.membershipExpired
                        ? "expired"
                        : insightStats.membershipDaysRemaining !==
                            null &&
                          insightStats.membershipDaysRemaining <=
                            7
                        ? "warning"
                        : ""
                    }
                  >
                    {insightStats.membershipExpired
                      ? "Expired"
                      : insightStats.membershipDaysRemaining !==
                          null
                        ? `${Math.max(
                            0,
                            insightStats.membershipDaysRemaining
                          )} days`
                        : "No expiry"}
                  </strong>

                </div>

              </div>

            </div>

          </div>

          {/* LAST VISIT */}

          <div className="attendance-insight-last-visit">

            <div className="attendance-insight-last-icon">
              <Clock3 size={19} />
            </div>

            <div>
              <span>
                Last Visit
              </span>

              <strong>
                {insightStats.lastVisit
                  ? formatDate(
                      insightStats.lastVisit
                    )
                  : "No visits yet"}
              </strong>
            </div>

            {insightStats.lastVisit && (
              <span className="attendance-last-visit-time">
                {formatTime(
                  insightStats.lastVisit
                )}
              </span>
            )}

          </div>

          {/* RECENT VISITS */}

          <div className="attendance-recent-visits">

            <div className="attendance-insight-panel-header">

              <div>
                <h4>
                  Recent Visits
                </h4>

                <p>
                  Latest recorded attendance
                </p>
              </div>

              <span className="attendance-recent-count">
                {recentVisits.length}
              </span>

            </div>

            {recentVisits.length ===
            0 ? (
              <div className="attendance-recent-empty">
                <CalendarDays size={23} />
                <span>
                  No attendance records yet.
                </span>
              </div>
            ) : (
              <div className="attendance-recent-list">

                {recentVisits.map(
                  (item) => {
                    const isInside =
                      item.status ===
                      "Checked In";

                    return (
                      <div
                        className="attendance-recent-item"
                        key={item._id}
                      >

                        <div className="attendance-recent-date">

                          <strong>
                            {new Date(
                              item.checkIn
                            ).toLocaleDateString(
                              [],
                              {
                                day: "2-digit",
                              }
                            )}
                          </strong>

                          <span>
                            {new Date(
                              item.checkIn
                            ).toLocaleDateString(
                              [],
                              {
                                month: "short",
                              }
                            )}
                          </span>

                        </div>

                        <div className="attendance-recent-main">

                          <strong>
                            {formatTime(
                              item.checkIn
                            )}
                            {item.checkOut &&
                              ` → ${formatTime(
                                item.checkOut
                              )}`}
                          </strong>

                          <span>
                            {isInside
                              ? "Currently inside"
                              : item.duration
                                ? formatDuration(
                                    item.duration
                                  )
                                : "Completed"}
                          </span>

                        </div>

                        <span
                          className={`attendance-recent-status ${
                            isInside
                              ? "inside"
                              : "completed"
                          }`}
                        >
                          <span />
                          {isInside
                            ? "Inside"
                            : "Completed"}
                        </span>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="attendance-insight-empty">
          <Activity size={28} />
          <strong>
            No insight data available.
          </strong>
        </div>
      )}

    </section>

    {/* =================================================
        CURRENTLY INSIDE
    ================================================= */}

    <section className="attendance-section">

      <div className="attendance-section-heading">

        <div>
          <div className="attendance-section-title">
            <span className="live-dot" />
            Currently Inside
          </div>

          <p>
            Members who have an active
            check-in.
          </p>
        </div>

        <span className="attendance-count-badge">
          {currentlyInside.length}{" "}
          inside
        </span>

      </div>

      {currentlyInside.length ===
      0 ? (
        <div className="attendance-empty-inside">

          <div className="attendance-empty-icon">
            <Users size={26} />
          </div>

          <div>
            <strong>
              Nobody is currently inside
            </strong>

            <p>
              New check-ins will appear
              here in real time.
            </p>
          </div>

        </div>
      ) : (
        <div className="attendance-inside-grid">

          {currentlyInside.map(
            (item) => {
              const member =
                item.member || {};

              return (
                <div
                  className="attendance-inside-card"
                  key={item._id}
                >

                  <div className="attendance-member-avatar">
                    {member.name
                      ? member.name
                          .charAt(0)
                          .toUpperCase()
                      : "M"}
                  </div>

                  <div className="attendance-inside-info">

                    <strong>
                      {member.name ||
                        "Unknown Member"}
                    </strong>

                    <span>
                      {member.memberId ||
                        "No ID"}
                    </span>

                    <small>
                      <Clock3 size={13} />
                      Since{" "}
                      {formatTime(
                        item.checkIn
                      )}
                    </small>

                  </div>

                  <button
                    className="attendance-checkout-small"
                    onClick={() =>
                      handleCheckOut(
                        item._id
                      )
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    <LogOut size={15} />
                    Check Out
                  </button>

                </div>
              );
            }
          )}

        </div>
      )}

    </section>

    {/* =================================================
        TODAY
    ================================================= */}

    <section className="attendance-section attendance-table-section">

      <div className="attendance-section-heading attendance-table-heading">

        <div>
          <div className="attendance-section-title">
            Today's Attendance
          </div>

          <p>
            Every member visit recorded
            today.
          </p>
        </div>

        <div className="attendance-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search member..."
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

      </div>

      {loading ? (
        <div className="attendance-loading">
          <div className="attendance-loader" />
          Loading attendance...
        </div>
      ) : filteredAttendance.length ===
        0 ? (
        <div className="attendance-table-empty">

          <CalendarDays size={34} />

          <strong>
            {search
              ? "No matching records"
              : "No attendance recorded today"}
          </strong>

          <p>
            {search
              ? "Try a different member name, ID or phone number."
              : "Check in your first member to start today's attendance."}
          </p>

          {!search && (
            <button
              className="attendance-empty-action"
              onClick={() =>
                setShowCheckInModal(
                  true
                )
              }
            >
              <LogIn size={16} />
              Check In Member
            </button>
          )}

        </div>
      ) : (
        <div className="attendance-table-wrapper">

          <table className="attendance-table">

            <thead>
              <tr>
                <th>MEMBER</th>
                <th>DATE</th>
                <th>CHECK IN</th>
                <th>CHECK OUT</th>
                <th>DURATION</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>

              {filteredAttendance.map(
                (item) => {
                  const member =
                    item.member || {};

                  const isInside =
                    item.status ===
                    "Checked In";

                  return (
                    <tr
                      key={item._id}
                    >

                      <td>
                        <div className="attendance-table-member">

                          <div className="attendance-table-avatar">
                            {member.name
                              ? member.name
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()
                              : "M"}
                          </div>

                          <div>
                            <strong>
                              {member.name ||
                                "Unknown Member"}
                            </strong>

                            <span>
                              {member.memberId ||
                                "No ID"}
                            </span>
                          </div>

                        </div>
                      </td>

                      <td>
                        {formatDate(
                          item.checkIn
                        )}
                      </td>

                      <td>
                        <span className="attendance-time">
                          <LogIn size={14} />
                          {formatTime(
                            item.checkIn
                          )}
                        </span>
                      </td>

                      <td>
                        {item.checkOut ? (
                          <span className="attendance-time">
                            <LogOut size={14} />
                            {formatTime(
                              item.checkOut
                            )}
                          </span>
                        ) : (
                          <span className="attendance-dash">
                            —
                          </span>
                        )}
                      </td>

                      <td>
                        {isInside
                          ? "In progress"
                          : formatDuration(
                              item.duration
                            )}
                      </td>

                      <td>
                        <span
                          className={`attendance-status ${
                            isInside
                              ? "active"
                              : "completed"
                          }`}
                        >
                          <span />
                          {item.status}
                        </span>
                      </td>

                      <td>
                        <div className="attendance-actions">

                          {isInside && (
                            <button
                              className="attendance-action checkout"
                              onClick={() =>
                                handleCheckOut(
                                  item._id
                                )
                              }
                              disabled={
                                actionLoading
                              }
                              title="Check out"
                            >
                              <LogOut
                                size={15}
                              />
                            </button>
                          )}

                          <button
                            className="attendance-action delete"
                            onClick={() =>
                              handleDelete(
                                item._id
                              )
                            }
                            disabled={
                              actionLoading
                            }
                            title="Delete record"
                          >
                            <Trash2
                              size={15}
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

    </section>

    {/* =================================================
        ATTENDANCE HISTORY
    ================================================= */}

    <section className="attendance-section attendance-history-section">

      <div className="attendance-section-heading attendance-history-heading">

        <div>
          <div className="attendance-section-title">
            <History size={19} />
            Attendance History
          </div>

          <p>
            Review previous member visits
            and training duration.
          </p>
        </div>

        <span className="attendance-count-badge">
          {historyTotal} records
        </span>

      </div>

      {/* FILTERS */}

      <div className="attendance-history-filters">

        <div className="attendance-history-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search member..."
            value={historySearch}
            onChange={(event) =>
              setHistorySearch(
                event.target.value
              )
            }
          />

          {historySearch && (
            <button
              onClick={() =>
                setHistorySearch("")
              }
            >
              <X size={15} />
            </button>
          )}

        </div>

        <label className="attendance-date-field">
          <span>From</span>

          <input
            type="date"
            value={historyFrom}
            max={today}
            onChange={(event) =>
              setHistoryFrom(
                event.target.value
              )
            }
          />
        </label>

        <label className="attendance-date-field">
          <span>To</span>

          <input
            type="date"
            value={historyTo}
            max={today}
            onChange={(event) =>
              setHistoryTo(
                event.target.value
              )
            }
          />
        </label>

        <button
          className="attendance-filter-button"
          onClick={
            handleHistoryFilter
          }
          disabled={
            historyLoading
          }
        >
          <BarChart3 size={16} />
          Apply
        </button>

        {(historyFrom ||
          historyTo ||
          historySearch) && (
          <button
            className="attendance-clear-filter"
            onClick={
              clearHistoryFilters
            }
          >
            Clear
          </button>
        )}

      </div>

      {/* HISTORY TABLE */}

      {historyLoading ? (
        <div className="attendance-loading">
          <div className="attendance-loader" />
          Loading attendance history...
        </div>
      ) : filteredHistory.length ===
        0 ? (
        <div className="attendance-table-empty">

          <History size={34} />

          <strong>
            No history found
          </strong>

          <p>
            Try changing the date range
            or search term.
          </p>

        </div>
      ) : (
        <>
          <div className="attendance-table-wrapper">

            <table className="attendance-table attendance-history-table">

              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>DATE</th>
                  <th>CHECK IN</th>
                  <th>CHECK OUT</th>
                  <th>DURATION</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>

                {filteredHistory.map(
                  (item) => {
                    const member =
                      item.member ||
                      {};

                    const isInside =
                      item.status ===
                      "Checked In";

                    return (
                      <tr
                        key={item._id}
                      >

                        <td>
                          <div className="attendance-table-member">

                            <div className="attendance-table-avatar">
                              {member.name
                                ? member.name
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()
                                : "M"}
                            </div>

                            <div>
                              <strong>
                                {member.name ||
                                  "Unknown Member"}
                              </strong>

                              <span>
                                {member.memberId ||
                                  "No ID"}
                              </span>
                            </div>

                          </div>
                        </td>

                        <td>
                          {formatDate(
                            item.checkIn
                          )}
                        </td>

                        <td>
                          <span className="attendance-time">
                            <LogIn size={14} />
                            {formatTime(
                              item.checkIn
                            )}
                          </span>
                        </td>

                        <td>
                          {item.checkOut ? (
                            <span className="attendance-time">
                              <LogOut size={14} />
                              {formatTime(
                                item.checkOut
                              )}
                            </span>
                          ) : (
                            <span className="attendance-dash">
                              —
                            </span>
                          )}
                        </td>

                        <td>
                          {isInside
                            ? "In progress"
                            : formatDuration(
                                item.duration
                              )}
                        </td>

                        <td>
                          <span
                            className={`attendance-status ${
                              isInside
                                ? "active"
                                : "completed"
                            }`}
                          >
                            <span />
                            {item.status}
                          </span>
                        </td>

                        <td>
                          <div className="attendance-actions">

                            {isInside && (
                              <button
                                className="attendance-action checkout"
                                onClick={() =>
                                  handleCheckOut(
                                    item._id
                                  )
                                }
                                disabled={
                                  actionLoading
                                }
                                title="Check out"
                              >
                                <LogOut
                                  size={15}
                                />
                              </button>
                            )}

                            <button
                              className="attendance-action delete"
                              onClick={() =>
                                handleDelete(
                                  item._id
                                )
                              }
                              disabled={
                                actionLoading
                              }
                              title="Delete record"
                            >
                              <Trash2
                                size={15}
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

          {/* PAGINATION */}

          {historyPages > 1 && (
            <div className="attendance-pagination">

              <span>
                Showing page{" "}
                <strong>
                  {historyPage}
                </strong>{" "}
                of{" "}
                <strong>
                  {historyPages}
                </strong>
              </span>

              <div>

                <button
                  onClick={() =>
                    loadHistory(
                      Math.max(
                        1,
                        historyPage - 1
                      )
                    )
                  }
                  disabled={
                    historyPage <=
                      1 ||
                    historyLoading
                  }
                >
                  <ChevronLeft
                    size={16}
                  />
                  Previous
                </button>

                <button
                  onClick={() =>
                    loadHistory(
                      Math.min(
                        historyPages,
                        historyPage + 1
                      )
                    )
                  }
                  disabled={
                    historyPage >=
                      historyPages ||
                    historyLoading
                  }
                >
                  Next
                  <ChevronRight
                    size={16}
                  />
                </button>

              </div>

            </div>
          )}

        </>
      )}

    </section>

  </div>

  {/* =================================================
      CHECK-IN MODAL
  ================================================= */}

  {showCheckInModal && (
    <div
      className="attendance-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          setShowCheckInModal(
            false
          );
        }
      }}
    >

      <div className="attendance-modal">

        <div className="attendance-modal-header">

          <div>
            <div className="attendance-modal-icon">
              <LogIn size={21} />
            </div>

            <div>
              <h3>
                Check In Member
              </h3>

              <p>
                Record a new gym visit.
              </p>
            </div>
          </div>

          <button
            className="attendance-modal-close"
            onClick={() =>
              setShowCheckInModal(
                false
              )
            }
          >
            <X size={19} />
          </button>

        </div>

        <form
          onSubmit={
            handleCheckIn
          }
          className="attendance-form"
        >

          <label>
            <span>
              Member <b>*</b>
            </span>

            <select
              value={
                selectedMember
              }
              onChange={(event) =>
                setSelectedMember(
                  event.target.value
                )
              }
              required
            >

              <option value="">
                Select a member
              </option>

              {availableMembers.map(
                (member) => (
                  <option
                    key={
                      member._id
                    }
                    value={
                      member._id
                    }
                  >
                    {member.name} —{" "}
                    {member.memberId}
                  </option>
                )
              )}

            </select>

          </label>

          {availableMembers.length ===
            0 && (
            <div className="attendance-no-members">

              <Users size={18} />

              <span>
                No active members are
                available for check-in.
              </span>

            </div>
          )}

          <label>
            <span>
              Notes
            </span>

            <textarea
              rows="3"
              placeholder="Optional note about this visit..."
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
            />
          </label>

          <div className="attendance-checkin-info">

            <Clock3 size={16} />

            <span>
              Check-in time will be
              recorded automatically as{" "}
              <strong>
                {new Date().toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute:
                      "2-digit",
                  }
                )}
              </strong>
              .
            </span>

          </div>

          <div className="attendance-modal-actions">

            <button
              type="button"
              className="attendance-cancel-button"
              onClick={() =>
                setShowCheckInModal(
                  false
                )
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="attendance-submit-button"
              disabled={
                actionLoading ||
                availableMembers.length ===
                  0
              }
            >
              <LogIn size={17} />

              {actionLoading
                ? "Checking In..."
                : "Check In Member"}
            </button>

          </div>

        </form>

      </div>

    </div>
  )}

</DashboardLayout>


);
}
