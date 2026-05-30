import { WarehouseDto, WarehouseHierarchyDto, ZoneType, BinStatus } from '@/types/wms-layout';
import { fetchApi } from '@/lib/api-client'; // Import standard fetchApi client with Next.js rewrites proxy

// ============================================================================
// DUAL-MODE API STRATEGY (MOCK VS REAL DATABASE CONNECTION)
// ============================================================================
// - Set USE_MOCK to 'true' to use high-fidelity mock layout (Atlanta Hub and New York Crossdock).
// - Set USE_MOCK to 'false' to read/write real layouts directly from WMS Postgres DB in Docker!
// ============================================================================
const USE_MOCK = true; 

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
  
  // Real Database Query WMS Endpoint: GET /api/Warehouse
  return await fetchApi<WarehouseDto[]>("wms", "/Warehouse");
};

// ----------------------------------------------------------------------------
// 2. GET WAREHOUSE HIERARCHY
// ----------------------------------------------------------------------------
export const getWarehouseHierarchy = async (id: string): Promise<WarehouseHierarchyDto> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // If the hierarchy doesn't exist in our dictionary yet, initialize a blank one
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
  
  // Real Database Query WMS Endpoint: GET /api/Warehouse/{id}/hierarchy
  return await fetchApi<WarehouseHierarchyDto>("wms", `/Warehouse/${id}/hierarchy`);
};

// ----------------------------------------------------------------------------
// 3. CREATE WAREHOUSE
// ----------------------------------------------------------------------------
export const createWarehouse = async (data: { code: string; name: string }) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 350));
    const newWh: WarehouseDto = { id: `wh-${Date.now()}`, ...data };
    MOCK_WAREHOUSES.push(newWh);
    
    // Pre-initialize empty hierarchy for the new warehouse
    MOCK_HIERARCHIES[newWh.id] = {
      warehouseId: newWh.id,
      code: newWh.code,
      name: newWh.name,
      blocks: []
    };
    
    return newWh;
  }
  
  // Real Database Command WMS Endpoint: POST /api/Warehouse
  const tenantId = "default-tenant"; // Default tenant
  return await fetchApi<WarehouseDto>("wms", "/Warehouse", {
    method: "POST",
    body: {
      tenantId,
      code: data.code,
      name: data.name
    }
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
  
  // Real Database Command WMS Endpoint: POST /api/Warehouse/{id}/blocks
  return await fetchApi("wms", `/Warehouse/${warehouseId}/blocks`, {
    method: "POST",
    body: blockCode // Pass blockCode directly as plain string in request body
  });
};

// ----------------------------------------------------------------------------
// 5. CREATE ZONE
// ----------------------------------------------------------------------------
export const createZone = async (blockId: string, type: ZoneType) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 250));
    // Search for the block across all warehouse hierarchies
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
  
  // Real Database Command WMS Endpoint: POST /api/Warehouse/blocks/{id}/zones
  // Map ZoneType 'Inbound'/'Storage'/'Outbound'/'CrossDock' to C# Backend Enum (matching ZoneType values)
  return await fetchApi("wms", `/Warehouse/blocks/${blockId}/zones`, {
    method: "POST",
    body: type
  });
};

// ----------------------------------------------------------------------------
// 6. CREATE BIN
// ----------------------------------------------------------------------------
export const createBin = async (zoneId: string, binCode: string) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 250));
    // Search for the zone across all hierarchies and blocks
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
  
  // Real Database Command WMS Endpoint: POST /api/Warehouse/zones/{id}/bins
  // Body takes CreateBinRequest: { WarehouseId, BinCode }
  // We can pass a default GUID for warehouseId or query active warehouse context
  const defaultWarehouseId = "a0d33e7c-eb5a-4b08-9df2-5d46487e411b"; // ATL-01
  return await fetchApi("wms", `/Warehouse/zones/${zoneId}/bins`, {
    method: "POST",
    body: {
      warehouseId: defaultWarehouseId,
      binCode
    }
  });
};

// ----------------------------------------------------------------------------
// 7. UPDATE BIN STATUS
// ----------------------------------------------------------------------------
export const updateBinStatus = async (binId: string, status: BinStatus) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    // Search and update the bin status across all warehouses
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
  
  // Real Database Command WMS Endpoint: PUT /api/Warehouse/bins/{id}/status
  // Body takes UpdateBinStatusRequest: { NewStatus }
  return await fetchApi("wms", `/Warehouse/bins/${binId}/status`, {
    method: "PUT",
    body: {
      newStatus: status
    }
  });
};

