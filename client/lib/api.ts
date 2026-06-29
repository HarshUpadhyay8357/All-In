import axios from "axios";
import { useAuthStore } from "./auth-store";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
});

//adds token to every request
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

//refreshes access tokens on 401 error status
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; 
      const { refreshToken } = useAuthStore.getState();

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/refresh`,
            { refreshToken },
          );

          const accessToken = response.data;

          useAuthStore.setState({ accessToken });

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return api(originalRequest);
        } catch (error) {
          useAuthStore.getState().logout;
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
