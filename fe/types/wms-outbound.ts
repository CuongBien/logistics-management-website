export type OutboundOrderStatus = 'New' | 'Allocating' | 'Allocated' | 'AwaitingPick' | 'Picking' | 'Picked' | 'Packing' | 'Packed' | 'Shipped' | 'Cancelled';

export interface OutboundOrderDto {
  id: string;
  orderNo: string;
  tenantId: string;
  status: OutboundOrderStatus;
  lines: OutboundOrderLineDto[];
}

export interface OutboundOrderLineDto {
  id: string;
  sku: string;
  quantity: number;
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
