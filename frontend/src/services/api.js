// services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("mb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("mb_token");
      localStorage.removeItem("mb_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
  me: () => API.get("/auth/me"),
};

export const emailAPI = {
  connect: (data) => API.post("/emails/connect", data),
  disconnect: () => API.post("/emails/disconnect"),
  fetch: (params) => API.get("/emails/fetch", { params }),
  categories: () => API.get("/emails/categories"),
  generateReply: (data) => API.post("/emails/reply/generate", data),
  sendReply: (data) => API.post("/emails/reply/send", data),
  markRead: (id) => API.patch(`/emails/${id}/read`),
};

export const paymentAPI = {
  status: () => API.get("/payment/status"),
  createOrder: () => API.post("/payment/create-order"),
  verify: (data) => API.post("/payment/verify", data),
  confirmUpi: (data) => API.post("/payment/confirm-upi", data),
};

export default API;
