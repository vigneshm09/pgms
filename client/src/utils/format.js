export function formatCurrency(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(numericValue);
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function getStatusClasses(status) {
  const normalized = (status || "").toUpperCase();

  if (normalized === "APPROVED" || normalized === "PAID" || normalized === "AVAILABLE") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalized === "REJECTED" || normalized === "OCCUPIED") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-amber-100 text-amber-700";
}

export function formatStatus(status) {
  return (status || "").replaceAll("_", " ") || "-";
}
