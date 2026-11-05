import { createContext, useContext } from "react";

// The logged-in admin ({ id, name, email, role, permissions }), provided by ProtectedRoute
export const AdminAuthContext = createContext({ admin: null, refresh: () => {} });

export function useAdmin() {
  const { admin, refresh } = useContext(AdminAuthContext);
  const permissions = admin?.permissions || [];
  const can = (perm) => permissions.includes(perm);
  return { admin, can, refresh };
}

export const ROLE_LABELS = {
  owner: "Owner",
  manager: "Manager",
  sales: "Sales",
  viewer: "Viewer",
};
