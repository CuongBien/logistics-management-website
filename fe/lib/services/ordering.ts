import type {
  Order,
  OrderConsignee,
  OrderStatusHistory,
  CreateOrderRequest,
  ApiResult,
} from '../types';
import { OrderStatus } from '../types';

// Mock Database for OMS Orders
let mockOrders: Order[] = [
  {
    id: "ord-guid-0001",
    tenantId: "tenant-shopee",
    customerIdInternal: "cust-shopee-999",
    consignorId: "consignor-shopee-hcm",
    externalReference: "SP-REF-991823",
    waybillCode: "WAYBILL-2026-0001",
    status: OrderStatus.New,
    codAmount: 450000,
    shippingFee: 25000,
    weight: 1.2,
    note: "Giao hàng giờ hành chính, gọi điện trước khi đến.",
    createdAt: "2026-05-30T01:00:00Z",
    deliveryAttempts: 0,
    items: [
      { id: "item-1-1", orderId: "ord-guid-0001", sku: "SKU-RED-TSHIRT", quantity: 2, price: 150000 },
      { id: "item-1-2", orderId: "ord-guid-0001", sku: "SKU-BLUE-JEANS", quantity: 1, price: 150000 }
    ],
    consignee: {
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      address: {
        street: "123 Nguyễn Trãi, Phường 2",
        city: "Hồ Chí Minh",
        state: "HCM",
        country: "Vietnam",
        zipCode: "70000"
      }
    }
  },
  {
    id: "ord-guid-0002",
    tenantId: "tenant-lazada",
    customerIdInternal: "cust-lazada-888",
    consignorId: "consignor-lazada-hn",
    externalReference: "LZ-REF-229182",
    waybillCode: "WAYBILL-2026-0002",
    status: OrderStatus.AwaitingPickup,
    codAmount: 1200000,
    shippingFee: 45000,
    weight: 4.5,
    note: "Hàng dễ vỡ, xin nhẹ tay.",
    createdAt: "2026-05-29T10:30:00Z",
    deliveryAttempts: 0,
    items: [
      { id: "item-2-1", orderId: "ord-guid-0002", sku: "SKU-GLASS-VASE", quantity: 1, price: 1200000 }
    ],
    consignee: {
      fullName: "Trần Thị B",
      phone: "0987654321",
      address: {
        street: "456 Lê Lợi, Quận Hoàn Kiếm",
        city: "Hà Nội",
        state: "HN",
        country: "Vietnam",
        zipCode: "10000"
      }
    }
  },
  {
    id: "ord-guid-0003",
    tenantId: "tenant-tiktok",
    customerIdInternal: "cust-tiktok-777",
    consignorId: "consignor-tiktok-dn",
    externalReference: "TT-REF-445612",
    waybillCode: "WAYBILL-2026-0003",
    status: OrderStatus.Delivering,
    codAmount: 0,
    shippingFee: 30000,
    weight: 0.8,
    note: "Đã thanh toán trước qua ví điện tử.",
    createdAt: "2026-05-28T14:20:00Z",
    deliveryAttempts: 1,
    deliveryDriverId: "driver-lastmile-102",
    routeId: "route-dn-urban-03",
    items: [
      { id: "item-3-1", orderId: "ord-guid-0003", sku: "SKU-WIRELESS-MOUSE", quantity: 1, price: 300000 }
    ],
    consignee: {
      fullName: "Phạm Văn C",
      phone: "0912345678",
      address: {
        street: "789 Nguyễn Hữu Thọ, Quận Hải Châu",
        city: "Đà Nẵng",
        state: "DN",
        country: "Vietnam",
        zipCode: "55000"
      }
    }
  },
  {
    id: "ord-guid-0004",
    tenantId: "tenant-shopee",
    customerIdInternal: "cust-shopee-999",
    consignorId: "consignor-shopee-hcm",
    externalReference: "SP-REF-887712",
    waybillCode: "WAYBILL-2026-0004",
    status: OrderStatus.Delivered,
    codAmount: 320000,
    shippingFee: 15000,
    weight: 0.5,
    createdAt: "2026-05-27T08:15:00Z",
    deliveryAttempts: 1,
    deliveryDriverId: "driver-lastmile-102",
    routeId: "route-hcm-q1-02",
    proofOfDeliveryUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256",
    items: [
      { id: "item-4-1", orderId: "ord-guid-0004", sku: "SKU-IPHONE-CASE", quantity: 2, price: 160000 }
    ],
    consignee: {
      fullName: "Lê Thị D",
      phone: "0934567890",
      address: {
        street: "12 Pasteur, Quận 1",
        city: "Hồ Chí Minh",
        state: "HCM",
        country: "Vietnam",
        zipCode: "70000"
      }
    }
  },
  {
    id: "ord-guid-0005",
    tenantId: "tenant-lazada",
    customerIdInternal: "cust-lazada-888",
    consignorId: "consignor-lazada-hn",
    externalReference: "LZ-REF-554412",
    waybillCode: "WAYBILL-2026-0005",
    status: OrderStatus.Failed,
    codAmount: 850000,
    shippingFee: 40000,
    weight: 2.1,
    createdAt: "2026-05-26T09:00:00Z",
    deliveryAttempts: 3,
    deliveryDriverId: "driver-lastmile-205",
    routeId: "route-hn-dongda-05",
    failureReason: "Khách hàng không nghe máy sau 3 lần nỗ lực giao hàng của bưu tá. Bàn giao xử lý RTO hoàn trả.",
    items: [
      { id: "item-5-1", orderId: "ord-guid-0005", sku: "SKU-KEYBOARD-MECHANICAL", quantity: 1, price: 850000 }
    ],
    consignee: {
      fullName: "Hoàng Văn E",
      phone: "0976543210",
      address: {
        street: "98 Chùa Bộc, Quận Đống Đa",
        city: "Hà Nội",
        state: "HN",
        country: "Vietnam",
        zipCode: "10000"
      }
    }
  },
  {
    id: "ord-guid-0006",
    tenantId: "tenant-shopee",
    customerIdInternal: "cust-shopee-999",
    consignorId: "consignor-shopee-hcm",
    externalReference: "SP-REF-112233",
    waybillCode: "WAYBILL-2026-0006",
    status: OrderStatus.Cancelled,
    codAmount: 500000,
    shippingFee: 20000,
    weight: 1.0,
    createdAt: "2026-05-25T16:45:00Z",
    deliveryAttempts: 0,
    failureReason: "Chủ hàng chủ động hủy đơn trước khi bưu tá lấy hàng.",
    items: [
      { id: "item-6-1", orderId: "ord-guid-0006", sku: "SKU-SWEATER-GRAY", quantity: 1, price: 500000 }
    ],
    consignee: {
      fullName: "Vũ Thị F",
      phone: "0945678901",
      address: {
        street: "321 Cách Mạng Tháng Tám, Quận 10",
        city: "Hồ Chí Minh",
        state: "HCM",
        country: "Vietnam",
        zipCode: "70000"
      }
    }
  }
];

