export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  roleId?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ImageItem {
  id: number;
  filename: string;
  originalname: string;
  createdAt: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface RoleItem {
  id: number;
  name: string;
  description: string;
}
