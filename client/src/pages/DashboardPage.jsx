import AdminDashboardView from "../components/dashboard/AdminDashboardView";
import TenantDashboardView from "../components/dashboard/TenantDashboardView";
import { useAuth } from "../hooks/useAuth";

function DashboardPage() {
  const { user } = useAuth();
  return user?.role === "ADMIN" ? <AdminDashboardView /> : <TenantDashboardView />;
}

export default DashboardPage;