// Mock database for Timelines (showing different integration sources: ERP, MassTransit, Operator)
let mockTimelines: Record<string, OrderStatusHistory[]> = {
  "ord-guid-0001": [
    { id: "tl-1-1", orderId: "ord-guid-0001", statusTo: "New", source: "ERP Integration", changedByOperatorId: "system-erp-link", correlationId: "corr-1a2b-3c4d", changedAt: "2026-05-30T01:00:00Z" }
  ],
  "ord-guid-0002": [
    { id: "tl-2-1", orderId: "ord-guid-0002", statusTo: "New", source: "ERP Integration", changedByOperatorId: "system-erp-link", correlationId: "corr-2b3c-4d5e", changedAt: "2026-05-29T10:30:00Z" },
    { id: "tl-2-2", orderId: "ord-guid-0002", statusFrom: "New", statusTo: "Confirmed", source: "MassTransit Saga", changedByOperatorId: "ordering-saga-processor", correlationId: "corr-2b3c-4d5e", changedAt: "2026-05-29T10:35:00Z" },
    { id: "tl-2-3", orderId: "ord-guid-0002", statusFrom: "Confirmed", statusTo: "AwaitingPickup", source: "Operator Portal", changedByOperatorId: "user-supervisor-01", correlationId: "corr-2b3c-4d5e", changedAt: "2026-05-29T10:45:00Z" }
  ],
  "ord-guid-0003": [
    { id: "tl-3-1", orderId: "ord-guid-0003", statusTo: "New", source: "ERP Integration", changedByOperatorId: "system-erp-link", correlationId: "corr-3c4d-5e6f", changedAt: "2026-05-28T14:20:00Z" },
    { id: "tl-3-2", orderId: "ord-guid-0003", statusFrom: "New", statusTo: "Confirmed", source: "MassTransit Saga", changedByOperatorId: "ordering-saga-processor", correlationId: "corr-3c4d-5e6f", changedAt: "2026-05-28T14:22:00Z" },
    { id: "tl-3-3", orderId: "ord-guid-0003", statusFrom: "Confirmed", statusTo: "AwaitingPickup", source: "Operator Portal", changedByOperatorId: "user-supervisor-01", correlationId: "corr-3c4d-5e6f", changedAt: "2026-05-28T14:30:00Z" },
    { id: "tl-3-4", orderId: "ord-guid-0003", statusFrom: "AwaitingPickup", statusTo: "PickedUp", source: "Mobile App Scanner", changedByOperatorId: "driver-pickup-502", correlationId: "corr-3c4d-5e6f", changedAt: "2026-05-28T17:00:00Z" },
    { id: "tl-3-5", orderId: "ord-guid-0003", statusFrom: "PickedUp", statusTo: "InWarehouse", source: "MassTransit Integration", changedByOperatorId: "wms-inbound-listener", correlationId: "corr-3c4d-5e6f", changedAt: "2026-05-29T08:00:00Z" },
    { id: "tl-3-6", orderId: "ord-guid-0003", statusFrom: "InWarehouse", statusTo: "AwaitingDispatch", source: "MassTransit Saga", changedByOperatorId: "wms-sort-listener", correlationId: "corr-3c4d-5e6f", changedAt: "2026-05-29T09:30:00Z" },
    { id: "tl-3-7", orderId: "ord-guid-0003", statusFrom: "AwaitingDispatch", statusTo: "Dispatched", source: "Operator Portal", changedByOperatorId: "user-dispatcher-04", correlationId: "corr-3c4d-5e6f", changedAt: "2026-05-29T11:00:00Z" },
    { id: "tl-3-8", orderId: "ord-guid-0003", statusFrom: "Dispatched", statusTo: "Delivering", source: "Mobile App Dispatcher", changedByOperatorId: "driver-lastmile-102", correlationId: "corr-3c4d-5e6f", changedAt: "2026-05-30T08:00:00Z" }
  ],
  "ord-guid-0004": [
    { id: "tl-4-1", orderId: "ord-guid-0004", statusTo: "New", source: "ERP Integration", changedByOperatorId: "system-erp-link", correlationId: "corr-4d5e-6f7a", changedAt: "2026-05-27T08:15:00Z" },
    { id: "tl-4-2", orderId: "ord-guid-0004", statusFrom: "New", statusTo: "Confirmed", source: "MassTransit Saga", changedByOperatorId: "ordering-saga-processor", correlationId: "corr-4d5e-6f7a", changedAt: "2026-05-27T08:20:00Z" },
    { id: "tl-4-3", orderId: "ord-guid-0004", statusFrom: "Confirmed", statusTo: "Dispatched", source: "Operator Portal", changedByOperatorId: "user-dispatcher-04", correlationId: "corr-4d5e-6f7a", changedAt: "2026-05-27T10:00:00Z" },
    { id: "tl-4-4", orderId: "ord-guid-0004", statusFrom: "Dispatched", statusTo: "Delivering", source: "Mobile App Dispatcher", changedByOperatorId: "driver-lastmile-102", correlationId: "corr-4d5e-6f7a", changedAt: "2026-05-27T13:30:00Z" },
    { id: "tl-4-5", orderId: "ord-guid-0004", statusFrom: "Delivering", statusTo: "Delivered", source: "Mobile App Scanner", changedByOperatorId: "driver-lastmile-102", correlationId: "corr-4d5e-6f7a", changedAt: "2026-05-27T16:00:00Z" }
  ],
  "ord-guid-0005": [
    { id: "tl-5-1", orderId: "ord-guid-0005", statusTo: "New", source: "ERP Integration", changedByOperatorId: "system-erp-link", correlationId: "corr-5e6f-7a8b", changedAt: "2026-05-26T09:00:00Z" },
    { id: "tl-5-2", orderId: "ord-guid-0005", statusFrom: "New", statusTo: "Confirmed", source: "MassTransit Saga", changedByOperatorId: "ordering-saga-processor", correlationId: "corr-5e6f-7a8b", changedAt: "2026-05-26T09:10:00Z" },
    { id: "tl-5-3", orderId: "ord-guid-0005", statusFrom: "Confirmed", statusTo: "Dispatched", source: "Operator Portal", changedByOperatorId: "user-dispatcher-04", correlationId: "corr-5e6f-7a8b", changedAt: "2026-05-26T11:00:00Z" },
    { id: "tl-5-4", orderId: "ord-guid-0005", statusFrom: "Dispatched", statusTo: "Delivering", source: "Mobile App Dispatcher", changedByOperatorId: "driver-lastmile-205", correlationId: "corr-5e6f-7a8b", changedAt: "2026-05-26T14:00:00Z" },
    { id: "tl-5-5", orderId: "ord-guid-0005", statusFrom: "Delivering", statusTo: "Failed", source: "Mobile App Scanner", changedByOperatorId: "driver-lastmile-205", correlationId: "corr-5e6f-7a8b", reason: "Khách hàng không nghe máy sau 3 lần nỗ lực giao hàng của bưu tá. Bàn giao xử lý RTO hoàn trả.", changedAt: "2026-05-27T18:00:00Z" }
  ],
  "ord-guid-0006": [
    { id: "tl-6-1", orderId: "ord-guid-0006", statusTo: "New", source: "ERP Integration", changedByOperatorId: "system-erp-link", correlationId: "corr-6f7a-8b9c", changedAt: "2026-05-25T16:45:00Z" },
    { id: "tl-6-2", orderId: "ord-guid-0006", statusFrom: "New", statusTo: "Cancelled", source: "Operator Portal", changedByOperatorId: "user-supervisor-01", correlationId: "corr-6f7a-8b9c", reason: "Chủ hàng chủ động hủy đơn trước khi bưu tá lấy hàng.", changedAt: "2026-05-25T17:15:00Z" }
  ]
};

