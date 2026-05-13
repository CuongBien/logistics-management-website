// ============================================
// Ordering Service Types
// ============================================

export enum OrderStatus {
  New = 'New',
  Confirmed = 'Confirmed',
  AwaitingPickup = 'AwaitingPickup',
  PickedUp = 'PickedUp',
  AwaitingInbound = 'AwaitingInbound',
  InWarehouse = 'InWarehouse',
  Sorting = 'Sorting',
  AwaitingDispatch = 'AwaitingDispatch',
  Dispatched = 'Dispatched',
  Delivering = 'Delivering',
  Delivered = 'Delivered',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled',
  ReturnInTransit = 'ReturnInTransit',
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface ConsigneeInfo {
  fullName: string;
  phone: string;
  address: Address;
}

export interface OrderItem {
  id: string;
  orderId: string;
  sku: string;
  skuCode?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  tenantId: string;
  customerIdInternal: string;
  consignorId: string;
  externalReference?: string;
  consignee: ConsigneeInfo;
  waybillCode: string;
  status: OrderStatus | string;
  codAmount: number;
  shippingFee: number;
  weight: number;
  note?: string;
  createdAt: string;
  lastModifiedAt?: string;
  createdByOperatorId?: string;
  updatedByOperatorId?: string;
  items: OrderItem[];
  pickupDriverId?: string;
  warehouseId?: string;
  destinationWarehouseId?: string;
  deliveryDriverId?: string;
  routeId?: string;
  proofOfDeliveryUrl?: string;
  failureReason?: string;
  deliveryAttempts: number;
}

export interface OrderConsignee {
  orderId: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  statusFrom?: string;
  statusTo: string;
  source: string;
  changedByOperatorId?: string;
  correlationId?: string;
  reason?: string;
  changedAt: string;
}

// Create Order Command
export interface CreateOrderRequest {
  tenantId?: string;
  consignorId?: string;
  waybillCode?: string;
  skuCodes: string[];
  weight: number;
  shippingFee: number;
  codAmount: number;
  note?: string;
  consignee: ConsigneeInfo;
}

// ============================================
// Warehouse Service Types
// ============================================

export enum InboundReceiptStatus {
  Draft = 'Draft',
  Pending = 'Pending',
  PartiallyReceived = 'PartiallyReceived',
  Received = 'Received',
  Closed = 'Closed',
  Cancelled = 'Cancelled',
  CompletedWithExceptions = 'CompletedWithExceptions',
}

export enum ShipmentStatus {
  Pending = 'Pending',
  Dispatched = 'Dispatched',
  Delivered = 'Delivered',
}

export enum OutboundOrderStatus {
  Pending = 'Pending',
  Sorted = 'Sorted',
  Shipped = 'Shipped',
}

export enum DestinationType {
  Warehouse = 'Warehouse',
  Customer = 'Customer',
}

export enum ZoneType {
  Receiving = 0,
  Storage = 1,
  Shipping = 2,
  Returns = 3,
}

export enum ReservationStatus {
  Active = 'Active',
  Consumed = 'Consumed',
  Released = 'Released',
  Expired = 'Expired',
}

export enum ReservationType {
  OutboundOrder = 1,
  Transfer = 2,
  Adjustment = 3,
  Other = 99,
}

// --- Warehouse Layout ---

export interface WarehouseEntity {
  id: string;
  name: string;
  code: string;
  locationText: string;
  isDeleted: boolean;
  blocks?: Block[];
}

export interface Block {
  id: string;
  warehouseId: string;
  blockCode: string;
  zones?: Zone[];
}

export interface Zone {
  id: string;
  blockId: string;
  zoneType: number;
  zoneCode: string;
  bins?: Bin[];
}

export interface Bin {
  id: string;
  zoneId: string;
  warehouseId: string;
  binCode: string;
  isOccupied: boolean;
  currentOrderId?: string;
}

// --- Inbound ---

export interface InboundBinAllocation {
  id: string;
  receiptLineId: string;
  binCode: string;
  quantity: number;
  allocatedAt: string;
}

export interface InboundReceiptLine {
  id: string;
  receiptId: string;
  skuCode: string;
  expectedQuantity: number;
  receivedQuantity: number;
  allocations: InboundBinAllocation[];
}

export interface InboundReceipt {
  id: string;
  tenantId: string;
  customerId: string;
  warehouseId: string;
  receiptNo: string;
  orderId: string;
  status: InboundReceiptStatus | string;
  sourceShipmentNo?: string;
  createdAt: string;
  receivedAt?: string;
  isDeleted: boolean;
  lines: InboundReceiptLine[];
}

export interface CreateReceiptRequest {
  orderId: string;
  tenantId?: string;
  customerId?: string;
  warehouseId: string;
  sourceShipmentNo?: string;
  expectedLines: { skuCode: string; expectedQuantity: number }[];
}

export interface ReceiveItemRequest {
  orderId: string;
  tenantId?: string;
  skuCode: string;
  binCode: string;
  scannedBy?: string;
  quantity: number;
}

// --- Outbound ---

export interface OutboundOrder {
  id: string;
  tenantId: string;
  customerId: string;
  warehouseId: string;
  orderId: string;
  status: OutboundOrderStatus | string;
  plannedShipAt?: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  tenantId: string;
  customerId: string;
  shipmentNo: string;
  warehouseId: string;
  destinationType: number;
  destinationId: string;
  status: ShipmentStatus | string | number;
  shippedAt?: string;
  createdAt: string;
  isDeleted: boolean;
}

export interface SortOrderRequest {
  orderId: string;
  destinationWarehouseId: string;
  sourceShipmentNo?: string;
}

// --- Inventory ---

export interface InventoryItem {
  id: string;
  tenantId: string;
  customerId: string;
  warehouseId: string;
  binId: string;
  sku: string;
  quantityOnHand: number;
  reservedQty: number;
  availableQty: number;
  lastRestockedAt?: string;
  version: number;
}

export interface InventoryLedger {
  id: string;
  inventoryItemId: string;
  reason: string;
  quantityChange: number;
  balanceAfter: number;
  referenceId?: string;
  operatorSub?: string;
  createdAt: string;
}

export interface ReserveStockRequest {
  warehouseId: string;
  sku: string;
  quantity: number;
  referenceId: string;
  referenceType?: number;
  correlationId?: string;
}

export interface ReleaseStockRequest {
  warehouseId: string;
  reservationId: string;
}

export interface ConsumeStockRequest {
  warehouseId: string;
  reservationId: string;
}

export interface ReconcileRequest {
  warehouseId?: string | null;
}

// --- Auth / Identity ---

export interface AssignRoleRequest {
  warehouseId: string;
  operatorSub: string;
  roleCode: string;
}

// --- API Response wrapper (Result pattern) ---

export interface ApiResult<T = unknown> {
  isSuccess: boolean;
  isFailure: boolean;
  value?: T;
  error?: {
    code: string;
    message: string;
  };
}
