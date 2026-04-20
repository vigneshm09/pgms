import { useEffect, useState } from "react";

import api, { buildApiAssetUrl } from "../api";
import EmptyState from "../components/EmptyState";
import SectionHeader from "../components/SectionHeader";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../hooks/useAuth";
import { formatCurrency, formatDateTime } from "../utils/format";

function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    amount: "",
    month: "",
    transaction_id: ""
  });
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewingId, setReviewingId] = useState("");

  const loadPage = async () => {
    try {
      if (user?.role === "ADMIN") {
        const [paymentsResponse, qrResponse] = await Promise.all([api.get("/admin/payments"), api.get("/payments/qr")]);
        setPayments(paymentsResponse.data);
        setQrCode(qrResponse.data.qr_code_url);
      } else {
        const [paymentsResponse, qrResponse] = await Promise.all([api.get("/payments/my"), api.get("/payments/qr")]);
        setPayments(paymentsResponse.data);
        setQrCode(qrResponse.data.qr_code_url);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load payments.");
    }
  };

  useEffect(() => {
    loadPage();
  }, [user?.role]);

  const handleTenantUpload = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("amount", uploadForm.amount);
      payload.append("month", uploadForm.month);
      payload.append("transaction_id", uploadForm.transaction_id);
      if (screenshotFile) {
        payload.append("screenshot", screenshotFile);
      }

      await api.post("/payments/upload", payload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setUploadForm({
        amount: "",
        month: "",
        transaction_id: ""
      });
      setScreenshotFile(null);
      await loadPage();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to upload payment.");
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = async (event) => {
    event.preventDefault();
    if (!qrFile) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = new FormData();
      payload.append("qr_image", qrFile);
      await api.post("/admin/payments/qr", payload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setQrFile(null);
      await loadPage();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to upload QR code.");
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (paymentId, action) => {
    try {
      setReviewingId(paymentId);
      setError("");
      await api.put(`/admin/payments/${paymentId}/${action}`);
      await loadPage();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to review payment.");
    } finally {
      setReviewingId("");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Payments"
        title={user?.role === "ADMIN" ? "Review rent uploads and manage the QR code" : "Upload your monthly rent payment"}
        description={
          user?.role === "ADMIN"
            ? "Approve or reject submitted screenshots and keep the current payment QR updated."
            : "Scan the latest QR code, pay using any UPI app, then upload your screenshot for manual approval."
        }
      />

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      {user?.role === "TENANT" ? (
        <section className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
          <div className="card">
            <p className="text-sm font-medium text-slate-500">Current payment QR</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">Scan and pay</h3>
            {qrCode ? (
              <img
                src={buildApiAssetUrl(qrCode)}
                alt="Payment QR code"
                className="mt-5 w-full rounded-3xl border border-blue-100 bg-white p-4"
              />
            ) : (
              <div className="mt-5">
                <EmptyState title="QR code not available" description="The admin has not uploaded a payment QR yet." />
              </div>
            )}
          </div>

          <div className="card">
            <p className="text-sm font-medium text-slate-500">Upload payment</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">Submit screenshot for approval</h3>
            <form onSubmit={handleTenantUpload} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  placeholder="Amount"
                  value={uploadForm.amount}
                  onChange={(event) => setUploadForm({ ...uploadForm, amount: event.target.value })}
                />
                <input
                  type="month"
                  className="input-field"
                  value={uploadForm.month}
                  onChange={(event) => setUploadForm({ ...uploadForm, month: event.target.value })}
                />
              </div>
              <input
                className="input-field"
                placeholder="Transaction ID (optional)"
                value={uploadForm.transaction_id}
                onChange={(event) => setUploadForm({ ...uploadForm, transaction_id: event.target.value })}
              />
              <div className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Payment screenshot</label>
                <input type="file" accept=".png,.jpg,.jpeg" onChange={(event) => setScreenshotFile(event.target.files?.[0] || null)} />
              </div>
              <button type="submit" className="primary-button" disabled={saving || !screenshotFile}>
                {saving ? "Uploading..." : "Submit payment"}
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[0.4fr_0.6fr]">
          <form onSubmit={handleQrUpload} className="card space-y-4">
            <p className="text-sm font-medium text-slate-500">Payment QR</p>
            <h3 className="text-2xl font-bold text-slate-900">Upload or replace the tenant QR code</h3>
            {qrCode ? (
              <img
                src={buildApiAssetUrl(qrCode)}
                alt="Current payment QR"
                className="w-full rounded-3xl border border-blue-100 bg-white p-4"
              />
            ) : null}
            <div className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">QR image</label>
              <input type="file" accept=".png,.jpg,.jpeg" onChange={(event) => setQrFile(event.target.files?.[0] || null)} />
            </div>
            <button type="submit" className="primary-button" disabled={saving || !qrFile}>
              {saving ? "Uploading..." : "Save QR code"}
            </button>
          </form>

          <div className="card">
            <p className="text-sm font-medium text-slate-500">Manual approvals</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">Tenant submissions</h3>
            <div className="mt-5 grid gap-4">
              {payments.length === 0 ? (
                <EmptyState title="No payments yet" description="Submitted payment screenshots will appear here for review." />
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xl font-bold text-slate-900">{payment.tenant_name}</p>
                          <StatusBadge status={payment.status} />
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {payment.month} • {formatCurrency(payment.amount)} • Room {payment.room_number || "-"}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">Transaction: {payment.transaction_id || "Not shared"}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                          {formatDateTime(payment.created_at)}
                        </p>
                        {payment.screenshot_url ? (
                          <a
                            href={buildApiAssetUrl(payment.screenshot_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="secondary-button mt-4"
                          >
                            View screenshot
                          </a>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleReview(payment.id, "approve")}
                          className="primary-button"
                          disabled={reviewingId === payment.id || payment.status === "APPROVED"}
                        >
                          {reviewingId === payment.id ? "Saving..." : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReview(payment.id, "reject")}
                          className="secondary-button"
                          disabled={reviewingId === payment.id || payment.status === "REJECTED"}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {user?.role === "TENANT" ? (
        <section className="card">
          <p className="text-sm font-medium text-slate-500">Your payment history</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">Submission timeline</h3>
          <div className="mt-5 grid gap-4">
            {payments.length === 0 ? (
              <EmptyState title="No payment submissions yet" description="Your monthly uploads will appear here with approval status." />
            ) : (
              payments.map((payment) => (
                <div key={payment.id} className="rounded-3xl border border-blue-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xl font-bold text-slate-900">{payment.month}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatCurrency(payment.amount)}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                        {formatDateTime(payment.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default PaymentsPage;
