import axiosClient from "./axiosClient";

/* GET ALL */
export const getCars = async () => {
  const res = await axiosClient.get("/cars");
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