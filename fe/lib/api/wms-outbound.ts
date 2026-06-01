import { OutboundOrderDto, OutboundOrderStatus, OutboundOrderTimelineDto, OutboundReturnDto, WaveDto } from '@/types/wms-outbound';
import { fetchApi } from '@/lib/api-client';

// ============================================================================
// DUAL-MODE API STRATEGY (MOCK VS REAL DATABASE CONNECTION)
// ============================================================================
const USE_MOCK = false;

// Mocked database for Outbound Orders (matches WMS database seed items to prevent mismatches)
let mockOrdersDb: OutboundOrderDto[] = [
  {
    id: 'out-1',
    orderNo: 'OUT-2026-0001',
    tenantId: 'default-tenant',
    status: 'New',
    createdAt: '2026-05-29T10:00:00Z',
    lines: [
      { id: 'oline-1-1', sku: 'A0-001', quantity: 20 },
      { id: 'oline-1-2', sku: 'A0-002', quantity: 5 },
    ]
  },
  {
    id: 'out-2',
    orderNo: 'OUT-2026-0002',
    tenantId: 'default-tenant',
    status: 'Allocated',
    createdAt: '2026-05-28T14:30:00Z',
    lines: [
      { id: 'oline-2-1', sku: 'A0-003', quantity: 15 },
    ]
  },
  {
    id: 'out-3',
    orderNo: 'OUT-2026-0003',
    tenantId: 'default-tenant',
    status: 'Picking',
    createdAt: '2026-05-29T08:15:00Z',
    lines: [
      { id: 'oline-3-1', sku: 'SKU-RED-TSHIRT', quantity: 50 },
      { id: 'oline-3-2', sku: 'SKU-BLUE-JEANS', quantity: 30 },
    ]
  }
];

// Mocked database for Tracking Timelines
let mockTimelinesDb: Record<string, OutboundOrderTimelineDto[]> = {
  'out-1': [
    { id: 'tl-1-1', status: 'New', occurredAt: '2026-05-29T10:00:00Z', notes: 'Đơn hàng xuất mới tiếp nhận từ hệ thống ERP.', operatorId: 'system' }
  ]
};

// Mocked database for Returns
let mockReturnsDb: OutboundReturnDto[] = [
  {
    id: 'ret-1',
    orderNo: 'OUT-2026-0001',
    sku: 'A0-001',
    returnedQty: 2,
    condition: 'Good',
    disposition: 'Pending',
    createdAt: '2026-05-29T10:30:00Z',
    notes: 'Khách hàng không nhận (Boom hàng). Vỏ hộp còn nguyên niêm phong.'
  }
];

// Mocked database for Wave Planning
let mockWavesDb: WaveDto[] = [
  {
    id: 'wave-1',
    waveNo: 'WAVE-2026-0001',
    type: 'Single-Item',
    orderCount: 12,
    status: 'Completed',
    createdAt: '2026-05-28T09:00:00Z'
  }
];

function mapStatus(status: number | string): OutboundOrderStatus {
  if (typeof status === 'number') {
    switch (status) {
      case 1: return 'New'; // Draft
      case 2: return 'Allocating'; // PendingAllocation
      case 3: return 'Allocating'; // PartiallyAllocated
      case 4: return 'Allocated'; // Allocated
      case 5: return 'Picking'; // Picking
      case 6: return 'Picking'; // PartiallyPicked
      case 7: return 'Picked'; // Picked
      case 8: return 'Packing'; // Packing
      case 9: return 'Packed'; // Packed
      case 10: return 'Packed'; // Loaded
      case 11: return 'Shipped'; // Shipped
      case 12: return 'Shipped'; // Delivered
      case 13: return 'Cancelled'; // Cancelled
      default: return 'New';
    }
  }
  switch (status) {
    case 'Draft': return 'New';
    case 'PendingAllocation': return 'Allocating';
    case 'PartiallyAllocated': return 'Allocating';
    case 'Allocated': return 'Allocated';
    case 'Picking': return 'Picking';
    case 'PartiallyPicked': return 'Picking';
    case 'Picked': return 'Picked';
    case 'Packing': return 'Packing';
    case 'Packed': return 'Packed';
    case 'Loaded': return 'Packed';
    case 'Shipped': return 'Shipped';
    case 'Delivered': return 'Shipped';
    case 'Cancelled': return 'Cancelled';
    default: return 'New';
  }
}

// Query & Mutation API Services
export const getOrders = async (): Promise<OutboundOrderDto[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockOrdersDb];
  }

  try {
    const shipments = await fetchApi<any[]>("wms", "/outbound/shipments");
    if (shipments && shipments.length > 0) {
      return shipments.map(s => ({
        id: s.id,
        orderNo: s.shipmentNo,
        tenantId: s.tenantId,
        status: mapStatus(s.status),
        lines: [],
        createdAt: s.createdAt
      }));
    }
  } catch (err) {
    console.error("Error fetching shipments from live WMS DB:", err);
  }

  return [...mockOrdersDb];
};

