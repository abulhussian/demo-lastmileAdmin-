// const getBaseUrl = () => {
//   if (typeof window !== 'undefined') {
//     if (window.location.hostname.includes('onrender.com')) {
//       return 'https://last-mile-backend-m63f.onrender.com/api';
//     }
//     return `  return 'http://192.168.1.8:5000/api';`;
//   }
//   return 'http://localhost:5005/api';
// };

const BASE_URL = `https://last-mile-backend-m63f.onrender.com/api`;
// const BASE_URL = `http://192.168.1.15:5005/api`;
// const BASE_URL = `https://debug-acquisition-drinks-charms.trycloudflare.com/api`



let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function handleTokenRefresh() {
  const userStr = localStorage.getItem('logiflow_user');
  if (!userStr) throw new Error('No user credentials found');

  const userObj = JSON.parse(userStr);
  const accessToken = userObj.token;
  const refreshToken = userObj.refreshToken;
  const role = (userObj.role || userObj.user?.role || '').toUpperCase();

  const refreshHeaders = new Headers();
  refreshHeaders.set('Content-Type', 'application/json');
  refreshHeaders.set('accept', '*/*');

  if (accessToken) {
    refreshHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const fetchOptions = {
    method: 'POST',
    headers: refreshHeaders,
    credentials: 'include'
  };

  if (refreshToken) {
    refreshHeaders.set('x-refresh-token', refreshToken);
    fetchOptions.body = JSON.stringify({ refreshToken });
  }

  const response = await fetch(`${BASE_URL}/auth/refresh`, fetchOptions);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Token refresh failed');
  }

  const newAccessToken = data.data?.accessToken || data.data?.token;
  const newRefreshToken = data.data?.refreshToken;

  if (newAccessToken) {
    userObj.token = newAccessToken;
    if (newRefreshToken) {
      userObj.refreshToken = newRefreshToken;
    }
    localStorage.setItem('logiflow_user', JSON.stringify(userObj));
    return newAccessToken;
  } else {
    throw new Error('No new access token returned');
  }
}

async function request(endpoint, options = {}) {
  const userStr = localStorage.getItem('logiflow_user');
  const headers = new Headers(options.headers || {});

  // Only set application/json if it's not FormData and not already set
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (userStr) {
    try {
      const { token } = JSON.parse(userStr);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401 && endpoint !== '/auth/demo-login' && endpoint !== '/auth/refresh') {
      const isTokenExpired = true;

      if (isTokenExpired) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              headers.set('Authorization', `Bearer ${token}`);
              return request(endpoint, options);
            })
            .catch((err) => {
              throw err;
            });
        }

        isRefreshing = true;

        try {
          const newToken = await handleTokenRefresh();
          isRefreshing = false;
          processQueue(null, newToken);

          headers.set('Authorization', `Bearer ${newToken}`);
          return request(endpoint, options);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError, null);
          localStorage.removeItem('logiflow_user');
          window.location.href = '/demo-login';
          throw refreshError;
        }
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Something went wrong');
    }

    // Map properties for frontend compatibility
    if (data && data.data) {
      if (data.data.accessToken && !data.data.token) {
        data.data.token = data.data.accessToken;
      }
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    return request(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body)
    });
  },
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  refreshToken: () => handleTokenRefresh(),
};
