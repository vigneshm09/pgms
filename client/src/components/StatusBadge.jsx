import { formatStatus, getStatusClasses } from "../utils/format";

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(status)}`}>
      {formatStatus(status)}
    </span>
  );
}

export default StatusBadge;
