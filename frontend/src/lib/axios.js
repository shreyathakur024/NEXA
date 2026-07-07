import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5004";

export const axiosInstance = axios.create({
    baseURL: "http://localhost:5004/api",
    withCredentials: true,
});

// Add token to Authorization header if it exists
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
        };
    }
    return config;
});

// Store token from response headers
axiosInstance.interceptors.response.use((response) => {
    const token = response.headers["x-auth-token"];
    if (token) {
        localStorage.setItem("authToken", token);
    }
    return response;
});

