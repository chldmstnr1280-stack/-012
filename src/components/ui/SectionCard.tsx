export function SectionCard({
  icon,
  title,
  aside,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass rounded-[26px] p-4 ${className ?? ""}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon && <span className="grid h-7 w-7 place-items-center">{icon}</span>}
        <h2 className="text-[15.5px] font-bold text-ink-700">{title}</h2>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  );
}
