// List of endpoints and allowed roles for auth-service
export const AUTH_ENDPOINTS = {
  '/auth/login': ['user', 'admin'],
  '/auth/register': ['user', 'admin'],
  '/auth/profile': ['user'],
  '/auth/admin': ['admin'],
};
