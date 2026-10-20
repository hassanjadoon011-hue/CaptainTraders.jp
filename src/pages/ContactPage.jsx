import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle } from "lucide-react";

const SKY = "#29ABE2";

const INITIAL_FORM = {
  name: "",
  email: "",
  country: "",
  subject: "",
  message: "",
};

const INFO = [
  {
    icon: Mail,
    title: "Email",
    value: "info@captaintraders.jp",
    desc: "We reply within 24h",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+81-6-0000-0000",
    desc: "Mon–Fri 9:00–18:00 JST",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "Osaka, Japan",
    desc: "Export Headquarters",
  },
  {
    icon: Clock,
    title: "Working Hours",
    value: "09:00 – 18:00",
    desc: "Japan Standard Time",
  },
];

const fieldClass =
  "w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#29ABE2]/30 focus:border-[#29ABE2] outline-none bg-white";

export default function ContactPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);

    try {
      await axiosClient.post("/messages", {
        name: form.name.trim(),
        email: form.email.trim(),
        country: form.country.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });

      setSent(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      console.log(err);
      setError(
        err.response?.data?.message ||
          "Failed to send your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5FBFF]">

      {/* HERO */}
      <div className="bg-gradient-to-r from-[#29ABE2] to-[#1B7DB3] py-16 text-center text-white">
        <h1 className="text-4xl font-extrabold">Contact Our Team</h1>
        <p className="text-white/80 mt-2">
          Fast response • Global support • Trusted exporters
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-8">

        {/* LEFT INFO CARDS */}
        <div className="space-y-4">
          {INFO.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-xl"
                  style={{ background: "#E0F5FF" }}
                >
                  <item.icon size={18} color={SKY} />
                </div>
                <h3 className="font-semibold text-slate-800">
                  {item.title}
                </h3>
              </div>

              <p className="text-sm font-medium text-slate-700">
                {item.value}
              </p>
              <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* RIGHT FORM */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-8">

            {sent ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#E0F5FF] flex items-center justify-center">
                  <CheckCircle size={30} color={SKY} />
                </div>
                <h2 className="text-xl font-bold mt-4">
                  Message Sent Successfully
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                  Our team will contact you shortly.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-sm text-[#29ABE2] font-semibold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-800 mb-6">
                  Send us a message
                </h2>

                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5">
                    <AlertCircle size={18} />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      className={fieldClass}
                      placeholder="Full Name"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      required
                    />

                    <input
                      type="email"
                      className={fieldClass}
                      placeholder="Email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      className={fieldClass}
                      placeholder="Country"
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                    />

                    <select
                      className={fieldClass}
                      value={form.subject}
                      onChange={(e) => set("subject", e.target.value)}
                      required
                    >
                      <option value="">Select Subject</option>
                      <option>Vehicle Inquiry</option>
                      <option>Shipping</option>
                      <option>Payment</option>
                      <option>Support</option>
                    </select>
                  </div>

                  <textarea
                    className={fieldClass + " h-32 resize-none"}
                    placeholder="Write your message..."
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    required
                  />

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-[#29ABE2] hover:bg-[#1B7DB3] disabled:opacity-60 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Send size={16} />
                    {sending ? "Sending..." : "Send Message"}
                  </button>

                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}