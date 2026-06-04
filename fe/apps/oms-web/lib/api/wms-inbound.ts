import { InboundReceiptDto, DiscrepancyDto } from '@/types/wms-inbound';
import { fetchApi } from '../api-client';

export const getReceipts = async (warehouseId?: string): Promise<InboundReceiptDto[]> => {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<InboundReceiptDto[]>('wms', `/inbound/receipts${query}`);
  return res || [];
};

export const getReceipt = async (id: string): Promise<InboundReceiptDto | undefined> => {
  const list = await getReceipts();
  return list.find(r => r.id === id);
};

export const getDiscrepancies = async (): Promise<DiscrepancyDto[]> => {
  const res = await fetchApi<any[]>('wms', '/inbound/discrepancies');
  return (res || []).map(d => ({
    id: d.id,
    type: d.type === 1 ? 'Short' : d.type === 2 ? 'Damage' : 'Over',
    sku: d.skuCode || d.sku,
    expectedQty: d.expectedQty || d.expectedQuantity || 0,
    actualQty: d.actualQty || d.receivedQuantity || 0,
    status: d.status === 4 ? 'ResolvedApprove' : 'Pending',
    notes: d.notes || ''
  }));
};

export const forceCloseReceipt = async (id: string): Promise<{ success: boolean }> => {
  await fetchApi("wms", `/inbound/receipts/${id}/force-close`, {
    method: "POST"
  });
  return { success: true };
};

export const resolveDiscrepancy = async (
  id: string, 
  status: number, 
  notes?: string
): Promise<{ success: boolean }> => {
  await fetchApi("wms", `/inbound/discrepancies/${id}/resolve`, {
    method: "POST",
    body: {
      newStatus: status,
      notes: notes || 'Resolved via Web UI'
    }
  });
  return { success: true };
};

export const getTransitDiscrepancies = async (warehouseId?: string): Promise<any[]> => {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<any[]>('wms', `/inbound/transit-discrepancies${query}`);
  return (res || []).map(d => ({
    id: d.id,
    outboundOrderId: d.outboundOrderId,
    shipmentId: d.shipmentId,
    sku: d.sku,
    expectedQty: d.expectedQty || 0,
    receivedQty: d.receivedQty || 0,
    discrepancyQty: (d.expectedQty || 0) - (d.receivedQty || 0),
    carrierName: d.carrierName || '',
    reportedBy: d.reportedBy || '',
    status: d.status,
    notes: d.notes || '',
    resolutionNotes: d.resolutionNotes || '',
    resolvedByOperatorId: d.resolvedByOperatorId || '',
    occurredAt: d.createdAt || d.occurredAt
  }));
};

export const resolveTransitDiscrepancy = async (
  id: string,
  status: number,
  notes?: string
): Promise<{ success: boolean }> => {
  await fetchApi("wms", `/inbound/transit-discrepancies/${id}/resolve`, {
    method: "POST",
    body: {
      newStatus: status,
      notes: notes || 'Resolved via Web UI'
    }
  });
  return { success: true };
};
