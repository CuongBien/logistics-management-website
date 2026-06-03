import { InventoryItemDto, InventoryLedgerDto } from '@/types/wms-inventory';
import { fetchApi } from '@/lib/api-client';

// API Services
export const getInventoryList = async (): Promise<InventoryItemDto[]> => {
  const res = await fetchApi<InventoryItemDto[]>('wms', '/inventory');
  return res || [];
};

export const getInventoryItem = async (id: string): Promise<InventoryItemDto | undefined> => {
  return await fetchApi<InventoryItemDto>('wms', `/inventory/${id}`);
};

export const getItemLedgers = async (id: string): Promise<InventoryLedgerDto[]> => {
  const res = await fetchApi<any>("wms", `/inventory/${id}/ledger`);
  const list = res?.value || res?.items || res || [];
  
  return list.map((l: any) => ({
    id: l.id,
    inventoryItemId: l.inventoryItemId || id,
    transactionType: l.transactionType || 'Adjust',
    deltaQty: l.deltaQty || 0,
    balanceAfter: l.balanceAfter || 0,
    referenceId: l.referenceId || '',
    occurredAt: l.occurredAt || new Date().toISOString(),
    operatorId: l.operatorId || 'system'
  }));
};

export const transferStock = async (data: { inventoryItemId: string; destBin: string; qty: number }) => {
  await fetchApi("wms", "/inventory/transfer", {
    method: "POST",
    body: {
      inventoryItemId: data.inventoryItemId,
      destBin: data.destBin,
      qty: data.qty
    }
  });
  return { success: true };
};

export const reconcileStock = async (data: { inventoryItemId: string; actualQuantity: number; reason: string }) => {
  await fetchApi("wms", "/inventory/reconcile", {
    method: "POST",
    body: {
      inventoryItemId: data.inventoryItemId,
      actualQuantity: data.actualQuantity,
      reason: data.reason
    }
  });
  return { success: true };
};

export const reserveStock = async (id: string, qty: number) => {
  await fetchApi("wms", "/inventory/reserve", {
    method: "POST",
    body: {
      inventoryItemId: id,
      quantity: qty
    }
  });
  return { success: true };
};

export const releaseStock = async (id: string, qty: number) => {
  await fetchApi("wms", "/inventory/release", {
    method: "POST",
    body: {
      inventoryItemId: id,
      quantity: qty
    }
  });
  return { success: true };
};

export const consumeStock = async (id: string, qty: number) => {
  await fetchApi("wms", "/inventory/consume", {
    method: "POST",
    body: {
      inventoryItemId: id,
      quantity: qty
    }
  });
  return { success: true };
};
