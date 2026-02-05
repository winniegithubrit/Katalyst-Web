import { useState } from 'react';

const useSecureApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const callApi = async ({ 
    endpoint, 
    method = 'GET', 
    body = null, 
    headers = {}, 
    requiresAuth = true 
  }) => {
    setLoading(true);
    setError('');

    try {
      // Get environment variables
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const xApiKey = import.meta.env.VITE_X_API_KEY;
      const apiKey = import.meta.env.VITE_API_KEY;
      const loginBaseUrl = import.meta.env.VITE_LOGIN_BASE_URL;

      // Validate required environment variables
      if (!baseUrl || !xApiKey) {
        throw new Error('Missing required environment variables');
      }
      
      const isAuthEndpoint = endpoint.includes('/Auth/API/Account');
      const apiUrl = isAuthEndpoint ? `${loginBaseUrl}${endpoint}` : `${baseUrl}${endpoint}`;
      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-Api-Key': xApiKey,
        ...headers
      };

      if (apiKey && (endpoint.includes('/Auth/API/Account') || endpoint.includes('/System/API/Branch'))) {
        requestHeaders['ApiKey'] = apiKey;
      }
      if (requiresAuth) {
        const authToken = sessionStorage.getItem('authToken');
        
        if (!authToken) {
          console.warn('No authentication token found');
          return null;
        }
        requestHeaders['Authorization'] = `Bearer ${authToken}`;
      }
      const requestConfig = {
        method,
        headers: requestHeaders
      };
      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        requestConfig.body = JSON.stringify(body);
      }

      console.log('API Request:', {
        url: apiUrl,
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : null
      });
      const response = await fetch(apiUrl, requestConfig);
      const responseText = await response.text();
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.clear();
          throw new Error('Authentication failed. Please login again.');
        }

        if (response.status === 415) {
          throw new Error('Server does not accept JSON format.');
        }

        if (response.status === 400) {
          try {
            const errorData = JSON.parse(responseText);
            throw new Error(`Bad request: ${errorData.message || errorData.error || 'Check your data format'}`);
          } catch (parseError) {
            throw new Error(`Bad request: ${responseText || 'Check your data format'}`);
          }
        }

        throw new Error(`HTTP error! status: ${response.status} - ${responseText}`);
      }
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.warn('Could not parse response as JSON:', responseText);
        data = { status: 'SUCCESS', message: responseText };
      }

      return data;

    } catch (err) {
      console.error('API call error:', err);
      setError(err.message || 'An unexpected error occurred');
      if (err.message.includes('Authentication failed')) {
        console.error('Authentication failed ');
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { callApi, loading, error, setError };
};

export default useSecureApi;