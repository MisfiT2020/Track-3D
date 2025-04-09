import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const signupUser = async (userData: {
  username: string;
  email: string;
  password: string;
}) => {
  return axios.post(`${API_BASE_URL}/sign-up`, userData);
};
