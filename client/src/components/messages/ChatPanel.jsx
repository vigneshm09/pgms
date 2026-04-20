import EmptyState from "../EmptyState";
import { formatDateTime } from "../../utils/format";

function ChatPanel({
  threads,
  selectedThreadId,
  onSelectThread,
  messages,
  draft,
  onDraftChange,
  onSend,
  sending
}) {
  const selectedThread = threads.find((thread) => thread.user_id === selectedThreadId) || threads[0] || null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.34fr_0.66fr]">
      <aside className="card">
        <h3 className="text-xl font-bold text-slate-900">Conversations</h3>
        <div className="mt-4 grid gap-3">
          {threads.length === 0 ? (
            <EmptyState title="No conversations yet" description="Start by creating a tenant account or sending the first message." />
          ) : (
            threads.map((thread) => (
              <button
                key={thread.user_id}
                type="button"
                onClick={() => onSelectThread(thread.user_id)}
                className={`rounded-3xl border p-4 text-left transition ${
                  selectedThreadId === thread.user_id
                    ? "border-brand-500 bg-brand-50"
                    : "border-blue-100 bg-slate-50 hover:border-blue-200"
                }`}
              >
                <p className="text-base font-bold text-slate-900">{thread.name}</p>
                <p className="mt-1 text-sm text-slate-500">{thread.email}</p>
                <p className="mt-3 line-clamp-2 text-sm text-slate-500">{thread.latest_message || "No messages yet"}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                  {thread.latest_timestamp ? formatDateTime(thread.latest_timestamp) : "Ready to chat"}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="card flex min-h-[36rem] flex-col">
        {selectedThread ? (
          <>
            <div className="border-b border-blue-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900">{selectedThread.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{selectedThread.email}</p>
            </div>

            <div className="mt-5 flex-1 space-y-3 overflow-y-auto rounded-3xl bg-slate-50 p-4">
              {messages.length === 0 ? (
                <EmptyState title="No messages yet" description="This conversation is ready when you are." />
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === "sent" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-[1.5rem] px-4 py-3 text-sm shadow-sm ${
                        message.direction === "sent" ? "bg-brand-500 text-white" : "bg-white text-slate-700"
                      }`}
                    >
                      <p className="leading-6">{message.message}</p>
                      <p
                        className={`mt-2 text-[11px] uppercase tracking-[0.12em] ${
                          message.direction === "sent" ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {formatDateTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={onSend} className="mt-5 flex flex-col gap-3 md:flex-row">
              <textarea
                value={draft}
                onChange={(event) => onDraftChange(event.target.value)}
                placeholder="Write a message"
                className="input-field min-h-24 resize-none"
              />
              <button type="submit" className="primary-button md:self-end" disabled={sending || !draft.trim()}>
                {sending ? "Sending..." : "Send message"}
              </button>
            </form>
          </>
        ) : (
          <EmptyState title="Choose a conversation" description="Select a tenant or admin to open the message thread." />
        )}
      </section>
    </div>
  );
}

export default ChatPanel;
