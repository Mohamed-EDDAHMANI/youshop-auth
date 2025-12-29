export class User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'CLIENT';
  createdAt: Date;
  refreshToken?: string;
  name?: string;
}
