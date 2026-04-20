import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const navigationItemsByRole = {
  ADMIN: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/tenants", label: "Tenants" },
    { to: "/rooms", label: "Rooms" },
    { to: "/pg-map", label: "PG Map" },
    { to: "/payments", label: "Payments" },
    { to: "/notices", label: "Notices" },
    { to: "/messages", label: "Messages" },
    { to: "/admins", label: "Admins" }
  ],
  TENANT: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/payments", label: "Payments" },
    { to: "/notices", label: "Notices" },
    { to: "/messages", label: "Messages" }
  ]
};

function Layout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const navigationItems = navigationItemsByRole[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-shell">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 md:flex-row md:gap-6 md:px-6">
        <aside className="card mb-4 md:mb-0 md:w-72 md:self-start">
          <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 p-5 text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-100">PGMS</p>
            <h1 className="mt-2 text-2xl font-bold">PG Operations Hub</h1>
            <p className="mt-2 text-sm text-blue-100">
              {user?.role === "ADMIN"
                ? "Manage tenants, approvals, notices, and messaging from one secure panel."
                : "Track your room, rent status, notices, and admin messages in one place."}
            </p>
          </div>

          <div className="mt-5 rounded-3xl border border-blue-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Signed in as</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{user?.name}</p>
            <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
            <p className="mt-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-brand-700">
              {user?.role}
            </p>
          </div>

          <nav className="mt-5 grid gap-3">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center rounded-2xl px-4 py-4 text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand-500 text-white shadow-lg"
                      : "bg-blue-50 text-brand-700 hover:bg-blue-100"
                  }`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <button type="button" onClick={handleLogout} className="secondary-button mt-5 w-full">
            Logout
          </button>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
