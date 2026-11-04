export const VEHICLE_TYPES = [
  { value: "domestic",        label: "Domestic / SUV" },
  { value: "hiace-van",       label: "Hiace Van" },
  { value: "pickup",          label: "Pick-up" },
  { value: "truck",           label: "Truck & Dump" },
  { value: "bus",             label: "Buses" },
  { value: "commercial",      label: "Commercial" },
  { value: "heavy-machinery", label: "Heavy Machinery" },
];

export const vehicleTypeLabel = (value) =>
  VEHICLE_TYPES.find((t) => t.value === value)?.label || "";

export const FEATURE_OPTIONS = [
  "A/C", "Power Steering", "Power Window", "Alloy Rim", "CD Player",
  "Digital Meter", "Air Bag", "TV", "ABS", "Navigation",
  "Back Camera", "Sunroof", "Leather Seats", "Push Start",
];

export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export const yearOptions = (count = 40) => {
  const current = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => current - i);
};

// "1000" -> "1000 cc", "2.0L" stays as it is
export const formatEngine = (engine) => {
  if (!engine) return null;
  const value = String(engine).trim();
  return /^\d+$/.test(value) ? `${value} cc` : value;
};

export const money = (n) => `$${Number(n || 0).toLocaleString()}`;

// Shown when a car has no photo (an inline image, so it never fails to load)
export const NO_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'>" +
      "<rect width='100%' height='100%' fill='#f3f4f6'/>" +
      "<text x='50%' y='50%' fill='#9ca3af' font-family='Arial' font-size='22' " +
      "text-anchor='middle' dominant-baseline='middle'>No Image</text></svg>"
  );