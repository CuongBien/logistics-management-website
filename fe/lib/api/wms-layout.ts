import { WarehouseDto, WarehouseHierarchyDto, ZoneType, BinStatus } from '@/types/wms-layout';

// Mocked database for warehouses
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

export const getWarehouses = async (): Promise<WarehouseDto[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return MOCK_WAREHOUSES;
};

export const getWarehouseHierarchy = async (id: string): Promise<WarehouseHierarchyDto> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
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
};

export const createWarehouse = async (data: { code: string; name: string }) => {
  await new Promise(resolve => setTimeout(resolve, 400));
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
};

export const createBlock = async (warehouseId: string, blockCode: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const hierarchy = MOCK_HIERARCHIES[warehouseId];
  if (hierarchy) {
    hierarchy.blocks.push({
      id: `blk-${Date.now()}`,
      code: blockCode,
      zones: []
    });
  }
};

export const createZone = async (blockId: string, type: ZoneType) => {
  await new Promise(resolve => setTimeout(resolve, 300));
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
};

export const createBin = async (zoneId: string, binCode: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
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
};

export const updateBinStatus = async (binId: string, status: BinStatus) => {
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
};