// API Service Functions (Drop-in Mock return values wrapping delay Promises)
export async function getOrderById(id: string): Promise<ApiResult<Order>> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const order = mockOrders.find(o => o.id === id || o.waybillCode === id);
  if (order) {
    return { isSuccess: true, isFailure: false, value: order };
  }
  return { isSuccess: false, isFailure: true, error: { code: "NotFound", message: "Không tìm thấy đơn hàng" } };
}

export async function getOrderStatusHistory(id: string): Promise<ApiResult<OrderStatusHistory[]>> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const history = mockTimelines[id];
  const order = mockOrders.find(o => o.id === id);
  const targetId = order ? order.id : id;
  const historyData = mockTimelines[targetId] || [];
  return { isSuccess: true, isFailure: false, value: historyData };
}

export async function getOrderConsignee(id: string): Promise<ApiResult<OrderConsignee>> {
  await new Promise(resolve => setTimeout(resolve, 400));
  const order = mockOrders.find(o => o.id === id || o.waybillCode === id);
  if (order) {
    const consigneeDto: OrderConsignee = {
      orderId: order.id,
      fullName: order.consignee.fullName,
      phone: order.consignee.phone,
      street: order.consignee.address.street,
      city: order.consignee.address.city,
      state: order.consignee.address.state,
      country: order.consignee.address.country,
      zipCode: order.consignee.address.zipCode
    };
    return { isSuccess: true, isFailure: false, value: consigneeDto };
  }
  return { isSuccess: false, isFailure: true, error: { code: "NotFound", message: "Không tìm thấy thông tin người nhận" } };
}

