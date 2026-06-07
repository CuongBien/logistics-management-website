// ═══════════════════════════════════════════════════════════
// OMS - Order Management System Types
// Phải khớp chính xác với DTO từ Ordering.Application (C#)
// ═══════════════════════════════════════════════════════════

export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'AwaitingPickup'
  | 'PickedUp'
  | 'AwaitingInbound'
  | 'InWarehouse'
  | 'Sorting'
  | 'AwaitingDispatch'
  | 'Dispatched'
  | 'Delivering'
  | 'Delivered'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | 'ReturnInTransit';

// ─── OrderSummaryDto (GET /orders list) ───────────────────
// Maps to C# record OrderSummaryDto in GetOrdersQueryHandler
export interface OrderSummaryDto {
  id: string;
  consignorId: string;
  waybillCode: string;       // Mã vận đơn (e.g. LMS240601123456)
  status: OrderStatus;
  type: string;              // 'Parcel' | 'InboundRequest'
  fulfillment: string;       // 'Pickup' | 'Warehouse'
  codAmount: number;
  shippingFee: number;
  weight: number;
  createdAt: string;         // ISO datetime
  destinationWarehouseId?: string;
  consigneeName: string;     // Mapped từ Consignee.FullName
  consigneePhone: string;    // Mapped từ Consignee.Phone
}

// ─── OrderItemDto ─────────────────────────────────────────
export interface OrderItemDto {
  id: string;
  sku: string;               // Guid
  skuCode: string;
  quantity: number;
  price: number;
}

// ─── Consignee (người nhận) ───────────────────────────────
export interface ConsigneeAddressDto {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface ConsigneeDto {
  fullName: string;
  phone: string;
  address: ConsigneeAddressDto;
}

// ─── OrderDto (GET /orders/{id}) ──────────────────────────
// Maps to C# record OrderDto in GetOrderByIdQueryHandler
export interface OrderDto {
  id: string;
  consignorId: string;
  waybillCode: string;
  status: OrderStatus;
  consignee: ConsigneeDto;   // Nested object (KHÔNG phải flat fields)
  codAmount: number;
  shippingFee: number;
  weight: number;
  note?: string;             // Ghi chú giao hàng (KHÔNG phải 'notes')
  createdAt: string;
  externalReference?: string;
  type: string;
  fulfillment: string;
  tenantId: string;
  lastModifiedAt?: string;
  // Tracking fields
  pickupDriverId?: string;
  warehouseId?: string;
  destinationWarehouseId?: string;
  deliveryDriverId?: string;
  routeId?: string;
  proofOfDeliveryUrl?: string;
  deliveryAttempts: number;
  failureReason?: string;
  createdByOperatorId?: string;
  updatedByOperatorId?: string;
  items: OrderItemDto[];
}

// ─── OrderStatusHistoryDto ────────────────────────────────
// Maps to C# record OrderStatusHistoryDto in GetOrderStatusHistoryQueryHandler
export interface OrderStatusHistoryDto {
  orderId: string;
  tenantId: string;
  statusFrom: string;        // Tên enum cũ (e.g. 'New')
  statusTo: string;          // Tên enum mới — đây là status HIỆN TẠI của bước này
  changedAtUtc: string;      // ISO datetime (UTC) — KHÔNG phải 'changedAt'
  source: string;            // 'System' | 'Operator' | 'Driver'
  reason?: string;
  changedByOperatorId?: string;
  correlationId?: string;
}

// ─── Dashboard DTOs ───────────────────────────────────────
export interface OrderStatusSummaryDto {
  pending: number;
  dispatched: number;
  delivered: number;
  failed: number;
  cancelled: number;
}

export interface FinancialStatsDto {
  totalCodAmount: number;
  totalShippingFee: number;
}

// ─── Customer Dashboard Computed Types ────────────────────
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

// ─── Paginated API Response ───────────────────────────────
export interface PaginatedList<T> {
  items: T[];
  pageIndex: number;
  totalPages: number;
  totalCount: number;
}

export interface ApiResult<T> {
  isSuccess: boolean;
  value: T;
  error?: { code: string; message: string };
}

// ─── Create Order Types ───────────────────────────────────
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
