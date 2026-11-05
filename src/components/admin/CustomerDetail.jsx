import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Building2, Pencil, Trash2, Inbox, Ship, MessageSquare } from "lucide-react";
import { getCustomer, updateCustomer, deleteCustomer } from "../../api/customerApi";
import { useAdmin } from "../../context/AdminAuthContext";
import { formatDate, orderRef } from "../../constants/stockOptions";
import CustomerForm, { customerStatus, toCustomerForm, fromCustomerForm } from "./CustomerForm";
import Modal from "../common/Modal";
import {
  Badge, Button, Card, CardHeader, Drawer, EmptyState, OrderStatusBadge, PAYMENT_LABELS, PAYMENT_TONES,
  PageHeader, Stat, StatusMessage, btnClass, money,
} from "./ui";

const SHIP_LABEL = (s) => s.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase());

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAdmin();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(toCustomerForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    getCustomer(id).then(setData).catch((e) => setError(e.response?.data?.message || "Could not load this customer."));
  }, [id]);
  useEffect(load, [load]);

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await updateCustomer(id, fromCustomerForm(form));
      setEditing(false);
      load();
    } catch (e) {
      setFormError({ type: "error", text: e.response?.data?.message || "Could not save." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await deleteCustomer(id);
      navigate("/admin/customers");
    } catch {
      setConfirmDelete(false);
    }
  };

  if (error) return <Card className="p-6 text-sm text-gray-600">{error} <Link to="/admin/customers" className="text-[#1B7DB3] font-semibold">Back to customers</Link></Card>;
  if (!data) return <Card className="p-6 text-sm text-gray-500">Loading…</Card>;

  const { customer: c, orders, messages, shipments, payments, summary } = data;
  const st = customerStatus(c.status);
  const finance = can("finance.view");

  return (
    <div className="space-y-5">
      <PageHeader
        title={c.name}
        subtitle={`Customer since ${formatDate(c.createdAt)} · added from ${c.source}`}
        actions={<>
          <Link to="/admin/customers" className={btnClass("secondary")}><ArrowLeft size={16} /> Customers</Link>
          {can("customers.edit") && <Button variant="secondary" onClick={() => { setForm(toCustomerForm(c)); setFormError(null); setEditing(true); }}><Pencil size={15} /> Edit</Button>}
          {can("customers.delete") && <Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 size={15} /> Delete</Button>}
        </>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
        {/* PROFILE */}
        <Card>
          <CardHeader title="Profile" actions={<Badge tone={st.tone}>{st.label}</Badge>} />
          <div className="p-4 sm:p-5 space-y-2.5 text-sm text-gray-700">
            {c.email && <p className="flex gap-2.5"><Mail size={15} className="text-gray-400 mt-0.5 shrink-0" /><a href={`mailto:${c.email}`} className="text-[#1B7DB3] hover:underline break-all">{c.email}</a></p>}
            {(c.phone || c.whatsapp) && <p className="flex gap-2.5"><Phone size={15} className="text-gray-400 mt-0.5 shrink-0" />{[c.phone, c.whatsapp && `WhatsApp ${c.whatsapp}`].filter(Boolean).join(" · ")}</p>}
            {c.company && <p className="flex gap-2.5"><Building2 size={15} className="text-gray-400 mt-0.5 shrink-0" />{c.company}</p>}
            {(c.address || c.city || c.country) && <p className="flex gap-2.5"><MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />{[c.address, c.city, c.country].filter(Boolean).join(", ")}</p>}
            {c.deliveryPort && <p className="text-xs text-gray-500">Usual port: {c.deliveryPort}</p>}
            {c.tags?.length > 0 && <div className="flex flex-wrap gap-1 pt-1">{c.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>}
            {c.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{c.notes}</p>}
            <p className="text-xs text-gray-400 pt-1">Last contact {formatDate(c.lastContactAt) || "—"}</p>
          </div>
        </Card>

        <div className="space-y-5 min-w-0">
          {/* SUMMARY */}
          <Card className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Orders" value={summary.orders} />
            <Stat label="Inquiries" value={summary.inquiries} />
            {finance ? <>
              <Stat label="Paid" value={money(summary.totalPaid)} tone="green" />
              <Stat label="Outstanding" value={money(summary.outstanding)} tone={summary.outstanding > 0 ? "red" : undefined} />
            </> : <>
              <Stat label="Shipments" value={summary.shipments} />
              <Stat label="Messages" value={summary.messages} />
            </>}
          </Card>

          {/* ORDERS */}
          <Card className="overflow-hidden">
            <CardHeader icon={Inbox} title={`Order history (${orders.length})`} />
            {orders.length === 0 ? <EmptyState title="No orders or inquiries yet" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider whitespace-nowrap">
                      <th className="px-5 py-2.5 text-left font-semibold">Ref</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Vehicle</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                      {finance && <th className="px-4 py-2.5 text-right font-semibold">Total</th>}
                      {finance && <th className="px-4 py-2.5 text-left font-semibold">Payment</th>}
                      <th className="px-5 py-2.5 text-left font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o._id}>
                        <td className="px-5 py-2.5 whitespace-nowrap font-semibold text-[#0A1628]">{orderRef(o.orderNo)} <span className="text-xs font-normal text-gray-500">{o.type}</span></td>
                        <td className="px-4 py-2.5 text-gray-700">{o.carInfo?.title || "—"}</td>
                        <td className="px-4 py-2.5"><OrderStatusBadge status={o.status} /></td>
                        {finance && <td className="px-4 py-2.5 text-right tabular-nums">{money(o.finance?.due)}</td>}
                        {finance && <td className="px-4 py-2.5"><Badge tone={PAYMENT_TONES[o.finance?.status]}>{PAYMENT_LABELS[o.finance?.status]}</Badge></td>}
                        <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* SHIPMENTS */}
            <Card>
              <CardHeader icon={Ship} title={`Shipments (${shipments.length})`} actions={shipments.length > 0 && <Link to="/admin/shipments" className="text-xs font-semibold text-[#1B7DB3] hover:underline">All shipments →</Link>} />
              {shipments.length === 0 ? <EmptyState title="No shipments yet" /> : (
                <ul className="divide-y divide-gray-100">
                  {shipments.map((s) => (
                    <li key={s._id} className="px-4 sm:px-5 py-3 text-sm">
                      <div className="flex justify-between gap-2"><span className="font-semibold text-gray-900">{s.vessel || "Vessel TBC"}</span><Badge tone="blue">{SHIP_LABEL(s.status)}</Badge></div>
                      <p className="text-xs text-gray-500 mt-0.5">{[s.portOfLoading, s.portOfDischarge].filter(Boolean).join(" → ") || "Route TBC"}{s.eta ? ` · ETA ${formatDate(s.eta)}` : ""}{s.blNo ? ` · B/L ${s.blNo}` : ""}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* MESSAGES / PAYMENTS */}
            {finance && payments.length > 0 ? (
              <Card>
                <CardHeader title={`Payments (${payments.length})`} actions={<Link to="/admin/payments" className="text-xs font-semibold text-[#1B7DB3] hover:underline">All payments →</Link>} />
                <ul className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <li key={p._id} className="px-4 sm:px-5 py-3 text-sm flex justify-between gap-3">
                      <span><span className="font-semibold text-gray-900">{money(p.amount, p.currency)}</span> <span className="text-xs text-gray-500">{p.method.toUpperCase()}{p.reference ? ` · ${p.reference}` : ""}</span></span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(p.receivedAt)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : (
              <Card>
                <CardHeader icon={MessageSquare} title={`Messages (${messages.length})`} />
                {messages.length === 0 ? <EmptyState title="No messages" /> : (
                  <ul className="divide-y divide-gray-100">
                    {messages.map((m) => (
                      <li key={m._id} className="px-4 sm:px-5 py-3 text-sm">
                        <div className="flex justify-between gap-2"><span className="font-semibold text-gray-900 truncate">{m.subject || "Message"}</span><span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(m.createdAt)}</span></div>
                        <p className="text-gray-600 mt-0.5 line-clamp-2">{m.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      <Drawer open={editing} title="Edit customer" onClose={() => setEditing(false)}
        footer={<><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button></>}>
        <div className="space-y-4">
          <CustomerForm form={form} setForm={setForm} currentId={c._id} />
          <StatusMessage status={formError} />
        </div>
      </Drawer>

      <Modal isOpen={confirmDelete} title="Delete customer?" confirmText="Delete" onClose={() => setConfirmDelete(false)} onConfirm={remove}>
        <p className="text-sm text-gray-600">The customer record is removed. Their orders, payments and messages are kept.</p>
      </Modal>
    </div>
  );
}
