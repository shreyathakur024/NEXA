import axios from "axios";

let apiBaseUrl = import.meta.env.VITE_API_URL || "https://nexa-hj2s.onrender.com/api";

// Ensure baseURL ends with /api
if (apiBaseUrl) {
    const trimmed = apiBaseUrl.replace(/\/+$/, "");
    if (!trimmed.endsWith("/api")) {
        apiBaseUrl = `${trimmed}/api`;
    } else {
        apiBaseUrl = trimmed;
    }
}

export const axiosInstance = axios.create({
    baseURL: apiBaseUrl,
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

