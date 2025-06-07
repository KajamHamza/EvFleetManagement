
import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/services/api-client';
import { AxiosError } from 'axios';

export const ErrorHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  useEffect(() => {
    // Add a global error handler for uncaught axios errors
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Only show toast for actual API errors, not for every 403
        if (error.response && error.config?.url) {
          const status = error.response.status;
          const data = error.response.data as any;
          const url = error.config.url;
          
          // Skip showing toast for simulation API 403 errors as they're expected when backend is not available
          if (status === 403 && url.includes('/simulation/')) {
            console.log('Simulation API not available (403), skipping toast');
            return Promise.reject(error);
          }
          
          if (status === 401) {
            toast({
              title: "Authentication Error",
              description: "Your session has expired. Please log in again.",
              variant: "destructive",
              duration: 5000,
            });
          } else if (status === 403) {
            // Only show permission denied for non-simulation APIs
            if (!url.includes('/simulation/')) {
              toast({
                title: "Permission Denied",
                description: "You don't have permission to perform this action.",
                variant: "destructive",
                duration: 5000,
              });
            }
          } else if (status === 500) {
            toast({
              title: "Server Error",
              description: "Something went wrong. Please try again later.",
              variant: "destructive",
              duration: 5000,
            });
          } else if (data && data.message && status !== 403) {
            // Don't show generic error messages for 403s
            toast({
              title: "Error",
              description: data.message,
              variant: "destructive",
              duration: 5000,
            });
          }
        } else if (error.request && !error.config?.url?.includes('/simulation/')) {
          // Only show network errors for non-simulation APIs
          toast({
            title: "Network Error",
            description: "Could not connect to the server. Please check your internet connection.",
            variant: "destructive",
            duration: 5000,
          });
        }
        
        return Promise.reject(error);
      }
    );

    // Clean up the interceptor when the component unmounts
    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, [toast]);

  return <>{children}</>;
};

export default ErrorHandler;
