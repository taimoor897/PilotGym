import { useState } from "react";
import {
  Menu,
  Bell,
  Search,
} from "lucide-react";

import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
  title = "Dashboard",
  subtitle = "Here's what's happening at your gym today.",
}) {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const user = JSON.parse(
    localStorage.getItem("gympilot_user") || "{}"
  );

  return (
    <div className="dashboard-shell">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="topbar-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="topbar-actions">
            <button className="icon-button">
              <Search size={19} />
            </button>

            <button className="icon-button notification-button">
              <Bell size={19} />
              <span />
            </button>

            <div className="topbar-avatar">
              {user.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </div>
          </div>
        </header>

        <section className="page-content">
          {children}
        </section>
      </main>
    </div>
  );
}