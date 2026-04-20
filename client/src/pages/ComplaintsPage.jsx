import { useEffect, useState } from "react";

import api from "../api";

function ComplaintsPage() {
  const [formData, setFormData] = useState({ tenant_name: "", message: "" });
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadComplaints = async () => {
    try {
      const response = await api.get("/complaints");
      setComplaints(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load complaints.");
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.post("/complaints", formData);
      setFormData({ tenant_name: "", message: "" });
      await loadComplaints();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to save complaint.");
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async (complaintId) => {
    try {
      await api.post(`/complaints/${complaintId}/resolve`);
      await loadComplaints();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to resolve complaint.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold text-slate-900">Complaints</h2>
        <p className="text-sm text-slate-500">Record tenant issues and close them after action is taken.</p>
      </div>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-rose-100 px-4 py-3 text-2xl">📝</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Add Complaint</h3>
              <p className="text-sm text-slate-500">Short and clear works best.</p>
            </div>
          </div>

          <input
            className="input-field"
            placeholder="Tenant name"
            value={formData.tenant_name}
            onChange={(event) => setFormData({ ...formData, tenant_name: event.target.value })}
          />
          <textarea
            className="input-field min-h-32 resize-none"
            placeholder="Complaint message"
            value={formData.message}
            onChange={(event) => setFormData({ ...formData, message: event.target.value })}
          />

          <button type="submit" className="primary-button w-full text-base" disabled={saving}>
            <span>{saving ? "..." : "✔"}</span>
            <span>{saving ? "Saving complaint" : "Save Complaint"}</span>
          </button>
        </form>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Complaint List</h3>
              <p className="text-sm text-slate-500">{complaints.length} total records</p>
            </div>
            <div className="rounded-2xl bg-rose-100 px-4 py-3 text-2xl">🛠️</div>
          </div>

          <div className="mt-5 grid gap-4">
            {complaints.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-blue-200 p-6 text-center text-sm text-slate-500">
                No complaints added yet.
              </div>
            ) : (
              complaints.map((complaint) => (
                <div key={complaint.id} className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{complaint.tenant_name}</p>
                      <p className="mt-2 text-sm text-slate-500">{complaint.message}</p>
                      <span
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          complaint.status === "Resolved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {complaint.status}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleResolve(complaint.id)}
                      className="secondary-button"
                      disabled={complaint.status === "Resolved"}
                    >
                      <span>{complaint.status === "Resolved" ? "✔" : "🛠️"}</span>
                      <span>{complaint.status === "Resolved" ? "Resolved" : "Mark Resolved"}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ComplaintsPage;

