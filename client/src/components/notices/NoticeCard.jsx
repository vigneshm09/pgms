import { formatDateTime } from "../../utils/format";

function NoticeCard({ notice, actions = null }) {
  return (
    <article className="rounded-3xl border border-blue-100 bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{notice.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{notice.content}</p>
        </div>
        {actions}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        Posted {formatDateTime(notice.created_at)}
      </p>
    </article>
  );
}

export default NoticeCard;
