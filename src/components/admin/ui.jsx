// Shared admin UI building blocks — one look for every admin page.
// Brand: #29ABE2 (primary), #1B7DB3 (primary dark), #0A1628 (navy text), #E0F5FF (tint)

export const cx = (...c) => c.filter(Boolean).join(" ");

export const inputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-base sm:text-sm text-gray-800 outline-none transition " +
  "placeholder:text-gray-400 focus:border-[#29ABE2] focus:ring-2 focus:ring-[#29ABE2]/20 " +
  "disabled:bg-gray-50 disabled:text-gray-400";

export const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5";

const BTN = {
  primary: "bg-[#29ABE2] text-white hover:bg-[#1B7DB3] shadow-sm",
  secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
  ghost: "text-gray-600 hover:bg-gray-100",
  danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
};

export const btnClass = (variant = "primary", size = "md") =>
  cx(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition whitespace-nowrap",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#29ABE2]/40 disabled:opacity-50 disabled:cursor-not-allowed",
    size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
    BTN[variant]
  );

export function Button({ variant = "primary", size = "md", className = "", ...props }) {
  return <button type="button" className={cx(btnClass(variant, size), className)} {...props} />;
}

// Square icon-only button. tone="danger" for delete, active for toggles.
export function IconButton({ label, tone, active, className = "", children, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cx(
        "w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center transition disabled:opacity-40",
        active
          ? "bg-[#E0F5FF] border-[#29ABE2]/30 text-[#1B7DB3]"
          : tone === "danger"
          ? "bg-white border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
          : "bg-white border-gray-200 text-gray-500 hover:text-[#1B7DB3] hover:border-[#29ABE2]/40 hover:bg-[#F0FAFF]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-[#0A1628] tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Card({ className = "", children, ...props }) {
  return (
    <div className={cx("bg-white rounded-xl border border-gray-200/70 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

// Card section title row
export function CardHeader({ title, subtitle, icon: Icon, actions, className = "" }) {
  return (
    <div className={cx("px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="w-9 h-9 rounded-lg bg-[#E0F5FF] text-[#1B7DB3] flex items-center justify-center shrink-0">
            <Icon size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#0A1628]">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  blue: "bg-[#E0F5FF] text-[#1B7DB3]",
  green: "bg-green-50 text-green-700 ring-green-600/15",
  red: "bg-red-50 text-red-700 ring-red-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/15",
  gray: "bg-gray-100 text-gray-600",
};

export function Badge({ tone = "gray", className = "", children }) {
  return (
    <span className={cx("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ring-1 ring-inset ring-transparent", TONES[tone], className)}>
      {children}
    </span>
  );
}

// Underlined tab bar used on list pages
export function Tabs({ tabs, value, onChange, className = "" }) {
  return (
    <div className={cx("flex gap-1 overflow-x-auto no-scrollbar", className)} role="tablist">
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value || "all"}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cx(
              "px-3 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition",
              active ? "border-[#29ABE2] text-[#1B7DB3]" : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cx("ml-1.5 text-xs font-medium", active ? "text-[#29ABE2]" : "text-gray-400")}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="py-12 px-4 text-center">
      {Icon && (
        <span className="mx-auto w-11 h-11 rounded-full bg-[#F0FAFF] text-[#29ABE2] flex items-center justify-center">
          <Icon size={20} />
        </span>
      )}
      <p className="mt-3 text-sm font-semibold text-gray-800">{title}</p>
      {text && <p className="mt-1 text-sm text-gray-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Inline success / error line used by forms
export function StatusMessage({ status }) {
  if (!status) return null;
  return (
    <p
      role={status.type === "ok" ? "status" : "alert"}
      className={cx(
        "text-sm rounded-lg px-3 py-2 border",
        status.type === "ok" ? "text-green-700 bg-green-50 border-green-100" : "text-red-600 bg-red-50 border-red-100"
      )}
    >
      {status.text}
    </p>
  );
}
