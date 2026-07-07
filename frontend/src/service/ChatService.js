import { axiosInstance } from "../lib/axios.js";

export const getMessages = async (userId) => {
  try {
    const response = await axiosInstance.get(`/messages/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const sendMessage = async (userId, formData) => {
  try {
    const response = await axiosInstance.post(`/messages/send/${userId}`, formData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};