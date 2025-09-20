import { useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ServiceFactory } from '../services';

export const useServices = () => {
  const { getToken } = useAuth();

  const services = useMemo(() => {
    return new ServiceFactory(getToken);
  }, [getToken]);

  return services;
};
