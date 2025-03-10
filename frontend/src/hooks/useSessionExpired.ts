import { useState, useEffect } from 'react';

const useSessionExpired = () => {
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    const handleSessionExpired = () => setSessionExpired(true);
    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, []);
  return [sessionExpired, setSessionExpired] as const;
};

export default useSessionExpired;
