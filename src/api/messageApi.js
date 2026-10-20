import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

export default function MessagesPanel() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    axiosClient
      .get("/messages")
      .then((res) => {
        setMessages(res.data.data); // ✅ IMPORTANT FIX
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="bg-white border rounded-xl p-4">
      <h2 className="text-[#29ABE2] font-bold mb-3">
        Messages
      </h2>

      {messages.length === 0 ? (
        <p className="text-gray-400">No messages found</p>
      ) : (
        messages.map((m) => (
          <div key={m._id} className="border-b py-2">
            <p className="font-bold">{m.name}</p>
            <p className="text-sm text-gray-600">{m.message}</p>
          </div>
        ))
      )}
    </div>
  );
}