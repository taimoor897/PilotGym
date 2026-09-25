import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Members from "./pages/members/Members";
import MembershipPlans from "./pages/membership-plans/MembershipPlans";
import Payments from "./pages/payments/Payments";
import Attendance from "./pages/attendance/Attendance";
import Trainers from "./pages/trainers/Trainers";
import Workouts from "./pages/workouts/Workouts";
import Progress from "./pages/progress/Progress";
import WhatsApp from "./pages/whatsapp/WhatsApp";
import WhatsAppAutomation from "./pages/whatsapp/WhatsAppAutomation";
import Reports from "./pages/reports/Reports";
import Expenses from "./pages/expenses/Expenses";
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("gympilot_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("gympilot_token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            PUBLIC ROUTES
        ========================== */}

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* =========================
            PROTECTED ROUTES
        ========================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          }
        />
        <Route
  path="/membership-plans"
  element={
    <ProtectedRoute>
      <MembershipPlans />
    </ProtectedRoute>
  }
/>
<Route
  path="/payments"
  element={
    <ProtectedRoute>
      <Payments />
    </ProtectedRoute>
  }
/>
<Route
  path="/attendance"
  element={
    <ProtectedRoute>
      <Attendance />
    </ProtectedRoute>
  }
/>
<Route
  path="/trainers"
  element={
    <ProtectedRoute>
      <Trainers />
    </ProtectedRoute>
  }
/>
<Route
  path="/workouts"
  element={
    <ProtectedRoute>
      <Workouts />
    </ProtectedRoute>
  }
/>
<Route
  path="/progress"
  element={
    <ProtectedRoute>
      <Progress />
    </ProtectedRoute>
  }
/>
<Route
  path="/whatsapp"
  element={<WhatsApp />}
/>
<Route
  path="/whatsapp/automation"
  element={<WhatsAppAutomation />}
/>
<Route
  path="/reports"
  element={
    <ProtectedRoute>
      <Reports />
    </ProtectedRoute>
  }
/>
<Route
  path="/expenses"
  element={
    <ProtectedRoute>
      <Expenses />
    </ProtectedRoute>
  }
/>

        {/* =========================
            DEFAULT ROUTE
        ========================== */}

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* =========================
            404 FALLBACK
        ========================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}