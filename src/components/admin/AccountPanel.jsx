import { useState } from "react";
import { useAdmin, ROLE_LABELS } from "../../context/AdminAuthContext";
import { KeyRound, UserCog } from "lucide-react";
import { changeMyPassword } from "../../api/adminApi";
import { Badge, Card, CardHeader, PageHeader, StatusMessage, btnClass, inputClass, labelClass } from "./ui";

const MIN_PASSWORD = 12;

export default function AccountPanel() {
  const { admin } = useAdmin();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    if (form.next.length < MIN_PASSWORD) {
      return setStatus({ type: "error", text: `New password must be at least ${MIN_PASSWORD} characters.` });
    }
    if (form.next !== form.confirm) return setStatus({ type: "error", text: "The new passwords do not match." });

    setSaving(true);
    try {
      await changeMyPassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      setStatus({ type: "ok", text: "Password changed. Other devices have been logged out." });
    } catch (err) {
      setStatus({ type: "error", text: err.response?.data?.message || "Could not change password." });
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, autoComplete) => (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type="password"
        required
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={inputClass}
      />
    </label>
  );

  return (
    <div>
      <PageHeader title="My Account" subtitle="Your profile and sign-in security." />
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
      <Card>
        <CardHeader icon={UserCog} title="Profile" />
        <dl className="p-4 sm:p-5 space-y-3 text-sm">
          <div><dt className="text-xs text-gray-500">Name</dt><dd className="font-semibold text-gray-900">{admin?.name || "—"}</dd></div>
          <div><dt className="text-xs text-gray-500">Email</dt><dd className="font-semibold text-gray-900 break-all">{admin?.email}</dd></div>
          <div><dt className="text-xs text-gray-500 mb-1">Role</dt><dd><Badge tone="blue">{ROLE_LABELS[admin?.role] || admin?.role}</Badge></dd></div>
        </dl>
      </Card>

      <Card>
      <CardHeader icon={KeyRound} title="Change password" subtitle="Changing it logs you out on your other devices." />
      <form onSubmit={submit} className="p-4 sm:p-5 space-y-4 max-w-lg">
        {field("current", "Current password", "current-password")}
        {field("next", `New password (at least ${MIN_PASSWORD} characters)`, "new-password")}
        {field("confirm", "Confirm new password", "new-password")}

        <StatusMessage status={status} />

        <button type="submit" disabled={saving} className={`${btnClass("primary")} w-full sm:w-auto`}>
          {saving ? "Saving…" : "Change password"}
        </button>
      </form>
      </Card>
      </div>
    </div>
  );
}
