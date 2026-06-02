import api from './api';
import { CreateUserPayload, User } from '../types';

export async function fetchUsers(): Promise<User[]> {
  const response = await api.get('/auth/users');
  return response.data;
}

export async function registerUser(payload: CreateUserPayload): Promise<User> {
  const response = await api.post('/auth/users', payload);
  return response.data;
}

export async function deactivateUser(id: number): Promise<void> {
  await api.patch(`/auth/users/${id}/deactivate`);
}
