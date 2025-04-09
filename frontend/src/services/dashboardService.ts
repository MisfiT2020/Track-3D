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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchProtectedData = async (token: string) => {
  return axios.get<ProtectedData>(`${API_BASE_URL}/protected`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const fetchRecentImports = async (token: string) => {
  return axios.get<RecentImport[]>(`${API_BASE_URL}/recent-imports`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const fetchAdminUsers = async (token: string) => {
  return axios.get(`${API_BASE_URL}/admin-panel-users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const uploadCSVFile = async (token: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post(`${API_BASE_URL}/predict`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
};
