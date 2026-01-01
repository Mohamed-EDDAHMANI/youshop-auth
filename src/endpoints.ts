// List of endpoints and allowed roles for auth-service (Regex based)

export interface EndpointConfig {
  pattern: RegExp;
  roles: string[];
}

export const AUTH_ENDPOINTS: EndpointConfig[] = [
  {
    pattern: /^\/auth\/login\/post$/,
    roles: ['user', 'admin'],
  },
  {
    pattern: /^\/auth\/register\/post$/,
    roles: ['user', 'admin'],
  },
  {
    pattern: /^\/auth\/logout\/post$/,
    roles: ['user', 'admin'],
  },
  {
    pattern: /^\/auth\/refresh\/post$/,
    roles: ['user', 'admin'],
  },
];
