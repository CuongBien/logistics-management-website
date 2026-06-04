import { InboundReceiptDto, DiscrepancyDto } from '@/types/wms-inbound';
import { fetchApi } from '../api-client';

export const getReceipts = async (): Promise<InboundReceiptDto[]> => {
  return await fetchApi<InboundReceiptDto[]>('wms', '/inbound/receipts');
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
  status: 'ResolvedApprove' | 'ResolvedReject', 
  notes?: string
): Promise<{ success: boolean }> => {
  await fetchApi("wms", `/inbound/discrepancies/${id}/resolve`, {
    method: "POST",
    body: {
      newStatus: 4, // map to Resolved = 4
      notes: notes || 'Resolved via Web UI'
    }
  });
  return { success: true };
};