export const getOrderById = async (id: string): Promise<OutboundOrderDto | undefined> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockOrdersDb.find(o => o.id === id);
  }

  try {
    const s = await fetchApi<any>("wms", `/outbound/orders/${id}`);
    if (s) {
      return {
        id: s.id,
        orderNo: s.orderNo,
        tenantId: s.tenantId,
        status: mapStatus(s.status),
        lines: (s.lines || []).map((l: any) => ({
          id: l.id,
          sku: l.sku || l.skuCode || '',
          quantity: l.quantity || l.requestedQty || 0
        })),
        createdAt: s.createdAt
      };
    }
  } catch (err) {
    console.error("Error fetching outbound order by ID:", err);
  }

  return mockOrdersDb.find(o => o.id === id);
};

export const getOrderTimeline = async (id: string): Promise<OutboundOrderTimelineDto[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockTimelinesDb[id] || [];
  }

  try {
    const res = await fetchApi<any>("wms", `/outbound/orders/${id}/tracking-timeline`);
    const timeline = res?.value?.timeline || res?.timeline || [];
    return timeline.map((t: any, idx: number) => ({
      id: `tl-${id}-${idx}`,
      status: t.eventType === 'OrderCreated' ? 'New' : t.eventType === 'ShipmentLoaded' ? 'Picked' : t.eventType === 'ShipmentDispatched' ? 'Shipped' : 'New',
      occurredAt: t.timestamp,
      notes: t.description,
      operatorId: t.location
    }));
  } catch (err) {
    console.error("Error fetching order timeline:", err);
    return mockTimelinesDb[id] || [];
  }
};

export const allocateOrder = async (id: string): Promise<{ success: boolean }> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 450));
    const order = mockOrdersDb.find(o => o.id === id);
    if (!order) throw new Error("Order not found");
    order.status = 'Allocated';
    return { success: true };
  }

  await fetchApi("wms", `/outbound/orders/${id}/allocate`, {
    method: "POST"
  });
  return { success: true };
};

export const cancelOrder = async (id: string, reason: string): Promise<{ success: boolean }> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const order = mockOrdersDb.find(o => o.id === id);
    if (!order) throw new Error("Order not found");
    order.status = 'Cancelled';
    return { success: true };
  }

  await fetchApi("wms", `/outbound/orders/${id}/cancel`, {
    method: "POST"
  });
  return { success: true };
};

export const splitOrder = async (id: string, lineId: string, splitQty: number): Promise<{ success: boolean }> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  }

  await fetchApi("wms", `/outbound/orders/${id}/split`, {
    method: "POST"
  });
  return { success: true };
};

export const getReturns = async (): Promise<OutboundReturnDto[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockReturnsDb];
  }

  try {
    const discrepancies = await fetchApi<any[]>("wms", "/inbound/transit-discrepancies");
    if (discrepancies && discrepancies.length > 0) {
      return discrepancies.map((d: any) => ({
        id: d.id,
        orderNo: d.referenceId || 'ORD-UNKNOWN',
        sku: d.sku,
        returnedQty: d.actualQty || d.expectedQty || 1,
        condition: d.type === 'Damage' ? 'Damaged' : 'Good',
        disposition: d.status === 'ResolvedApprove' ? 'Restocked' : 'Pending',
        createdAt: new Date().toISOString(),
        notes: d.notes
      }));
    }
  } catch {}
  return [...mockReturnsDb];
};

export const processDisposition = async (id: string, disposition: 'Restocked' | 'Scrapped' | 'Penalized', notes?: string): Promise<{ success: boolean }> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { success: true };
  }

  const defaultWarehouseId = "a0d33e7c-eb5a-4b08-9df2-5d46487e411b";
  await fetchApi("wms", "/outbound/returns/disposition", {
    method: "POST",
    body: {
      warehouseId: defaultWarehouseId,
      sku: "A0-001",
      quantity: 1,
      condition: disposition === 'Restocked' ? 1 : 2,
      targetBinCode: "ST-A-01",
      referenceId: id,
      referenceType: 1,
      notes: notes || "Processed return disposition via UI"
    }
  });
  return { success: true };
};

export const getWaves = async (): Promise<WaveDto[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockWavesDb];
};

export const autoPlanWaves = async (): Promise<{ success: boolean; createdWavesCount: number }> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, createdWavesCount: 1 };
  }

  const defaultWarehouseId = "a0d33e7c-eb5a-4b08-9df2-5d46487e411b";
  const result = await fetchApi<any>("wms", "/outbound/waves/auto-plan", {
    method: "POST",
    body: {
      warehouseId: defaultWarehouseId,
      maxSingleItemOrdersPerWave: 10,
      maxMultiItemOrdersPerWave: 10
    }
  });
  return {
    success: true,
    createdWavesCount: result?.createdWavesCount || result?.value?.createdWavesCount || 1
  };
};

export const startWave = async (waveId: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return { success: true };
};

export const releaseWave = async (waveId: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 450));
  return { success: true };
};

