import axios from "axios";

// Local development: http://localhost:5000/api
// Production (Vercel): set VITE_API_URL=/api and Vercel forwards it to the backend
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 20000,
});

export default axiosClient;