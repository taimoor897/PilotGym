import {
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardCheck,
  Dumbbell,
  CalendarDays,
  TrendingUp,
  Receipt,
  Wallet,
  MessageCircle,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

const menuGroups = [
  {
    label: "MAIN",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
      {
        name: "Members",
        icon: Users,
        path: "/members",
      },
      {
        name: "Attendance",
        icon: ClipboardCheck,
        path: "/attendance",
      },
    ],
  },

  {
    label: "MANAGEMENT",
    items: [
      {
        name: "Membership Plans",
        icon: CreditCard,
        path: "/membership-plans",
      },
      {
        name: "Trainers",
        icon: Dumbbell,
        path: "/trainers",
      },
      {
        name: "Workouts",
        icon: CalendarDays,
        path: "/workouts",
      },
      {
        name: "Progress",
        icon: TrendingUp,
        path: "/progress",
      },
    ],
  },

  {
    label: "BUSINESS",
    items: [
      {
        name: "Payments",
        icon: Receipt,
        path: "/payments",
      },
      {
        name: "Expenses",
        icon: Wallet,
        path: "/expenses",
      },
      {
        name: "WhatsApp",
        icon: MessageCircle,
        path: "/whatsapp",
      },
      {
        name: "Automation",
        icon: Bot,
        path: "/whatsapp/automation",
      },
      {
        name: "Reports",
        icon: BarChart3,
        path: "/reports",
      },
    ],
  },
];

export default function Sidebar({
  mobileOpen,
  setMobileOpen,
}) {
  const navigate = useNavigate();

  const gym = JSON.parse(
    localStorage.getItem(
      "gympilot_gym"
    ) || "{}"
  );

  const user = JSON.parse(
    localStorage.getItem(
      "gympilot_user"
    ) || "{}"
  );

  const logout = () => {
    localStorage.removeItem(
      "gympilot_token"
    );

    localStorage.removeItem(
      "gympilot_user"
    );

    localStorage.removeItem(
      "gympilot_gym"
    );

    navigate("/login");
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen
            ? "mobile-open"
            : ""
        }`}
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-icon small">
              <Dumbbell size={20} />
            </div>

            <div>
              <strong>
                GymPilot
              </strong>

              <span>
                GYM MANAGEMENT
              </span>
            </div>
          </div>

          <button
            className="mobile-close"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            <X size={20} />
          </button>
        </div>

        <div className="gym-mini-profile">
          <div className="gym-avatar">
            {gym.name
              ? gym.name
                  .charAt(0)
                  .toUpperCase()
              : "G"}
          </div>

          <div>
            <strong>
              {gym.name ||
                "My Gym"}
            </strong>

            <span>
              {user.role ||
                "owner"}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuGroups.map(
            (group) => (
              <div
                className="nav-group"
                key={group.label}
              >
                <p>
                  {group.label}
                </p>

                {group.items.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    return (
                      <NavLink
                        key={
                          item.path
                        }
                        to={
                          item.path
                        }
                        className={({
                          isActive,
                        }) =>
                          `nav-item ${
                            isActive
                              ? "active"
                              : ""
                          }`
                        }
                        onClick={() =>
                          setMobileOpen(
                            false
                          )
                        }
                      >
                        <Icon
                          size={19}
                        />

                        <span>
                          {
                            item.name
                          }
                        </span>
                      </NavLink>
                    );
                  }
                )}
              </div>
            )
          )}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/settings"
            className={({
              isActive,
            }) =>
              `nav-item ${
                isActive
                  ? "active"
                  : ""
              }`
            }
            onClick={() =>
              setMobileOpen(
                false
              )
            }
          >
            <Settings size={19} />

            <span>
              Settings
            </span>
          </NavLink>

          <button
            className="logout-button"
            onClick={logout}
          >
            <LogOut size={19} />

            <span>
              Sign out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}