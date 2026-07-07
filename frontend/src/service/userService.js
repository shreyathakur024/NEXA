import { axiosInstance } from "../lib/axios.js";

export const updateProfile = async (formData) => {
    try {
        const response = await axiosInstance.put('/auth/update-profile', formData);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
}

export const getProfile = async () => {
  try {
    const response = await axiosInstance.get('/user/get-profile');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};