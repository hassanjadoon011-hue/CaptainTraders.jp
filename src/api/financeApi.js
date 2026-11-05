import axiosClient from "./axiosClient";

/* Car costs */
export const getCarCosts = async (carId) => (await axiosClient.get(`/cars/${carId}/costs`)).data.data;
export const savePurchase = async (carId, data) => (await axiosClient.put(`/cars/${carId}/purchase`, data)).data.data;

/* Expenses */
export const getExpenses = async (params = {}) => (await axiosClient.get("/expenses", { params })).data;
export const createExpense = async (data) => (await axiosClient.post("/expenses", data)).data.data;
export const updateExpense = async (id, data) => (await axiosClient.patch(`/expenses/${id}`, data)).data.data;
export const deleteExpense = async (id) => (await axiosClient.delete(`/expenses/${id}`)).data;

/* Payments */
export const getBalances = async (params = {}) => (await axiosClient.get("/payments/balances", { params })).data;
export const getPayments = async (params = {}) => (await axiosClient.get("/payments", { params })).data;
export const getOrderFinance = async (orderId) => (await axiosClient.get(`/payments/order/${orderId}`)).data.data;
export const createPayment = async (data) => (await axiosClient.post("/payments", data)).data;
export const updatePayment = async (id, data) => (await axiosClient.patch(`/payments/${id}`, data)).data.data;
export const deletePayment = async (id) => (await axiosClient.delete(`/payments/${id}`)).data;
