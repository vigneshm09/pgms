function StatCard({ title, value, accent }) {
  return (
    <div className="card overflow-hidden">
      <div className={`h-3 w-24 rounded-full ${accent}`} />
      <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default StatCard;
