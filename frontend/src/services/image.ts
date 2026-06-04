import api from './api';
import { ImageItem } from '../types';

export async function uploadImage(file: File): Promise<ImageItem> {
  const form = new FormData();
  form.append('image', file);
  const response = await api.post('/images/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.image;
}

export async function fetchUserImages(): Promise<ImageItem[]> {
  const response = await api.get('/images/my-images');
  return response.data.images;
}

export async function deleteImage(id: number): Promise<void> {
  await api.delete(`/images/${id}`);
}
