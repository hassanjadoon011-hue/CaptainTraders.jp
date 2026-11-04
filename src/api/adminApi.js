import axiosClient from "./axiosClient";

/* ───────── MY ACCOUNT ───────── */
export const changeMyPassword = async (currentPassword, newPassword) =>
  (await axiosClient.put("/admin/me/password", { currentPassword, newPassword })).data;

/* ───────── ADMIN USERS (owners only) ───────── */
export const getAdminUsers = async () => (await axiosClient.get("/admin/users")).data; // { data, roles }

export const createAdminUser = async (data) =>
  (await axiosClient.post("/admin/users", data)).data.data;

export const updateAdminUser = async (id, data) =>
  (await axiosClient.patch(`/admin/users/${id}`, data)).data.data;

export const deleteAdminUser = async (id) =>
  (await axiosClient.delete(`/admin/users/${id}`)).data;
