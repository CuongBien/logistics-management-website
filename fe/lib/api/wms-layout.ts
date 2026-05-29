import { WarehouseDto, WarehouseHierarchyDto, ZoneType, BinStatus } from '@/types/wms-layout';

// Mocked API service for Layout Management
const MOCK_WAREHOUSES: WarehouseDto[] = [
  { id: 'wh-1', code: 'ATL-01', name: 'Atlanta Main Hub' },
  { id: 'wh-2', code: 'JFK-02', name: 'New York Crossdock' },
];

let mockHierarchy: WarehouseHierarchyDto = {
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
};

export const getWarehouses = async (): Promise<WarehouseDto[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_WAREHOUSES;
};

export const getWarehouseHierarchy = async (id: string): Promise<WarehouseHierarchyDto> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockHierarchy;
};

export const createWarehouse = async (data: { code: string; name: string }) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newWh: WarehouseDto = { id: `wh-${Date.now()}`, ...data };
  MOCK_WAREHOUSES.push(newWh);
  return newWh;
};

export const createBlock = async (warehouseId: string, blockCode: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  mockHierarchy.blocks.push({ id: `blk-${Date.now()}`, code: blockCode, zones: [] });
};

export const createZone = async (blockId: string, type: ZoneType) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const block = mockHierarchy.blocks.find(b => b.id === blockId);
  if (block) {
    block.zones.push({ id: `zone-${Date.now()}`, type, bins: [] });
  }
};

export const createBin = async (zoneId: string, binCode: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  for (const block of mockHierarchy.blocks) {
    const zone = block.zones.find(z => z.id === zoneId);
    if (zone) {
      zone.bins.push({ id: `bin-${Date.now()}`, binCode, status: 'Available' });
      break;
    }
  }
};

export const updateBinStatus = async (binId: string, status: BinStatus) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  for (const block of mockHierarchy.blocks) {
    for (const zone of block.zones) {
      const bin = zone.bins.find(b => b.id === binId);
      if (bin) {
        bin.status = status;
        break;
      }
    }
  }
};
