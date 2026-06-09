export type OutboundOrderStatus = 'New' | 'Allocating' | 'Allocated' | 'AwaitingPick' | 'Picking' | 'Picked' | 'Packing' | 'Packed' | 'Loaded' | 'Shipped' | 'Cancelled';

export interface OutboundOrderDto {
  id: string;
  orderNo: string;
  tenantId: string;
  status: OutboundOrderStatus;
  lines: OutboundOrderLineDto[];
  createdAt: string;
}

export interface OutboundOrderLineDto {
  id: string;
  sku: string;
  quantity: number;
}

export interface OutboundOrderTimelineDto {
  id: string;
  status: OutboundOrderStatus;
  occurredAt: string;
  notes?: string;
  operatorId: string;
}

export interface OutboundReturnDto {
  id: string;
  orderNo: string;
  sku: string;
  returnedQty: number;
  condition: 'Good' | 'Damaged';
  disposition: 'Pending' | 'Restocked' | 'Scrapped' | 'Penalized';
  createdAt: string;
  notes?: string;
}

export interface PickTaskDto {
  id: string;
  sku: string;
  quantity: number;
  sourceBinId: string;
  status: 'Pending' | 'Completed';
  routeSequence?: number; 
}

export interface PutToWallResult {
  isComplete: boolean;
  orderId: string;
  wallSlotCode: string; 
  message: string;
}

export interface WaveDto {
  id: string;
  waveNo: string;
  type: 'Single-Item' | 'Multi-Item';
  orderCount: number;
  status: 'New' | 'Picking' | 'Picked' | 'Completed';
  createdAt: string;
}

