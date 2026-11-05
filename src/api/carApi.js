import axiosClient from "./axiosClient";

/* GET ALL (optionally with filters, e.g. { make: "Toyota", limit: 12 }) */
export const getCars = async (params = {}) => {
  const res = await axiosClient.get("/cars", { params });
  return res.data.data;
};

/* GET A PAGE (cars + pagination info) */
export const getCarsPage = async (params = {}) => {
  const res = await axiosClient.get("/cars", { params });
  return res.data;
};

/* FILTER OPTIONS (makes, models of a make, locations, colors ...) */
export const getFilterOptions = async (make) => {
  const res = await axiosClient.get("/cars/meta", {
    params: make ? { make } : {},
  });
  return res.data.data;
};

/* GET SINGLE */
export const getCarById = async (id) => {
  const res = await axiosClient.get(`/cars/${id}`);
  return res.data.data;
};

/* CREATE */
export const createCar = async (data) => {
  const res = await axiosClient.post("/cars", data);
  return res.data.data;
};

/* UPDATE */
export const updateCar = async (id, data) => {
  const res = await axiosClient.put(`/cars/${id}`, data);
  return res.data.data;
};

/* DELETE */
export const deleteCar = async (id) => {
  const res = await axiosClient.delete(`/cars/${id}`);
  return res.data;
};

export const setCarStatus = async (id, status) => {
  return updateCar(id, { status });
};