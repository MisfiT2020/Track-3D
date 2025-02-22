import axios from 'axios';
import { ProtectedData, RecentImport } from '../types/dashboardTypes';
import { useEffect, useState } from 'react';

const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = () => {
      const t = localStorage.getItem('token');
      setToken(t);
    };
    
    checkToken();
    window.addEventListener('storage', checkToken);
    return () => window.removeEventListener('storage', checkToken);
  }, []);

  return { token };
};

export default useAuth;

export const fetchProtectedData = async (token: string) => {
  return axios.get<ProtectedData>('/protected', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const fetchRecentImports = async (token: string) => {
  return axios.get<RecentImport[]>('/recent-imports', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const fetchAdminUsers = async (token: string) => {
  return axios.get('/admin-panel-users', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const uploadCSVFile = async (token: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post('/predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
};
