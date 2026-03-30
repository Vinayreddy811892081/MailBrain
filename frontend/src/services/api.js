// services/api.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mb_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === "ERR_NETWORK") {
      console.error("🚨 NETWORK ERROR - Backend not reachable");
    }

    if (err.response?.status === 401) {
      console.warn("🔐 401 - Token expired or invalid");
      localStorage.removeItem("mb_token");
      window.location.href = "/login";
    }

    return Promise.reject(err);
  },
);

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

export const emailAPI = {
  connect: (data) => api.post("/emails/connect", data),
  disconnect: () => api.post("/emails/disconnect"),
  fetch: (params) => api.get("/emails/fetch", { params }),
  categories: () => api.get("/emails/categories"),
  generateReply: (data) => api.post("/emails/reply/generate", data),
  sendReply: (data) => api.post("/emails/reply/send", data),
  markRead: (id) => api.patch(`/emails/${id}/read`),
};

export const paymentAPI = {
  status: () => api.get("/payment/status"),
  createOrder: () => api.post("/payment/create-order"),
  verify: (data) => api.post("/payment/verify", data),
  confirmUpi: (data) => api.post("/payment/confirm-upi", data),
};

export default api;
