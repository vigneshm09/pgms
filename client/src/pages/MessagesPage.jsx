import { useEffect, useState } from "react";

import api from "../api";
import ChatPanel from "../components/messages/ChatPanel";
import SectionHeader from "../components/SectionHeader";
import { useAuth } from "../hooks/useAuth";

function MessagesPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const loadThreads = async () => {
    try {
      const response = await api.get("/messages/threads");
      setThreads(response.data);
      if (!selectedThreadId && response.data.length > 0) {
        setSelectedThreadId(response.data[0].user_id);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load conversations.");
    }
  };

  const loadConversation = async (threadUserId) => {
    if (!threadUserId) {
      setMessages([]);
      return;
    }

    try {
      const response = await api.get(`/messages/${threadUserId}`);
      setMessages(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load messages.");
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    loadConversation(selectedThreadId);
  }, [selectedThreadId]);

  const handleSend = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !selectedThreadId) {
      return;
    }

    setSending(true);
    setError("");

    try {
      await api.post("/messages/send", {
        receiver_id: selectedThreadId,
        message: draft
      });
      setDraft("");
      await Promise.all([loadThreads(), loadConversation(selectedThreadId)]);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Messages"
        title={user?.role === "ADMIN" ? "Chat with tenants" : "Chat with admin"}
        description="Structured conversations keep rent updates, clarifications, and follow-ups in one place."
      />

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

      <ChatPanel
        threads={threads}
        selectedThreadId={selectedThreadId}
        onSelectThread={setSelectedThreadId}
        messages={messages}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        sending={sending}
      />
    </div>
  );
}

export default MessagesPage;
