import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useAuthRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);
};

export default useAuthRedirect;
