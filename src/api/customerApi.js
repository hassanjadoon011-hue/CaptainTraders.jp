import axiosClient from "./axiosClient";

export const getCustomers = async (params = {}) => (await axiosClient.get("/customers", { params })).data;
export const getCustomer = async (id) => (await axiosClient.get(`/customers/${id}`)).data.data;
export const matchCustomer = async (email) => (await axiosClient.get("/customers/match", { params: { email } })).data.data;
export const createCustomer = async (data) => (await axiosClient.post("/customers", data)).data.data;
export const updateCustomer = async (id, data) => (await axiosClient.patch(`/customers/${id}`, data)).data.data;
export const deleteCustomer = async (id) => (await axiosClient.delete(`/customers/${id}`)).data;
