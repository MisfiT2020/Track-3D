import axios from 'axios';

export const signupUser = async (userData: {
  username: string;
  email: string;
  password: string;
}) => {
  return axios.post('/sign-up', userData);
};
