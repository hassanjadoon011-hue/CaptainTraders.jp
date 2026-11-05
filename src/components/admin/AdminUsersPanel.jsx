import { useCallback, useEffect, useState } from "react";
import { UserPlus, Trash2, KeyRound, X } from "lucide-react";
import Modal from "../common/Modal";
import { useNotification } from "../../context/NotificationContext";
import { useAdmin, ROLE_LABELS } from "../../context/AdminAuthContext";
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from "../../api/adminApi";
import { Badge, Card, CardHeader, IconButton, PageHeader, btnClass, inputClass as baseInput, labelClass } from "./ui";

const MIN_PASSWORD = 12;
const inputClass = baseInput;
const errMsg = (e) => e?.response?.data?.message || "Something went wrong. Please try again.";
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Never";

const EMPTY = { name: "", email: "", password: "", role: "sales" };

export default function AdminUsersPanel() {
  const { admin: me } = useAdmin();
  const { addNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [resetFor, setResetFor] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteFor, setDeleteFor] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getAdminUsers();
      setUsers(res.data || []);
      setRoles(res.roles || []);
    } catch (e) {
      addNotification(errMsg(e), "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (u, data, okText) => {
    try {
      const updated = await updateAdminUser(u.id, data);
      setUsers((list) => list.map((x) => (x.id === u.id ? updated : x)));
      addNotification(okText, "success");
      return true;
    } catch (e) {
      addNotification(errMsg(e), "error");
      return false;
    }
  };

  const create = async (e) => {
    e.preventDefault();
    setFormError("");
    if (form.password.length < MIN_PASSWORD) return setFormError(`Password must be at least ${MIN_PASSWORD} characters.`);
    setSaving(true);
    try {
      const created = await createAdminUser(form);
      setUsers((list) => [...list, created]);
      setForm(EMPTY);
      setShowAdd(false);
      addNotification("Admin user added.", "success");
    } catch (e2) {
      setFormError(errMsg(e2));
    } finally {
      setSaving(false);
    }
  };

  const confirmReset = async () => {
    if (newPassword.length < MIN_PASSWORD) {
      return addNotification(`Password must be at least ${MIN_PASSWORD} characters.`, "error");
    }
    if (await patch(resetFor, { password: newPassword }, "Password reset. That user must log in again.")) {
      setResetFor(null);
      setNewPassword("");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteAdminUser(deleteFor.id);
      setUsers((list) => list.filter((x) => x.id !== deleteFor.id));
      addNotification("Admin user deleted.", "success");
    } catch (e) {
      addNotification(errMsg(e), "error");
    } finally {
      setDeleteFor(null);
    }
  };

  if (loading) return <Card className="p-6 text-sm text-gray-500">Loading…</Card>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Admin Users"
        subtitle="Who can access the admin panel and what they can do."
        actions={
          <button
            type="button"
            onClick={() => { setShowAdd((v) => !v); setFormError(""); }}
            className={btnClass(showAdd ? "secondary" : "primary")}
          >
            {showAdd ? <X size={16} /> : <UserPlus size={16} />} {showAdd ? "Cancel" : "Add user"}
          </button>
        }
      />

      {/* Role guide */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((r) => (
          <div key={r.key} className="bg-white border border-gray-200/70 shadow-sm rounded-xl p-4">
            <p className="text-sm font-bold text-[#0A1628]">{r.label}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.description}</p>
          </div>
        ))}
      </section>

      {showAdd && (
        <Card>
        <CardHeader icon={UserPlus} title="New admin user" subtitle="They can log in right away with this email and password." />
        <form onSubmit={create} className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className={labelClass}>Name</span>
            <input className={inputClass} value={form.name} maxLength={80}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input className={inputClass} type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block">
            <span className={labelClass}>Temporary password</span>
            <input className={inputClass} type="password" required autoComplete="new-password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <span className="block text-xs text-gray-400 mt-1">At least {MIN_PASSWORD} characters. They can change it in My Account.</span>
          </label>
          <label className="block">
            <span className={labelClass}>Role</span>
            <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </label>
          {formError && (
            <p role="alert" className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className={`${btnClass("primary")} w-full sm:w-auto`}>
              {saving ? "Adding…" : "Add user"}
            </button>
          </div>
        </form>
        </Card>
      )}

      {/* Users */}
      <Card>
      <CardHeader title={`Accounts (${users.length})`} />
      <section className="divide-y divide-gray-100">
        {users.map((u) => {
          const isMe = u.id === me?.id;
          return (
            <div key={u.id} className={`px-4 sm:px-5 py-4 grid grid-cols-1 md:grid-cols-[1.6fr_1fr_0.7fr_auto] gap-3 md:items-center ${u.isActive ? "" : "bg-gray-50/70"}`}>
              <div className="min-w-0 flex items-center gap-3">
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${u.isActive ? "bg-[#E0F5FF] text-[#1B7DB3]" : "bg-gray-100 text-gray-400"}`}>
                  {(u.name || u.email).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {u.name || u.email}
                  {isMe && <Badge tone="blue" className="ml-2">You</Badge>}
                  {!u.isActive && <Badge tone="gray" className="ml-2">Inactive</Badge>}
                </p>
                <p className="text-xs text-gray-500 truncate">{u.email} · Last login: {formatDate(u.lastLoginAt)}</p>
                </div>
              </div>

              <select
                aria-label={`Role for ${u.email}`}
                className={inputClass}
                value={u.role}
                disabled={isMe}
                onChange={(e) => patch(u, { role: e.target.value }, `Role changed to ${ROLE_LABELS[e.target.value]}.`)}
              >
                {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>

              <label className={`flex items-center gap-2 text-sm ${isMe ? "text-gray-400" : "text-gray-700"}`}>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#29ABE2]"
                  checked={u.isActive}
                  disabled={isMe}
                  onChange={(e) => patch(u, { isActive: e.target.checked }, e.target.checked ? "Account activated." : "Account deactivated.")}
                />
                Active
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setResetFor(u); setNewPassword(""); }}
                  className={`${btnClass("secondary")} flex-1 md:flex-none`}
                >
                  <KeyRound size={15} /> Reset password
                </button>
                {!isMe && (
                  <IconButton label={`Delete ${u.email}`} tone="danger" className="!w-10 !h-10" onClick={() => setDeleteFor(u)}>
                    <Trash2 size={16} />
                  </IconButton>
                )}
              </div>
            </div>
          );
        })}
      </section>
      </Card>

      <Modal
        isOpen={!!resetFor}
        title="Reset password"
        confirmText="Reset"
        onClose={() => setResetFor(null)}
        onConfirm={confirmReset}
      >
        <p className="text-sm text-gray-600 mb-3">
          New password for <b>{resetFor?.email}</b>. They will be logged out of every device.
        </p>
        <input className={inputClass} type="password" autoComplete="new-password" value={newPassword}
          placeholder={`At least ${MIN_PASSWORD} characters`} onChange={(e) => setNewPassword(e.target.value)} />
      </Modal>

      <Modal
        isOpen={!!deleteFor}
        title="Delete admin user?"
        confirmText="Delete"
        onClose={() => setDeleteFor(null)}
        onConfirm={confirmDelete}
      >
        <p className="text-sm text-gray-600">
          <b>{deleteFor?.email}</b> will lose access immediately. To pause access instead, untick “Active”.
        </p>
      </Modal>
    </div>
  );
}
