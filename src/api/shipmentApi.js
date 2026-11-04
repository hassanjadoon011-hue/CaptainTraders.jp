import axiosClient from "./axiosClient";

export const getShipments = async (params = {}) => (await axiosClient.get("/shipments", { params })).data;
export const getShipment = async (id) => (await axiosClient.get(`/shipments/${id}`)).data.data;
export const getOrderShipment = async (orderId) => (await axiosClient.get(`/shipments/order/${orderId}`)).data.data;
export const createShipment = async (data) => (await axiosClient.post("/shipments", data)).data.data;
export const updateShipment = async (id, data) => (await axiosClient.patch(`/shipments/${id}`, data)).data.data;
export const deleteShipment = async (id) => (await axiosClient.delete(`/shipments/${id}`)).data;
export const addShipmentDocument = async (id, data) => (await axiosClient.post(`/shipments/${id}/documents`, data)).data.data;
export const removeShipmentDocument = async (id, docId) => (await axiosClient.delete(`/shipments/${id}/documents/${docId}`)).data.data;
