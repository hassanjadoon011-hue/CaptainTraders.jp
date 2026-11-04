import axiosClient from "./axiosClient";

/* ───────── PUBLIC ───────── */
export const createOrder = async (payload) =>
  (await axiosClient.post("/orders", payload)).data.data;

/* ───────── ADMIN: ORDERS ───────── */
export const getOrders = async (params = {}) =>
  (await axiosClient.get("/orders", { params })).data;

export const updateOrder = async (id, data) =>
  (await axiosClient.patch(`/orders/${id}`, data)).data;

export const deleteOrder = async (id) =>
  (await axiosClient.delete(`/orders/${id}`)).data;

/* ───────── ADMIN: DASHBOARD ───────── */
export const getDashboardSummary = async () =>
  (await axiosClient.get("/dashboard/summary")).data.data;
