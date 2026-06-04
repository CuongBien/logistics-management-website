import { OutboundOrderDto, OutboundOrderStatus, OutboundOrderTimelineDto, OutboundReturnDto, WaveDto } from '@/types/wms-outbound';
import { fetchApi } from '@/lib/api-client';

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

export const getOrders = async (warehouseId?: string): Promise<OutboundOrderDto[]> => {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<any[]>('wms', `/outbound/orders${query}`);
  if (res) {
    return res.map((s: any) => ({
      id: s.id,
      orderNo: s.orderNo,
      tenantId: s.tenantId,
      status: mapStatus(s.status),
      lines: (s.lines || []).map((l: any) => ({
        id: l.id,
        sku: l.sku || l.skuCode || '',
        quantity: l.quantity ?? l.orderedQuantity ?? l.requestedQty ?? 0
      })),
      createdAt: s.createdAt
    }));
  }
  return [];
};

export const getOrderById = async (id: string): Promise<OutboundOrderDto | undefined> => {
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
        quantity: l.quantity ?? l.orderedQuantity ?? l.requestedQty ?? 0
      })),
      createdAt: s.createdAt
    };
  }
  return undefined;
};

export const getOrderTimeline = async (id: string): Promise<OutboundOrderTimelineDto[]> => {
  const res = await fetchApi<any>("wms", `/outbound/orders/${id}/tracking-timeline`);
  const timeline = res?.value?.timeline || res?.timeline || [];
  return timeline.map((t: any, idx: number) => ({
    id: `tl-${id}-${idx}`,
    status: t.eventType === 'OrderCreated' ? 'New' : t.eventType === 'ShipmentLoaded' ? 'Picked' : t.eventType === 'ShipmentDispatched' ? 'Shipped' : 'New',
    occurredAt: t.timestamp,
    notes: t.description,
    operatorId: t.location
  }));
};

export const allocateOrder = async (id: string): Promise<{ success: boolean }> => {
  await fetchApi("wms", `/outbound/orders/${id}/allocate`, {
    method: "POST"
  });
  return { success: true };
};

export const cancelOrder = async (id: string, reason: string): Promise<{ success: boolean }> => {
  await fetchApi("wms", `/outbound/orders/${id}/cancel`, {
    method: "POST"
  });
  return { success: true };
};

export const splitOrder = async (id: string, lineId: string, splitQty: number): Promise<{ success: boolean }> => {
  await fetchApi("wms", `/outbound/orders/${id}/split`, {
    method: "POST"
  });
  return { success: true };
};

export const getReturns = async (warehouseId: string): Promise<OutboundReturnDto[]> => {
  const res = await fetchApi<OutboundReturnDto[]>('wms', `/outbound/returns?warehouseId=${warehouseId}`);
  return res || [];
};

export const processDisposition = async (id: string, disposition: 'Restocked' | 'Scrapped' | 'Penalized', warehouseId: string, notes?: string): Promise<{ success: boolean }> => {
  let condition = 1; // Good
  if (disposition === 'Scrapped' || disposition === 'Penalized') condition = 2; // Damaged

  await fetchApi<{ success: boolean }>('wms', `/outbound/returns/disposition`, {
    method: 'POST',
    body: {
      warehouseId,
      sku: 'UNKNOWN', 
      quantity: 1, 
      condition,
      targetBinCode: disposition === 'Restocked' ? 'BIN-A1-01' : undefined,
      referenceId: id,
      referenceType: 'OutboundReturn',
      notes: notes || 'Processed via Web UI'
    }
  });

  return { success: true };
};

export const getWaves = async (warehouseId: string): Promise<WaveDto[]> => {
  const res = await fetchApi<WaveDto[]>('wms', `/outbound/waves?warehouseId=${warehouseId}`);
  return res || [];
};

export const autoPlanWaves = async (warehouseId: string): Promise<{ success: boolean; createdWavesCount: number }> => {
  const res = await fetchApi<{ createdWaveIds: string[], totalOrdersPlanned: number }>('wms', `/outbound/waves/auto-plan`, {
    method: 'POST',
    body: {
      warehouseId,
      maxSingleItemOrdersPerWave: 50,
      maxMultiItemOrdersPerWave: 20
    }
  });
  
  return { success: true, createdWavesCount: res.createdWaveIds?.length || 0 };
};

export const startWave = async (waveId: string): Promise<{ success: boolean }> => {
  await fetchApi<{ success: boolean }>('wms', `/outbound/waves/${waveId}/start`, { method: 'POST' });
  return { success: true };
};

export const releaseWave = async (waveId: string): Promise<{ success: boolean }> => {
  await fetchApi<{ success: boolean }>('wms', `/outbound/waves/${waveId}/release`, { method: 'POST' });
  return { success: true };
};
