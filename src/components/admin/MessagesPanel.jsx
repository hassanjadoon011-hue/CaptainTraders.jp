import { useEffect, useState, useCallback } from "react";
import { Mail, Trash2, CheckCheck, Reply } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, CardHeader, EmptyState, IconButton, PageHeader, btnClass, cx } from "./ui";
import axiosClient from "../../api/axiosClient";
import { useAdmin } from "../../context/AdminAuthContext";

const notifyHeader = () => window.dispatchEvent(new Event("messages-updated"));

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function MessagesPanel({ compact = false }) {
  const { can } = useAdmin();
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axiosClient.get("/messages", { params: { limit: compact ? 5 : 50 } });
      setMessages(res.data?.data || []);
      setTotal(res.data?.pagination?.total ?? 0);
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch (err) {
      console.log(err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [compact]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleOpen = async (m) => {
    setOpenId(openId === m._id ? null : m._id);

    if (!m.isRead) {
      try {
        await axiosClient.patch(`/messages/${m._id}/read`);
        await fetchMessages();
        notifyHeader();
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleMarkAll = async () => {
    try {
      await axiosClient.patch("/messages/read-all");
      await fetchMessages();
      notifyHeader();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    try {
      await axiosClient.delete(`/messages/${id}`);
      await fetchMessages();
      notifyHeader();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      {!compact && <PageHeader
        title="Messages"
        subtitle={`Contact form messages from your website · ${total} total${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        actions={
          unreadCount > 0 && can("messages.edit") && (
            <Button variant="secondary" onClick={handleMarkAll}>
              <CheckCheck size={16} /> Mark all as read
            </Button>
          )
        }
      />}
      <Card className="overflow-hidden">
        {compact && (
          <CardHeader
            title="Recent messages"
            subtitle={`${unreadCount} unread`}
            actions={<Link to="/admin/messages" className="text-xs font-semibold text-[#1B7DB3] hover:underline">View all →</Link>}
          />
        )}

      {/* LIST */}
      {loading ? (
        <div className="p-4 space-y-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : messages.length === 0 ? (
        <EmptyState icon={Mail} title="No messages yet" text="Messages from your contact page will appear here." />
      ) : (
        <div className="divide-y divide-gray-100">
          {messages.map((m) => {
            const isOpen = openId === m._id;
            return (
              <div
                key={m._id}
                className={cx("px-4 sm:px-5 py-4 transition", m.isRead ? "hover:bg-gray-50/60" : "bg-[#F0FAFF]")}
              >
                <div className="flex items-start gap-3">
                  <div className={cx(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                    m.isRead ? "bg-gray-100 text-gray-500" : "bg-[#29ABE2] text-white"
                  )}>
                    {(m.name || "?").charAt(0).toUpperCase()}
                  </div>

                  <button
                    onClick={() => handleOpen(m)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm text-gray-900 truncate ${m.isRead ? "font-medium" : "font-bold"}`}>
                        {m.name}
                      </p>
                      {!m.isRead && (
                        <span className="w-2 h-2 bg-[#29ABE2] rounded-full" />
                      )}
                      <span className="text-xs text-gray-500 ml-auto whitespace-nowrap">
                        {formatDate(m.createdAt)}
                      </span>
                    </div>

                    {(m.subject || m.country) && (
                      <p className="text-xs text-gray-700 font-semibold mt-0.5 break-words">
                        {[m.subject, m.country].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    <p
                      className={`text-sm text-gray-600 mt-1 ${
                        isOpen ? "whitespace-pre-wrap break-words" : "line-clamp-1"
                      }`}
                    >
                      {m.message}
                    </p>
                  </button>

                  {can("messages.delete") && (
                  <IconButton label="Delete message" tone="danger" onClick={() => handleDelete(m._id)}>
                    <Trash2 size={15} />
                  </IconButton>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-3 ml-0 sm:ml-12 flex items-center gap-3 flex-wrap">
                    {m.email ? (
                      <a href={`mailto:${m.email}`} className={btnClass("primary", "sm")}>
                        <Reply size={14} /> Reply by email
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No email provided</span>
                    )}
                    {m.email && (
                      <span className="text-xs text-gray-500 break-all">{m.email}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </Card>
    </div>
  );
}