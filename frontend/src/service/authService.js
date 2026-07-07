import { axiosInstance } from "../lib/axios.js";

export const loginUser = async (credentials) => {
  try {
    const response = await axiosInstance.post('/auth/login', credentials);
    // Token is automatically stored by interceptor
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};


// Signup ka logic yahan aayega
export const signupUser = async (userData) => {
  try {
    const response = await axiosInstance.post('/auth/signup', userData);
    // Token is automatically stored by interceptor
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const checkAuthUser = async () => {
  try {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const logoutUser = async()=>{
    try {
        const response = await axiosInstance.post('/auth/logout')
        // Clear token from localStorage
        localStorage.removeItem("authToken");
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

