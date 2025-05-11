const BaseApiUrl = import.meta.env.VITE_LOGIN_URL;
const loginApiUrl = BaseApiUrl + '/login';
const refreshTokenUrl = BaseApiUrl + '/token/refresh';


export const login = async (username: string, password: string): Promise<string | void> => {
    try {
      const response = await fetch(loginApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the token in localStorage or a cookie
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        return '';
      } else {
        const text = await response.text();
        return `Login failed: ${text}`;
      }
    } catch (err) {
      console.error('Error logging in:', err);
      return 'An unexpected error occurred.';
    }
};

const refreshAuthToken = async (): Promise<void> => {
  try {
      const response = await fetch(refreshTokenUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('refreshToken')}`
          }
      });

      if (!response.ok) {
          throw new Error('Unable to refresh token');
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);
  } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.clear();
      window.location.href = '/login';
  }
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let response = await fetch(url, {
      ...options,
      headers: {
          ...options.headers,
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
      }
  });

  if (response.status === 401) {
      // Token expired; attempt to refresh
      await refreshAuthToken();
      response = await fetch(url, {
          ...options,
          headers: {
              ...options.headers,
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
      });
  } else if (response.status === 500) {
    await refreshAuthToken();
      response = await fetch(url, {
          ...options,
          headers: {
              ...options.headers,
              Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
      });
  }

  if (response.status === 401) {
      // If still unauthorized, force logout
      localStorage.clear();
      window.location.href = '/login';
  }

  return response;
};

