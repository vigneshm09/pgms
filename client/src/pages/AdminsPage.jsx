import { useEffect, useState } from "react";

import api from "../api";
import SectionHeader from "../components/SectionHeader";

const initialAdminForm = {
  name: "",
  email: "",
  password: ""
};

function AdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState(initialAdminForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAdmins = async () => {
    try {
      const response = await api.get("/admins");
      setAdmins(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load admins.");
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/admins", formData);
      setFormData(initialAdminForm);
      await loadAdmins();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to add admin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Admins"
        title="Admin access control"
        description="Keep the default admin account and add more JWT-enabled admin logins for operations."
      />

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Add Admin</h3>
            <p className="text-sm text-slate-500">Create another login without changing the original admin.</p>
          </div>

          <input
            className="input-field"
            placeholder="Full name"
            value={formData.name}
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
          />
          <input
            className="input-field"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
          />
          <input
            className="input-field"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(event) => setFormData({ ...formData, password: event.target.value })}
          />

          <button type="submit" className="primary-button w-full text-base" disabled={saving}>
            <span>{saving ? "Saving admin..." : "Save admin"}</span>
          </button>
        </form>

        <div className="card">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Admin List</h3>
            <p className="text-sm text-slate-500">{admins.length} logins available</p>
          </div>

          <div className="mt-5 grid gap-4">
            {admins.map((admin) => (
              <div key={admin.id} className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{admin.name}</p>
                    <p className="text-sm text-slate-500">{admin.email}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {admin.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminsPage;
