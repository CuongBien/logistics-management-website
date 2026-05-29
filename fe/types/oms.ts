export type OrderStatus = 'New' | 'Confirmed' | 'AwaitingPickup' | 'PickedUp' | 'AwaitingInbound' | 'InWarehouse' | 'Sorting' | 'AwaitingDispatch' | 'Dispatched' | 'Delivering' | 'Delivered' | 'Completed' | 'Failed' | 'Cancelled' | 'ReturnInTransit';

export interface OrderSummaryDto {
  id: string;
  orderNo: string;
  status: OrderStatus;
  consigneeName: string;
  consigneeCity: string;
  totalWeight: number;
  codAmount: number;
  createdAt: string;
}

export interface OrderItemDto {
  id: string;
  skuCode: string;
  quantity: number;
  price: number;
}

export interface OrderDto extends OrderSummaryDto {
  tenantId: string;
  consignorId: string;
  notes?: string;
  shippingFee: number;
  items: OrderItemDto[];
}

export interface OrderStatusHistoryDto {
  status: OrderStatus;
  changedAt: string;
  reason?: string;
  changedBy?: string;
}
