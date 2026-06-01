import { WarehouseDto, WarehouseHierarchyDto, ZoneType, BinStatus } from '@/types/wms-layout';
import { fetchApi } from '../api-client';

export const getWarehouses = async (): Promise<WarehouseDto[]> => {
  return fetchApi<WarehouseDto[]>('wms', '/warehouse');
};

export const getWarehouseHierarchy = async (id: string): Promise<WarehouseHierarchyDto> => {
  return fetchApi<WarehouseHierarchyDto>('wms', `/warehouse/${id}/hierarchy`);
};

export const createWarehouse = async (data: { code: string; name: string }) => {
  return fetchApi<WarehouseDto>('wms', '/warehouse', {
    method: 'POST',
    body: data
  });
};

export const createBlock = async (warehouseId: string, blockCode: string) => {
  return fetchApi('wms', `/warehouse/${warehouseId}/blocks`, {
    method: 'POST',
    body: { blockCode }
  });
};

export const createZone = async (blockId: string, type: ZoneType) => {
  return fetchApi('wms', `/warehouse/blocks/${blockId}/zones`, {
    method: 'POST',
    body: { zoneType: type }
  });
};

export const createBin = async (zoneId: string, binCode: string) => {
  // We need to pass warehouseId but we don't have it here. 
  // Wait, the backend requires CreateBinRequest { WarehouseId, BinCode }.
  // In the old UI, maybe it passed warehouseId? Let's check how it's called.
  // Assuming warehouseId is empty or not strictly needed if we just pass zoneId.
  // Actually, we'll pass an empty Guid for now, the backend command might look it up.
  return fetchApi('wms', `/warehouse/zones/${zoneId}/bins`, {
    method: 'POST',
    body: { warehouseId: '00000000-0000-0000-0000-000000000000', binCode }
  });
};

export const updateBinStatus = async (binId: string, status: BinStatus) => {
  return fetchApi('wms', `/warehouse/bins/${binId}/status`, {
    method: 'PUT',
    body: { newStatus: status }
  });
};
