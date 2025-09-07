import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { apiRequest } from '../utils/api';

export function useTokenValidation() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateToken() {
      if (!isAuthenticated) {
        setIsTokenValid(false);
        return;
      }

      setIsValidating(true);
      
      try {
        const token = await getAccessTokenSilently();
        
        // Validate token with backend
        await apiRequest('/api/auth/validate', 'GET', null, token);
        
        if (isMounted) {
          setIsTokenValid(true);
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        if (isMounted) {
          setIsTokenValid(false);
        }
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    }

    validateToken();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, getAccessTokenSilently]);

  return { isTokenValid, isValidating };
}

export function useSecureApiRequest() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  return async function secureRequest(endpoint, method = 'GET', body = null) {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    try {
      const token = await getAccessTokenSilently();
      return await apiRequest(endpoint, method, body, token);
    } catch (error) {
      // Handle token expiry or invalid token
      if (error.status === 401) {
        // Force token refresh
        try {
          const newToken = await getAccessTokenSilently({ 
            cacheMode: 'off' 
          });
          return await apiRequest(endpoint, method, body, newToken);
        } catch (refreshError) {
          throw new Error('Authentication failed. Please log in again.');
        }
      }
      throw error;
    }
  };
}