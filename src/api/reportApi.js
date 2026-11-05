import axiosClient from "./axiosClient";

const get = async (path, params) => (await axiosClient.get(`/reports/${path}`, { params })).data.data;

export const getProfitLoss = (params) => get("profit-loss", params);
export const getVehicleReport = (params) => get("vehicles", params);
export const getCountryReport = (params) => get("countries", params);
export const getInventoryReport = () => get("inventory");
export const getReceivables = (params) => get("receivables", params);
