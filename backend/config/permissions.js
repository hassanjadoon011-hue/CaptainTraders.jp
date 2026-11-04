// Single source of truth for admin roles and what each role may do.
// The frontend receives the resolved permission list from GET /api/admin/me.

const VIEW = ["dashboard.view", "cars.view", "orders.view", "messages.view", "shipping.view"];

const ALL = [
  ...VIEW,
  "cars.create", "cars.edit", "cars.delete",
  "orders.edit", "orders.delete",
  "messages.edit", "messages.delete",
  "shipping.edit",
  "users.manage",
];

const ROLES = {
  owner: {
    label: "Owner",
    description: "Full access, including admin users.",
    permissions: ALL,
  },
  manager: {
    label: "Manager",
    description: "Full access except admin users.",
    permissions: ALL.filter((p) => p !== "users.manage"),
  },
  sales: {
    label: "Sales",
    description: "Add/edit cars, handle orders and messages. No deleting, no shipping rates.",
    permissions: [...VIEW, "cars.create", "cars.edit", "orders.edit", "messages.edit"],
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access.",
    permissions: VIEW,
  },
};

const ROLE_KEYS = Object.keys(ROLES);

// Accounts created before roles existed have role "admin": treat them as owners
const normalizeRole = (role) => (role === "admin" ? "owner" : ROLES[role] ? role : "viewer");

const permissionsFor = (role) => ROLES[normalizeRole(role)].permissions;

const roleList = () =>
  ROLE_KEYS.map((key) => ({ key, label: ROLES[key].label, description: ROLES[key].description }));

module.exports = { ROLES, ROLE_KEYS, normalizeRole, permissionsFor, roleList };
