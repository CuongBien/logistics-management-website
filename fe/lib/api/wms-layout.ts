import { WarehouseDto, WarehouseHierarchyDto, ZoneType, BinStatus } from '@/types/wms-layout';
import { fetchApi } from '@/lib/api-client';

// ============================================================================
// DUAL-MODE API STRATEGY (MOCK VS REAL DATABASE CONNECTION)
// ============================================================================
const USE_MOCK = false; 

// Mocked database for warehouses (when in Mock Mode)
const MOCK_WAREHOUSES: WarehouseDto[] = [
  { id: 'wh-1', code: 'ATL-01', name: 'Atlanta Main Hub' },
  { id: 'wh-2', code: 'JFK-02', name: 'New York Crossdock' },
];

// Mocked database for hierarchies mapped by warehouseId
const MOCK_HIERARCHIES: Record<string, WarehouseHierarchyDto> = {
  'wh-1': {
    warehouseId: 'wh-1',
    code: 'ATL-01',
    name: 'Atlanta Main Hub',
    blocks: [
      {
        id: 'blk-1',
        code: 'BLK-A',
        zones: [
          {
            id: 'zone-1',
            type: 'Inbound',
            bins: [
              { id: 'bin-1', binCode: 'IN-A-01', status: 'Available' },
              { id: 'bin-2', binCode: 'IN-A-02', status: 'Occupied' },
            ]
          },
          {
            id: 'zone-2',
            type: 'Storage',
            bins: [
              { id: 'bin-3', binCode: 'ST-A-01', status: 'Full' },
            ]
          }
        ]
      }
    ]
  },
  'wh-2': {
    warehouseId: 'wh-2',
    code: 'JFK-02',
    name: 'New York Crossdock',
    blocks: [
      {
        id: 'blk-2',
        code: 'BLK-B1',
        zones: [
          {
            id: 'zone-3',
            type: 'CrossDock',
            bins: [
              { id: 'bin-4', binCode: 'CD-B-01', status: 'Available' },
            ]
          }
        ]
      }
    ]
  }
};

// ----------------------------------------------------------------------------
// 1. GET ALL WAREHOUSES
// ----------------------------------------------------------------------------
export const getWarehouses = async (): Promise<WarehouseDto[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_WAREHOUSES;
  }
  
  try {
    const res = await fetchApi<WarehouseDto[]>('wms', '/warehouse');
    if (!res || res.length === 0) {
      return MOCK_WAREHOUSES;
    }
    return res;
  } catch (err) {
    console.error("Error fetching warehouses from live WMS DB:", err);
    return MOCK_WAREHOUSES;
  }
};

// ----------------------------------------------------------------------------
// 2. GET WAREHOUSE HIERARCHY
// ----------------------------------------------------------------------------
export const getWarehouseHierarchy = async (id: string): Promise<WarehouseHierarchyDto> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (!MOCK_HIERARCHIES[id]) {
      const warehouse = MOCK_WAREHOUSES.find(w => w.id === id);
      MOCK_HIERARCHIES[id] = {
        warehouseId: id,
        code: warehouse?.code || 'UNK-00',
        name: warehouse?.name || 'Unknown Warehouse',
        blocks: []
      };
    }
    return MOCK_HIERARCHIES[id];
  }
  
  try {
    return await fetchApi<WarehouseHierarchyDto>('wms', `/warehouse/${id}/hierarchy`);
  } catch (err) {
    console.error(`Error fetching warehouse ${id} hierarchy from live DB:`, err);
    // Dynamic empty layout fallback
    if (!MOCK_HIERARCHIES[id]) {
      const warehouse = MOCK_WAREHOUSES.find(w => w.id === id);
      MOCK_HIERARCHIES[id] = {
        warehouseId: id,
        code: warehouse?.code || 'ATL-01',
        name: warehouse?.name || 'Atlanta Main Hub',
        blocks: []
      };
    }
    return MOCK_HIERARCHIES[id];
  }
};

// ----------------------------------------------------------------------------
// 3. CREATE WAREHOUSE
// ----------------------------------------------------------------------------
export const createWarehouse = async (data: { code: string; name: string }) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 350));
    const newWh: WarehouseDto = { id: `wh-${Date.now()}`, ...data };
    MOCK_WAREHOUSES.push(newWh);
    MOCK_HIERARCHIES[newWh.id] = {
      warehouseId: newWh.id,
      code: newWh.code,
      name: newWh.name,
      blocks: []
    };
    return newWh;
  }
  
  return fetchApi<WarehouseDto>('wms', '/warehouse', {
    method: 'POST',
    body: data
  });
};

// ----------------------------------------------------------------------------
// 4. CREATE BLOCK
// ----------------------------------------------------------------------------
export const createBlock = async (warehouseId: string, blockCode: string) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 250));
    const hierarchy = MOCK_HIERARCHIES[warehouseId];
    if (hierarchy) {
      hierarchy.blocks.push({
        id: `blk-${Date.now()}`,
        code: blockCode,
        zones: []
      });
    }
    return;
  }
  
  return fetchApi('wms', `/warehouse/${warehouseId}/blocks`, {
    method: 'POST',
    body: { blockCode }
  });
};

// ----------------------------------------------------------------------------
// 5. CREATE ZONE
// ----------------------------------------------------------------------------
export const createZone = async (blockId: string, type: ZoneType) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 250));
    for (const hierarchy of Object.values(MOCK_HIERARCHIES)) {
      const block = hierarchy.blocks.find(b => b.id === blockId);
      if (block) {
        block.zones.push({
          id: `zone-${Date.now()}`,
          type,
          bins: []
        });
        break;
      }
    }
    return;
  }
  
  return fetchApi('wms', `/warehouse/blocks/${blockId}/zones`, {
    method: 'POST',
    body: { zoneType: type }
  });
};

// ----------------------------------------------------------------------------
// 6. CREATE BIN
// ----------------------------------------------------------------------------
export const createBin = async (zoneId: string, binCode: string) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 250));
    for (const hierarchy of Object.values(MOCK_HIERARCHIES)) {
      for (const block of hierarchy.blocks) {
        const zone = block.zones.find(z => z.id === zoneId);
        if (zone) {
          zone.bins.push({
            id: `bin-${Date.now()}`,
            binCode,
            status: 'Available'
          });
          return;
        }
      }
    }
    return;
  }
  
  return fetchApi('wms', `/warehouse/zones/${zoneId}/bins`, {
    method: 'POST',
    body: { warehouseId: '00000000-0000-0000-0000-000000000000', binCode }
  });
};

// ----------------------------------------------------------------------------
// 7. UPDATE BIN STATUS
// ----------------------------------------------------------------------------
export const updateBinStatus = async (binId: string, status: BinStatus) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    for (const hierarchy of Object.values(MOCK_HIERARCHIES)) {
      for (const block of hierarchy.blocks) {
        for (const zone of block.zones) {
          const bin = zone.bins.find(b => b.id === binId);
          if (bin) {
            bin.status = status;
            return;
          }
        }
      }
    }
    return;
  }
  
  return fetchApi('wms', `/warehouse/bins/${binId}/status`, {
    method: 'PUT',
    body: { newStatus: status }
  });
};
