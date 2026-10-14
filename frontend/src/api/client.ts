import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to requests
apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('veridex_token') || localStorage.getItem('trustguard_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // LocalStorage access fallback
  }
  return config;
});

// Handle 401 Unauthorized responses by clearing session
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if on login or public routes
      const currentPath = window.location.pathname;
      const isPublicRoute = currentPath === '/' || currentPath === '/login' || currentPath === '/register';
      
      try {
        localStorage.removeItem('veridex_token');
        localStorage.removeItem('trustguard_token');
      } catch {}

      if (!isPublicRoute && !currentPath.includes('/login')) {
        const nextQuery = encodeURIComponent(currentPath);
        window.location.href = `/login?next=${nextQuery}`;
      }
    }
    return Promise.reject(error);
  }
);
