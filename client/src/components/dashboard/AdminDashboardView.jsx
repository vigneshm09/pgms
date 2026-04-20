import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import api from "../../api";
import EmptyState from "../EmptyState";
import SectionHeader from "../SectionHeader";
import StatCard from "../StatCard";
import StatusBadge from "../StatusBadge";
import { formatCurrency, formatDateTime } from "../../utils/format";

function AdminDashboardView() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const response = await api.get("/dashboard");
        setSummary(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || "Unable to load dashboard.");
      }
    };

    loadSummary();
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Admin Dashboard"
        title="Operations snapshot for your PG"
        description="Track occupancy, payments, notices, and team access from one place."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/tenants" className="primary-button">
              Add tenant
            </Link>
            <Link to="/payments" className="secondary-button">
              Review payments
            </Link>
          </div>
        }
      />

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Tenants" value={summary ? summary.total_tenants : "..."} accent="bg-blue-100" />
        <StatCard title="Rooms" value={summary ? summary.total_rooms : "..."} accent="bg-cyan-100" />
        <StatCard title="Available Beds" value={summary ? summary.available_beds : "..."} accent="bg-emerald-100" />
        <StatCard title="Pending Payments" value={summary ? summary.pending_payments : "..."} accent="bg-amber-100" />
        <StatCard title="Admins" value={summary ? summary.total_admins : "..."} accent="bg-indigo-100" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Income overview</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">Monthly rent and approvals</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-blue-50 p-4">
              <p className="text-sm text-slate-500">Expected</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {summary ? formatCurrency(summary.monthly_income) : "..."}
              </p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-4">
              <p className="text-sm text-slate-500">Approved</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {summary ? formatCurrency(summary.approved_income) : "..."}
              </p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4">
              <p className="text-sm text-slate-500">Pending</p>
              <p className="mt-2 text-2xl font-bold text-amber-700">
                {summary ? formatCurrency(summary.pending_income) : "..."}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="text-sm font-medium text-slate-500">Occupancy</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">Bed utilization</h3>
          <p className="mt-6 text-5xl font-bold text-brand-700">{summary ? `${summary.occupancy_rate}%` : "..."}</p>
          <p className="mt-3 text-sm text-slate-500">
            {summary ? `${summary.occupied_beds}/${summary.total_beds} beds occupied` : "Loading..."}
          </p>
          <div className="mt-5 h-4 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: summary ? `${summary.occupancy_rate}%` : "0%" }}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Recent payments</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">Latest manual submissions</h3>
            </div>
            <Link to="/payments" className="secondary-button">
              Open payments
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {summary?.recent_payments?.length ? (
              summary.recent_payments.map((payment) => (
                <div key={payment.id} className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{payment.tenant_name}</p>
                      <p className="text-sm text-slate-500">
                        {payment.month} • {formatCurrency(payment.amount)}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                        {formatDateTime(payment.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No payments submitted yet" description="Tenant screenshots will appear here once uploads begin." />
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Notices</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">Latest announcements</h3>
            </div>
            <Link to="/notices" className="secondary-button">
              Manage notices
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {summary?.recent_notices?.length ? (
              summary.recent_notices.map((notice) => (
                <div key={notice.id} className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                  <p className="text-lg font-bold text-slate-900">{notice.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{notice.content}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                    {formatDateTime(notice.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState title="No notices published yet" description="Create a notice to update tenants about rent, rules, or events." />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardView;
