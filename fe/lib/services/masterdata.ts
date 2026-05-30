import { fetchApi } from '../api-client';
import type { Partner } from '../types';

export async function getPartners(searchTerm: string = '', page: number = 1): Promise<Partner[]> {
  const res: any = await fetchApi('masterdata', `/partners?searchTerm=${searchTerm}&page=${page}`);
  if (res?.value?.items) return res.value.items;
  if (Array.isArray(res?.value)) return res.value;
  if (Array.isArray(res)) return res;
  return [];
}

export async function getPartner(id: string): Promise<Partner> {
  const res: any = await fetchApi('masterdata', `/partners/${id}`);
  return res?.value || res;
}

export async function createPartner(data: Partial<Partner>): Promise<string> {
  const res: any = await fetchApi('masterdata', `/partners`, {
    method: 'POST',
    body: data
  });
  return res?.value || res;
}

export async function updatePartner(id: string, data: Partial<Partner>): Promise<unknown> {
  const res: any = await fetchApi('masterdata', `/partners/${id}`, {
    method: 'PUT',
    body: data
  });
  return res?.value !== undefined ? res.value : res;
}

export async function deactivatePartner(id: string): Promise<unknown> {
  const res: any = await fetchApi('masterdata', `/partners/${id}`, {
    method: 'DELETE'
  });
  return res?.value !== undefined ? res.value : res;
}
