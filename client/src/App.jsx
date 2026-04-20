import { Navigate, Route, Routes } from "react-router-dom";

import AdminsPage from "./pages/AdminsPage";
import DashboardPage from "./pages/DashboardPage";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import MessagesPage from "./pages/MessagesPage";
import NoticesPage from "./pages/NoticesPage";
import PaymentsPage from "./pages/PaymentsPage";
import PGMapPage from "./pages/PGMapPage";
import ProtectedRoute from "./components/ProtectedRoute";
import RoomsPage from "./pages/RoomsPage";
import TenantsPage from "./pages/TenantsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route
          path="tenants"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <TenantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="rooms"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <RoomsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="pg-map"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <PGMapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admins"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
