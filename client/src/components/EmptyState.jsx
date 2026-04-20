function EmptyState({ title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-blue-200 bg-white/70 p-8 text-center">
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default EmptyState;
