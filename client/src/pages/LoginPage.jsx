import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "admin@pgms.local", password: "admin123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await login(formData);
      const redirectPath = user.role === "ADMIN" ? "/dashboard" : "/dashboard";
      navigate(redirectPath, { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-4">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 p-8 text-white shadow-soft lg:block">
          <p className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">Role-based PG management</p>
          <h1 className="mt-8 text-5xl font-bold leading-tight">Admin and tenant access from one secure PGMS workspace.</h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="mt-3 text-sm text-blue-100">JWT sessions</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="mt-3 text-sm text-blue-100">Payment approval</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <p className="mt-3 text-sm text-blue-100">Notices and chat</p>
            </div>
          </div>
        </div>

        <div className="card mx-auto w-full max-w-lg p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-xl font-bold text-brand-700">
            PG
          </div>
          <h2 className="mt-5 text-center text-3xl font-bold text-slate-900">PGMS Login</h2>
          <p className="mt-2 text-center text-sm text-slate-500">Sign in as admin or tenant using your email and password.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className="input-field"
                placeholder="admin@pgms.local"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                className="input-field"
                placeholder="admin123"
              />
            </div>

            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

            <button type="submit" className="primary-button w-full text-base" disabled={loading}>
              <span>{loading ? "Signing in..." : "Open dashboard"}</span>
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-brand-700">
            Admin Email: <strong>admin@pgms.local</strong>
            <br />
            Password: <strong>admin123</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
