export class User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'CLIENT';
  createdAt: Date;
  refreshToken?: string;
  name?: string;
}
