import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { status, isAuthenticated, user } = useAuth();

  if (status === "loading") {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center px-4">
        <div className="card w-full max-w-md text-center">
          <p className="text-lg font-semibold text-slate-900">Preparing your workspace</p>
          <p className="mt-2 text-sm text-slate-500">Checking your session and loading the right dashboard.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
