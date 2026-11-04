import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, Users } from "lucide-react";
import { getCustomers, createCustomer } from "../../api/customerApi";
import { useAdmin } from "../../context/AdminAuthContext";
import { formatDate } from "../../constants/stockOptions";
import CustomerForm, { CUSTOMER_STATUSES, customerStatus, toCustomerForm, fromCustomerForm } from "./CustomerForm";
import { Badge, Button, Card, Drawer, EmptyState, PageHeader, StatusMessage, Tabs, inputClass, cx } from "./ui";

export default function CustomersPanel() {
  const { can } = useAdmin();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(toCustomerForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({ page, limit: 20, status: status || undefined, search: search.trim() || undefined });
      setRows(res.data || []);
      setCounts(res.counts || {});
      setPagination(res.pagination || { totalPages: 1, total: 0 });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const save = async () => {
    setError(null);
    if (form.name.trim().length < 2) return setError({ type: "error", text: "Enter the customer's name." });
    setSaving(true);
    try {
      const c = await createCustomer(fromCustomerForm(form));
      navigate(`/admin/customers/${c._id}`);
    } catch (e) {
      setError({ type: "error", text: e.response?.data?.message || "Could not save the customer." });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [{ value: "", label: "All", count: counts.all || 0 }, ...CUSTOMER_STATUSES.map((s) => ({ value: s.value, label: s.label, count: counts[s.value] || 0 }))];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Everyone who contacted you or bought a car. New inquiries are added automatically."
        actions={can("customers.edit") && (
          <Button onClick={() => { setForm(toCustomerForm()); setError(null); setAdding(true); }}>
            <UserPlus size={16} /> Add customer
          </Button>
        )}
      />

      <Card className="overflow-hidden">
        <div className="px-4 sm:px-5 border-b border-gray-100">
          <Tabs tabs={tabs} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        </div>
        <div className="p-4 sm:px-5 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="search" aria-label="Search customers" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, phone, company or country" className={cx(inputClass, "pl-9")} />
          </div>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">{Array(5).fill(0).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title={search || status ? "No matching customers" : "No customers yet"} text="Customers appear here when they send an inquiry, an order or a message." />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">
                    <th className="px-5 py-3 text-left font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold">Country</th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Phone</th>
                    <th className="px-4 py-3 text-right font-semibold">Requests</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Last contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((c) => (
                    <tr key={c._id} onClick={() => navigate(`/admin/customers/${c._id}`)} className="cursor-pointer hover:bg-[#F5F9FF] transition">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.email || "No email"}{c.company ? ` · ${c.company}` : ""}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.country || "—"}</td>
                      <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">{c.phone || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{c.orderCount}</td>
                      <td className="px-4 py-3"><Badge tone={customerStatus(c.status).tone}>{customerStatus(c.status).label}</Badge></td>
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(c.lastContactAt || c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-gray-100">
              {rows.map((c) => (
                <button key={c._id} type="button" onClick={() => navigate(`/admin/customers/${c._id}`)} className="w-full text-left p-4 hover:bg-[#F5F9FF] transition">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    <Badge tone={customerStatus(c.status).tone}>{customerStatus(c.status).label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{c.email || "No email"}</p>
                  <p className="text-xs text-gray-500 mt-1">{c.country || "—"} · {c.orderCount} request{c.orderCount === 1 ? "" : "s"} · {formatDate(c.lastContactAt || c.createdAt)}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">Page {page} of {pagination.totalPages} · {pagination.total} customers</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button variant="secondary" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <Drawer
        open={adding}
        title="Add customer"
        onClose={() => setAdding(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save customer"}</Button>
        </>}
      >
        <div className="space-y-4">
          <CustomerForm form={form} setForm={setForm} />
          <StatusMessage status={error} />
        </div>
      </Drawer>
    </div>
  );
}
