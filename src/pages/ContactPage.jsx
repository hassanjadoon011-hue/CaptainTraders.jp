import { useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import {
  Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle, Car, HelpCircle,
} from "lucide-react";
import { CONTACT } from "../constants/siteConfig";

const SKY = "#29ABE2";
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INITIAL_FORM = {
  name: "",
  email: "",
  country: "",
  subject: "",
  message: "",
};

const SUBJECTS = ["Vehicle Inquiry", "Shipping", "Payment", "Support"];

const INFO = [
  {
    icon: Mail,
    title: "Email",
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    desc: "Please use the same email address each time",
  },
  {
    icon: Phone,
    title: "Phone",
    value: CONTACT.phone,
    href: `tel:${CONTACT.phone.replace(/[^+\d]/g, "")}`,
    desc: CONTACT.hours,
  },
  {
    icon: MapPin,
    title: "Office",
    value: CONTACT.address,
    desc: "Export headquarters",
  },
  {
    icon: Clock,
    title: "Business Hours",
    value: CONTACT.hours,
    desc: "Japan Standard Time",
  },
];

const fieldClass =
  "w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-[#29ABE2]/30 focus:border-[#29ABE2] outline-none bg-white text-sm";

const validate = (f) => {
  if (f.name.trim().length < 2) return "Please enter your name.";
  if (!EMAIL_RX.test(f.email.trim())) return "Please enter a valid email address.";
  if (!f.subject) return "Please select a subject.";
  if (f.message.trim().length < 10) return "Please write a message of at least 10 characters.";
  return "";
};

export default function ContactPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => {
    setError("");
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const problem = validate(form);
    if (problem) return setError(problem);

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
      <div className="bg-gradient-to-r from-[#29ABE2] to-[#1B7DB3] py-12 sm:py-16 px-4 text-center text-white">
        <h1 className="text-3xl sm:text-4xl font-extrabold">Contact Our Team</h1>
        <p className="text-white/80 mt-2 text-sm sm:text-base">
          Questions about a vehicle, payment or shipping? Send us a message.
        </p>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid lg:grid-cols-3 gap-6 sm:gap-8">

        {/* LEFT INFO CARDS */}
        <div className="space-y-4 min-w-0">
          {INFO.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
                  style={{ background: "#E0F5FF" }}
                >
                  <item.icon size={18} color={SKY} />
                </div>
                <h3 className="font-semibold text-slate-800">{item.title}</h3>
              </div>

              {item.href ? (
                <a href={item.href} className="text-sm font-medium text-slate-700 hover:text-[#29ABE2] break-all">
                  {item.value}
                </a>
              ) : (
                <p className="text-sm font-medium text-slate-700">{item.value}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}

          <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm space-y-3">
            <Link to="/cars" className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-[#29ABE2]">
              <Car size={17} color={SKY} /> Looking for a car? Browse our stock
            </Link>
            <Link to="/faq" className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-[#29ABE2]">
              <HelpCircle size={17} color={SKY} /> Read the frequently asked questions
            </Link>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="lg:col-span-2 min-w-0">
          <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-5 sm:p-8">

            {sent ? (
              <div className="text-center py-16 sm:py-20">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#E0F5FF] flex items-center justify-center">
                  <CheckCircle size={30} color={SKY} />
                </div>
                <h2 className="text-xl font-bold mt-4">Message Sent Successfully</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Thank you. Our team will reply by email as soon as possible during business hours.
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
                <h2 className="text-xl font-bold text-slate-800 mb-6">Send us a message</h2>

                {error && (
                  <div role="alert" className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      className={fieldClass}
                      placeholder="Full name *"
                      aria-label="Full name"
                      autoComplete="name"
                      maxLength={80}
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                    />

                    <input
                      type="email"
                      className={fieldClass}
                      placeholder="Email *"
                      aria-label="Email"
                      autoComplete="email"
                      maxLength={120}
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      className={fieldClass}
                      placeholder="Country"
                      aria-label="Country"
                      autoComplete="country-name"
                      maxLength={60}
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                    />

                    <select
                      className={fieldClass}
                      aria-label="Subject"
                      value={form.subject}
                      onChange={(e) => set("subject", e.target.value)}
                    >
                      <option value="">Select subject *</option>
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <textarea
                    className={fieldClass + " h-32 resize-none"}
                    placeholder="Write your message... (for a vehicle inquiry, please include the stock number)"
                    aria-label="Message"
                    maxLength={2000}
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
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