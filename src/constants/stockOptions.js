export const usd = (n) =>
  n === null || n === undefined || n === "" || Number.isNaN(Number(n))
    ? "N/A"
    : `${Number(n).toLocaleString("en-US", {
        minimumFractionDigits: Number.isInteger(Math.round(Number(n) * 100) / 100) ? 0 : 2, // $217.50, not $217.5
        maximumFractionDigits: 2,
      })}`;

export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

export const orderRef = (n) => `CT-${n}`;

export const ORDER_STATUSES = [
  { value: "new",       label: "New",       className: "bg-[#E0F5FF] text-[#1B7DB3]" },
  { value: "invoiced",  label: "Invoiced",  className: "bg-amber-50 text-amber-700" },
  { value: "paid",      label: "Paid",      className: "bg-green-50 text-green-700" },
  { value: "shipped",   label: "Shipped",   className: "bg-sky-50 text-sky-700" },
  { value: "completed", label: "Completed", className: "bg-slate-100 text-slate-700" },
  { value: "cancelled", label: "Cancelled", className: "bg-red-50 text-red-600" },
];

export const statusMeta = (value) =>
  ORDER_STATUSES.find((s) => s.value === value) || ORDER_STATUSES[0];

// EDIT THESE with the client's real terms before launch
export const ORDER_TERMS = [
  {
    title: "Payment",
    body: "The buyer pays the full amount of the proforma invoice by telegraphic transfer (T/T) within 48 hours. After paying, send us the bank transfer slip with your invoice number.",
  },
  {
    title: "Extension",
    body: "If more than 48 hours are needed to transfer the money, ask us to extend the reservation period.",
  },
  {
    title: "Vehicle condition",
    body: "Vehicles are sold as they are. Please check the photos and specifications carefully before ordering.",
  },
  {
    title: "Delivery",
    body: "When the vessel reaches your port, you are responsible for customs clearance, duties, registration and collecting the vehicle.",
  },
  {
    title: "Holding your order",
    body: "We hold your order for 48 hours after your confirmation. If we do not receive the payment, the order is cancelled automatically and the vehicle can be sold to others.",
  },
  {
    title: "Email",
    body: "Please always use the same email address when you contact us.",
  },
  {
    title: "Proforma invoice",
    body: "You will receive the proforma invoice by email after you place the order.",
  },
];