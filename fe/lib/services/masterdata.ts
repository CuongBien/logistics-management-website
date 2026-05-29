import { fetchApi } from '../api-client';
import type { Partner } from '../types';

export async function getPartners(searchTerm: string = '', page: number = 1): Promise<Partner[]> {
  // MasterData service might be running on a different port, assuming it's available through the same gateway or handled in api-client.
  // We will map 'wms' for now, but in reality it might be 'masterdata'
  return fetchApi<Partner[]>('wms', `/partners?searchTerm=${searchTerm}&page=${page}`);
}

export async function getPartner(id: string): Promise<Partner> {
  return fetchApi<Partner>('wms', `/partners/${id}`);
}

export async function createPartner(data: Partial<Partner>): Promise<string> {
  return fetchApi<string>('wms', `/partners`, {
    method: 'POST',
    body: data
  });
}

export async function updatePartner(id: string, data: Partial<Partner>): Promise<unknown> {
  return fetchApi('wms', `/partners/${id}`, {
    method: 'PUT',
    body: data
  });
}

export async function deactivatePartner(id: string): Promise<unknown> {
  return fetchApi('wms', `/partners/${id}`, {
    method: 'DELETE'
  });
}
