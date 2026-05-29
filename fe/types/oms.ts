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

// ═══════════════════════════════════════════════════════════
// Customer Portal Types
// ═══════════════════════════════════════════════════════════

export interface MonthlyOrderData {
  month: string;
  delivered: number;
  cancelled: number;
  inTransit: number;
}

export interface CustomerDashboardStats {
  totalOrders: number;
  deliveringOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingCodAmount: number;
  totalShippingFeeThisMonth: number;
  monthlyOrderData: MonthlyOrderData[];
}

export type ProductType = 'Document' | 'Fragile' | 'Electronic' | 'Food' | 'Clothing' | 'Other';

export interface CreateOrderFormValues {
  // Step 1: Sender
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderProvince: string;
  senderDistrict: string;
  senderWard: string;
  // Step 2: Receiver
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverProvince: string;
  receiverDistrict: string;
  receiverWard: string;
  // Step 3: Package Info
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  productType: ProductType;
  codAmount: number;
  notes?: string;
}

export interface OrderFilterParams {
  search?: string;
  status?: OrderStatus | '';
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
}
