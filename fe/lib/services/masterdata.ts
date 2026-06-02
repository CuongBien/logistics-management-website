import { fetchApi } from '../api-client';
import type { Partner } from '../types';

export async function getPartners(searchTerm: string = '', page: number = 1): Promise<Partner[]> {
  const res = await fetchApi<any>('masterdata', `/Partners?searchTerm=${searchTerm}&page=${page}&pageSize=50`);
  const items = res?.value?.items || res?.items || res || [];
  return items;
}

export async function getPartner(id: string): Promise<Partner> {
  const res = await fetchApi<any>('masterdata', `/Partners/${id}`);
  return res?.value || res;
}

export async function createPartner(data: Partial<Partner>): Promise<string> {
  let numericType = 2; // Default to Consignor (2)
  if (data.type === 'Consignee' || data.type === 1) numericType = 1;
  else if (data.type === 'Consignor' || data.type === 2 || data.type === 'Supplier') numericType = 2;
  else if (data.type === 'Carrier' || data.type === 3) numericType = 3;
  else if (data.type === 'Warehouse' || data.type === 4) numericType = 4;

  const res = await fetchApi<any>('masterdata', `/Partners`, {
    method: 'POST',
    body: {
      tenantId: data.tenantId || "default-tenant",
      code: data.code || `PART-${Date.now()}`,
      name: data.name,
      type: numericType,
      phone: data.phone,
      address: data.address,
      city: data.city,
      latitude: data.latitude || 0,
      longitude: data.longitude || 0
    }
  });
  return res?.value || res;
}

export async function updatePartner(id: string, data: Partial<Partner>): Promise<unknown> {
  const res: any = await fetchApi('masterdata', `/Partners/${id}`, {
    method: 'PUT',
    body: {
      name: data.name,
      phone: data.phone,
      address: data.address,
      city: data.city,
      latitude: data.latitude || 0,
      longitude: data.longitude || 0
    }
  });
  return res?.value !== undefined ? res.value : res;
}

export async function deactivatePartner(id: string): Promise<unknown> {
  const res: any = await fetchApi('masterdata', `/Partners/${id}`, {
    method: 'DELETE'
  });
  return res?.value !== undefined ? res.value : res;
}
