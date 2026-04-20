function SectionHeader({ eyebrow, title, description, actions = null }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">{eyebrow}</p> : null}
        <h2 className="mt-1 text-3xl font-bold text-slate-900">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export default SectionHeader;
