import api from './api';
import { CreateUserPayload, RoleItem, User } from '../types';

export async function fetchUsers(): Promise<User[]> {
  const response = await api.get('/auth/users');
  return response.data.users.map((user: any) => ({
    ...user,
    role: user.Role?.name ?? user.role ?? 'User',
    roleId: user.Role?.id ?? user.roleId,
  }));
}

export async function fetchRoles(): Promise<RoleItem[]> {
  const response = await api.get('/auth/roles');
  return response.data.roles;
}

export async function registerUser(payload: CreateUserPayload): Promise<User> {
  const response = await api.post('/auth/create-user', payload);
  return {
    ...response.data.user,
    role: response.data.user.role || payload.role,
  };
}

export async function assignRole(userId: number, roleId: number): Promise<User> {
  const response = await api.post('/auth/assign-role', { userId, roleId });
  return {
    ...response.data.user,
    role: response.data.user.role,
    roleId: response.data.user.roleId,
  };
}

export async function deactivateUser(id: number): Promise<void> {
  await api.post('/auth/deactivate-user', { userId: id });
}

export async function removeUser(id: number): Promise<void> {
  await api.delete(`/auth/users/${id}`);
}
