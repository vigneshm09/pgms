import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import api, { buildApiAssetUrl } from "../../api";
import EmptyState from "../EmptyState";
import SectionHeader from "../SectionHeader";
import StatusBadge from "../StatusBadge";
import { formatCurrency, formatDate, formatDateTime } from "../../utils/format";

function TenantDashboardView() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/tenant/dashboard");
        setDashboard(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.detail || "Unable to load tenant dashboard.");
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Tenant Dashboard"
        title={dashboard ? `Welcome back, ${dashboard.welcome_name}` : "Welcome"}
        description="See your room details, payment QR, notice board, and direct chat with admin."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/payments" className="primary-button">
              Upload payment
            </Link>
            <Link to="/messages" className="secondary-button">
              Open messages
            </Link>
          </div>
        }
      />

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <section className="grid gap-4 xl:grid-cols-[0.72fr_0.28fr]">
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Room details</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">Your stay information</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-blue-50 p-4">
              <p className="text-sm text-slate-500">Room</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {dashboard?.room_details?.room_number || "Not assigned"}
              </p>
            </div>
            <div className="rounded-3xl bg-cyan-50 p-4">
              <p className="text-sm text-slate-500">Bed</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {dashboard?.room_details?.bed_number || "Not assigned"}
              </p>
            </div>
            <div className="rounded-3xl bg-indigo-50 p-4">
              <p className="text-sm text-slate-500">Floor</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {dashboard?.room_details?.floor_name || "Unassigned Floor"}
              </p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4">
              <p className="text-sm text-slate-500">Monthly rent</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {dashboard ? formatCurrency(dashboard.room_details.rent) : "..."}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Joined on {dashboard ? formatDate(dashboard.room_details.join_date) : "..."}
          </p>
        </div>

        <div className="card">
          <p className="text-sm font-medium text-slate-500">Admin contact</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">{dashboard?.admin_contact?.name || "Admin"}</h3>
          <p className="mt-2 text-sm text-slate-500">{dashboard?.admin_contact?.email || "-"}</p>
          <Link to="/messages" className="primary-button mt-6 w-full">
            Message admin
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.45fr_0.55fr]">
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Payment QR</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">Scan and pay rent</h3>
          <p className="mt-2 text-sm text-slate-500">
            Use any UPI app, then upload your payment screenshot from the payments page.
          </p>

          {dashboard?.qr_code_url ? (
            <img
              src={buildApiAssetUrl(dashboard.qr_code_url)}
              alt="Rent payment QR code"
              className="mt-5 w-full rounded-3xl border border-blue-100 bg-white p-4"
            />
          ) : (
            <div className="mt-5">
              <EmptyState title="QR not uploaded yet" description="The admin will upload a payment QR soon." />
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Payment history</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">Latest submissions</h3>
            </div>
            <Link to="/payments" className="secondary-button">
              Open payments
            </Link>
          </div>

          <div className="mt-5 grid gap-3">
            {dashboard?.payments?.length ? (
              dashboard.payments.map((payment) => (
                <div key={payment.id} className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{payment.month}</p>
                      <p className="text-sm text-slate-500">{formatCurrency(payment.amount)}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                        {formatDateTime(payment.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No payment history yet" description="Your manual payment uploads will appear here after submission." />
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Notices</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">Latest updates from admin</h3>
          </div>
          <Link to="/notices" className="secondary-button">
            View all notices
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {dashboard?.notices?.length ? (
            dashboard.notices.map((notice) => (
              <div key={notice.id} className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                <p className="text-lg font-bold text-slate-900">{notice.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{notice.content}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                  {formatDateTime(notice.created_at)}
                </p>
              </div>
            ))
          ) : (
            <EmptyState title="No notices yet" description="Published announcements will appear here." />
          )}
        </div>
      </section>
    </div>
  );
}

export default TenantDashboardView;