export async function createOrder(data: CreateOrderRequest, correlationId?: string): Promise<ApiResult<string>> {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newId = `ord-guid-${String(mockOrders.length + 1).padStart(4, '0')}`;
  const newWaybill = `WAYBILL-2026-${String(mockOrders.length + 1).padStart(4, '0')}`;
  
  const newOrder: Order = {
    id: newId,
    tenantId: data.tenantId || "tenant-shopee",
    customerIdInternal: "cust-internal-sh",
    consignorId: data.consignorId || "consignor-generic",
    waybillCode: newWaybill,
    status: OrderStatus.New,
    codAmount: data.codAmount,
    shippingFee: data.shippingFee,
    weight: data.weight,
    note: data.note,
    createdAt: new Date().toISOString(),
    deliveryAttempts: 0,
    items: data.skuCodes.map((sku, i) => ({
      id: `item-${newId}-${i}`,
      orderId: newId,
      sku: sku,
      quantity: 1,
      price: data.codAmount / data.skuCodes.length // dummy price
    })),
    consignee: {
      fullName: data.consignee.fullName,
      phone: data.consignee.phone,
      address: {
        street: data.consignee.address.street,
        city: data.consignee.address.city,
        state: data.consignee.address.state,
        country: data.consignee.address.country,
        zipCode: data.consignee.address.zipCode
      }
    }
  };

  mockOrders.push(newOrder);
  mockTimelines[newId] = [
    {
      id: `tl-${newId}-1`,
      orderId: newId,
      statusTo: "New",
      source: "Operator Portal (Manual Create)",
      changedByOperatorId: "user-admin",
      correlationId: correlationId || "corr-manual-c",
      changedAt: new Date().toISOString()
    }
  ];

  return { isSuccess: true, isFailure: false, value: newId };
}

export async function searchOrders(
  query: string, 
  statusFilter: string, 
  page: number = 1, 
  pageSize: number = 5
): Promise<ApiResult<{ orders: Order[]; totalCount: number }>> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  let filtered = [...mockOrders];

  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      o => 
        o.id.toLowerCase().includes(q) ||
        o.waybillCode.toLowerCase().includes(q) ||
        o.consignee.fullName.toLowerCase().includes(q) ||
        o.consignee.phone.includes(q)
    );
  }

  if (statusFilter && statusFilter !== "All") {
    filtered = filtered.filter(o => o.status === statusFilter);
  }

  const totalCount = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const paginatedOrders = filtered.slice(startIndex, startIndex + pageSize);

  return {
    isSuccess: true,
    isFailure: false,
    value: {
      orders: paginatedOrders,
      totalCount
    }
  };
}
