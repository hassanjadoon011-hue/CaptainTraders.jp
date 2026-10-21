import { useEffect, useState, useCallback } from "react";
import { Mail, Trash2, CheckCheck } from "lucide-react";
import axiosClient from "../../api/axiosClient";

const notifyHeader = () => window.dispatchEvent(new Event("messages-updated"));

const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function MessagesPanel() {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await axiosClient.get("/messages", { params: { limit: 50 } });
      setMessages(res.data?.data || []);
      setTotal(res.data?.pagination?.total ?? 0);
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch (err) {
      console.log(err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    <div className="bg-white border border-gray-100 rounded-xl">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 sm:px-5 py-4 border-b">
        <h2 className="font-bold text-gray-800">Messages</h2>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-xs text-[#29ABE2] font-semibold hover:underline"
            >
              <CheckCheck size={14} />
              Mark all as read
            </button>
          )}
          <span className="text-xs bg-[#29ABE2]/10 text-[#29ABE2] px-2.5 py-1 rounded-full font-semibold">
            {total} total
          </span>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <p className="px-5 py-8 text-sm text-center text-gray-400">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="px-5 py-8 text-sm text-center text-gray-400">No messages yet</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {messages.map((m) => {
            const isOpen = openId === m._id;
            return (
              <div
                key={m._id}
                className={`px-4 sm:px-5 py-4 ${m.isRead ? "" : "bg-[#29ABE2]/5"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-[#29ABE2]/10 rounded-full flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-[#29ABE2]" />
                  </div>

                  <button
                    onClick={() => handleOpen(m)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm text-gray-800 truncate ${m.isRead ? "font-medium" : "font-bold"}`}>
                        {m.name}
                      </p>
                      {!m.isRead && (
                        <span className="w-2 h-2 bg-[#29ABE2] rounded-full" />
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {formatDate(m.createdAt)}
                      </span>
                    </div>

                    {(m.subject || m.country) && (
                      <p className="text-xs text-[#29ABE2] font-medium mt-0.5 break-words">
                        {[m.subject, m.country].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    <p
                      className={`text-sm text-gray-500 mt-1 ${
                        isOpen ? "whitespace-pre-wrap break-words" : "line-clamp-1"
                      }`}
                    >
                      {m.message}
                    </p>
                  </button>

                  <button
                    onClick={() => handleDelete(m._id)}
                    title="Delete message"
                    className="text-gray-300 hover:text-red-500 transition shrink-0 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-3 ml-0 sm:ml-12 flex items-center gap-3 flex-wrap">
                    {m.email ? (
                      <a
                        href={`mailto:${m.email}`}
                        className="text-xs bg-[#29ABE2] text-white font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition"
                      >
                        Reply by email
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No email provided</span>
                    )}
                    {m.email && (
                      <span className="text-xs text-gray-400 break-all">{m.email}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}