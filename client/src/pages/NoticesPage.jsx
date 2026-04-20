import { useEffect, useState } from "react";

import api from "../api";
import EmptyState from "../components/EmptyState";
import NoticeCard from "../components/notices/NoticeCard";
import SectionHeader from "../components/SectionHeader";
import { useAuth } from "../hooks/useAuth";

const initialNoticeForm = {
  title: "",
  content: ""
};

function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [formData, setFormData] = useState(initialNoticeForm);
  const [editingNoticeId, setEditingNoticeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadNotices = async () => {
    try {
      const response = await api.get("/notices");
      setNotices(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load notices.");
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingNoticeId) {
        await api.put(`/admin/notices/${editingNoticeId}`, formData);
      } else {
        await api.post("/admin/notices", formData);
      }

      setFormData(initialNoticeForm);
      setEditingNoticeId("");
      await loadNotices();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to save notice.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noticeId) => {
    try {
      setError("");
      await api.delete(`/admin/notices/${noticeId}`);
      await loadNotices();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to delete notice.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Notices"
        title={user?.role === "ADMIN" ? "Publish updates for every tenant" : "Notice board"}
        description={
          user?.role === "ADMIN"
            ? "Create, update, and remove announcements that tenants can read on their dashboard."
            : "Stay up to date with rent reminders, house rules, and admin updates."
        }
      />

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      {user?.role === "ADMIN" ? (
        <section className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
          <form onSubmit={handleSubmit} className="card space-y-4">
            <p className="text-sm font-medium text-slate-500">Notice editor</p>
            <h3 className="text-2xl font-bold text-slate-900">{editingNoticeId ? "Update notice" : "Create notice"}</h3>
            <input
              className="input-field"
              placeholder="Notice title"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            />
            <textarea
              className="input-field min-h-48 resize-none"
              placeholder="Write the full notice"
              value={formData.content}
              onChange={(event) => setFormData({ ...formData, content: event.target.value })}
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving..." : editingNoticeId ? "Update notice" : "Publish notice"}
              </button>
              {editingNoticeId ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditingNoticeId("");
                    setFormData(initialNoticeForm);
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          <div className="space-y-4">
            {notices.length === 0 ? (
              <EmptyState title="No notices published" description="Write the first notice to communicate with tenants." />
            ) : (
              notices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  actions={
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          setEditingNoticeId(notice.id);
                          setFormData({
                            title: notice.title,
                            content: notice.content
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" className="secondary-button" onClick={() => handleDelete(notice.id)}>
                        Delete
                      </button>
                    </div>
                  }
                />
              ))
            )}
          </div>
        </section>
      ) : notices.length === 0 ? (
        <EmptyState title="No notices right now" description="Check back later for new announcements from admin." />
      ) : (
        <section className="grid gap-4">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </section>
      )}
    </div>
  );
}

export default NoticesPage;
