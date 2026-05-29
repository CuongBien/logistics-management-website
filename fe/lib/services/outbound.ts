import { fetchApi } from '../api-client';
import type { OutboundOrder, Shipment, SortOrderRequest } from '../types';

// Mock database for shipments & outbound orders when backend is offline
const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: "sh-1",
    tenantId: "tenant-shopee",
    customerId: "cust-1",
    shipmentNo: "SHP-2026-0001",
    warehouseId: "wh-1",
    destinationType: 0, // Warehouse
    destinationId: "wh-2",
    status: "Pending",
    createdAt: "2026-05-28T09:00:00Z",
    isDeleted: false
  },
  {
    id: "sh-2",
    tenantId: "tenant-lazada",
    customerId: "cust-2",
    shipmentNo: "SHP-2026-0002",
    warehouseId: "wh-1",
    destinationType: 1, // Customer
    destinationId: "cust-retail-3",
    status: "Dispatched",
    shippedAt: "2026-05-29T14:30:00Z",
    createdAt: "2026-05-28T10:15:00Z",
    isDeleted: false
  },
  {
    id: "sh-3",
    tenantId: "tenant-tiktok",
    customerId: "cust-3",
    shipmentNo: "SHP-2026-0003",
    warehouseId: "wh-2",
    destinationType: 0,
    destinationId: "wh-1",
    status: "Delivered",
    shippedAt: "2026-05-29T16:00:00Z",
    createdAt: "2026-05-29T08:00:00Z",
    isDeleted: false
  }
];

const MOCK_OUTBOUND_ORDERS: Record<string, OutboundOrder> = {
  "ORD-12345": {
    id: "ob-1",
    tenantId: "tenant-shopee",
    customerId: "cust-1",
    warehouseId: "wh-1",
    orderId: "ORD-12345",
    status: "Pending",
    plannedShipAt: "2026-06-02T10:00:00Z",
    createdAt: "2026-05-29T11:00:00Z"
  },
  "ORD-67890": {
    id: "ob-2",
    tenantId: "tenant-lazada",
    customerId: "cust-2",
    warehouseId: "wh-2",
    orderId: "ORD-67890",
    status: "Sorted",
    plannedShipAt: "2026-06-03T14:00:00Z",
    createdAt: "2026-05-29T12:00:00Z"
  }
};

export async function getOutboundOrder(orderId: string): Promise<OutboundOrder> {
  try {
    return await fetchApi<OutboundOrder>('wms', `/outbound/orders/${orderId}`);
  } catch (error) {
    console.warn("Outbound API offline, loading mock outbound order.");
    const mockOrder = MOCK_OUTBOUND_ORDERS[orderId];
    if (mockOrder) return mockOrder;
    
    // Auto-generate realistic mock order if not found
    return {
      id: `ob-${Date.now()}`,
      tenantId: "tenant-shopee",
      customerId: "cust-1",
      warehouseId: "wh-1",
      orderId: orderId,
      status: "Pending",
      plannedShipAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      createdAt: new Date().toISOString()
    };
  }
}

export async function getShipments(): Promise<Shipment[]> {
  try {
    return await fetchApi<Shipment[]>('wms', '/outbound/shipments');
  } catch (error) {
    console.warn("Outbound API offline, loading fallback mock shipments.");
    return MOCK_SHIPMENTS;
  }
}

export async function sortOrder(data: SortOrderRequest): Promise<unknown> {
  try {
    return await fetchApi('wms', '/outbound/sort', {
      method: 'PUT',
      body: data,
    });
  } catch (error) {
    console.warn("Outbound API offline, running mock sorting pipeline.");
    
    // Push a new mock shipment as a result of sorting
    const newShipment: Shipment = {
      id: `sh-${Date.now()}`,
      tenantId: "tenant-shopee",
      customerId: "cust-1",
      shipmentNo: data.sourceShipmentNo || `SHP-${Date.now().toString().slice(-6)}`,
      warehouseId: "wh-1",
      destinationType: 0,
      destinationId: data.destinationWarehouseId,
      status: "Pending",
      createdAt: new Date().toISOString(),
      isDeleted: false
    };
    MOCK_SHIPMENTS.unshift(newShipment);
    
    return { success: true };
  }
}
