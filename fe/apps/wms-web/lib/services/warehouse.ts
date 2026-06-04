import { fetchApi } from '../api-client';
import type { WarehouseEntity, ZoneType } from '../types';

export async function getWarehouses(): Promise<WarehouseEntity[]> {
  return fetchApi<WarehouseEntity[]>('wms', '/Warehouse');
}

export async function getWarehouseHierarchy(id: string): Promise<WarehouseEntity> {
  return fetchApi<WarehouseEntity>('wms', `/Warehouse/${id}/hierarchy`);
}

export async function createWarehouse(data: {
  name: string;
  code: string;
  locationText: string;
}): Promise<string> {
  return fetchApi<string>('wms', '/Warehouse', {
    method: 'POST',
    body: data,
  });
}

export async function createBlock(warehouseId: string, blockCode: string): Promise<string> {
  return fetchApi<string>('wms', `/Warehouse/${warehouseId}/blocks`, {
    method: 'POST',
    body: JSON.stringify(blockCode),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function createZone(blockId: string, zoneType: ZoneType): Promise<string> {
  return fetchApi<string>('wms', `/Warehouse/blocks/${blockId}/zones`, {
    method: 'POST',
    body: zoneType,
  });
}

export async function createBin(zoneId: string, data: {
  warehouseId: string;
  binCode: string;
}): Promise<string> {
  return fetchApi<string>('wms', `/Warehouse/zones/${zoneId}/bins`, {
    method: 'POST',
    body: data,
  });
}
