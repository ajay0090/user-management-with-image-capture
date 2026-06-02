export interface User {
  id: number;
  email: string;
  role: string;
  active: boolean;
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
  email: string;
  password: string;
  role: string;
}
