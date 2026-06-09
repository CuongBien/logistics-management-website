export type ZoneType = 'Inbound' | 'Storage' | 'Outbound' | 'Return' | 'CrossDock' | 'Staging';
export type BinStatus = 'Available' | 'Occupied' | 'Full' | 'Locked' | 'Disabled' | 'Maintenance';

export interface WarehouseDto {
  id: string;
  code: string;
  name: string;
  locationText?: string;
}

export interface BinDto {
  id: string;
  binCode: string;
  status: BinStatus;
  aisle?: string;
  rack?: string;
  shelf?: string;
  pickSequence?: number;
  warehouseId?: string;
}

export interface ZoneDto {
  id: string;
  type: ZoneType;
  bins: BinDto[];
}

export interface BlockDto {
  id: string;
  code: string;
  zones: ZoneDto[];
}

export interface WarehouseHierarchyDto {
  warehouseId: string;
  code: string;
  name: string;
  blocks: BlockDto[];
}
