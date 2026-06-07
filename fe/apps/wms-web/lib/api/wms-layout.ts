import { WarehouseDto, WarehouseHierarchyDto, ZoneType, BinStatus } from '@/types/wms-layout';
import { fetchApi } from '@/lib/api-client';

// ============================================================================
// STRICT LIVE DATABASE MODE (FAIL-FAST) - NO MOCKS
// ============================================================================

// ----------------------------------------------------------------------------
// 1. GET ALL WAREHOUSES (Query all=true to fetch all system warehouses)
// ----------------------------------------------------------------------------
export const getWarehouses = async (all: boolean = false): Promise<WarehouseDto[]> => {
  try {
    const res = await fetchApi<WarehouseDto[]>('wms', `/warehouse?all=${all}`);
    return res || [];
  } catch (err) {
    console.error("Error fetching warehouses from live WMS DB:", err);
    throw err;
  }
};

// ----------------------------------------------------------------------------
// 2. GET WAREHOUSE HIERARCHY
// ----------------------------------------------------------------------------
export const getWarehouseHierarchy = async (id: string): Promise<WarehouseHierarchyDto> => {
  try {
    return await fetchApi<WarehouseHierarchyDto>('wms', `/warehouse/${id}/hierarchy`);
  } catch (err) {
    console.error(`Error fetching warehouse ${id} hierarchy from live DB:`, err);
    throw err;
  }
};

// ----------------------------------------------------------------------------
// 3. CREATE WAREHOUSE
// ----------------------------------------------------------------------------
export const createWarehouse = async (data: { code: string; name: string; locationText: string }) => {
  return fetchApi<WarehouseDto>('wms', '/warehouse', {
    method: 'POST',
    body: data
  });
};

export const deleteWarehouse = async (id: string): Promise<boolean> => {
  return fetchApi<boolean>('wms', `/warehouse/${id}`, {
    method: 'DELETE'
  });
};

// ----------------------------------------------------------------------------
// 4. CREATE BLOCK
// ----------------------------------------------------------------------------
export const createBlock = async (warehouseId: string, blockCode: string) => {
  return fetchApi('wms', `/warehouse/${warehouseId}/blocks`, {
    method: 'POST',
    body: { blockCode }
  });
};


// ----------------------------------------------------------------------------
// 5. CREATE ZONE
// ----------------------------------------------------------------------------
export const createZone = async (blockId: string, type: ZoneType) => {
  return fetchApi('wms', `/warehouse/blocks/${blockId}/zones`, {
    method: 'POST',
    body: { zoneType: type }
  });
};

// ----------------------------------------------------------------------------
// 6. CREATE BIN
// ----------------------------------------------------------------------------
export const createBin = async (zoneId: string, binCode: string, warehouseId: string, aisle?: string, rack?: string, shelf?: string, pickSequence?: number) => {
  return fetchApi('wms', `/warehouse/zones/${zoneId}/bins`, {
    method: 'POST',
    body: { warehouseId, binCode, aisle, rack, shelf, pickSequence }
  });
};

// ----------------------------------------------------------------------------
// 7. UPDATE BIN STATUS
// ----------------------------------------------------------------------------
export const updateBinStatus = async (binId: string, status: BinStatus) => {
  return fetchApi('wms', `/warehouse/bins/${binId}/status`, {
    method: 'PUT',
    body: { newStatus: status }
  });
};

// ----------------------------------------------------------------------------
// 8. WAREHOUSE ROUTES (NEXT-HOP MATRIX)
// ----------------------------------------------------------------------------
export const getWarehouseRoutes = async (): Promise<any[]> => {
  const res = await fetchApi<any>('wms', '/warehouseRoutes');
  return res?.value || res || [];
};

export const createWarehouseRoute = async (data: { sourceWarehouseId: string; destinationWarehouseId: string; nextHopWarehouseId: string }) => {
  const res = await fetchApi<any>('wms', '/warehouseRoutes', {
    method: 'POST',
    body: data
  });
  return res?.value || res;
};

export const deleteWarehouseRoute = async (id: string): Promise<boolean> => {
  await fetchApi('wms', `/warehouseRoutes/${id}`, {
    method: 'DELETE'
  });
  return true;
};
