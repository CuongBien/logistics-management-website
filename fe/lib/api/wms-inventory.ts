import { InventoryItemDto, InventoryLedgerDto } from '@/types/wms-inventory';
import { fetchApi } from '@/lib/api-client';

// API Services
export const getInventoryList = async (warehouseId?: string, binId?: string): Promise<InventoryItemDto[]> => {
  const params = [];
  if (warehouseId) params.push(`warehouseId=${warehouseId}`);
  if (binId) params.push(`binId=${binId}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  const res = await fetchApi<InventoryItemDto[]>('wms', `/inventory${query}`);
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

export const getGlobalLedgers = async (warehouseId?: string, sku?: string): Promise<any[]> => {
  let url = '/inventory/ledger';
  const params: string[] = [];
  if (warehouseId) params.push(`warehouseId=${warehouseId}`);
  if (sku) params.push(`sku=${sku}`);
  if (params.length > 0) url += '?' + params.join('&');

  const res = await fetchApi<any>("wms", url);
  const list = res?.value || res?.items || res || [];
  
  return list.map((l: any) => ({
    id: l.id,
    sku: l.sku,
    warehouseId: l.warehouseId,
    binId: l.binId,
    reason: l.reason,
    deltaQty: l.deltaQty,
    balanceAfter: l.balanceAfter,
    referenceType: l.referenceType || '',
    referenceId: l.referenceId || '',
    operatorSub: l.operatorSub || 'system',
    occurredAt: l.occurredAt
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

export const runGlobalReconciliation = async (warehouseId?: string): Promise<{ success: boolean, itemsProcessed: number, discrepanciesFound: number }> => {
  const res = await fetchApi<any>("wms", "/inventory/reconcile", {
    method: "POST",
    body: {
      warehouseId: warehouseId || null
    }
  });
  const val = res?.value || res || {};
  return {
    success: true,
    itemsProcessed: val.itemsProcessed || 0,
    discrepanciesFound: val.discrepanciesFound || 0
  };
};

export const getReconciliationReports = async (warehouseId?: string): Promise<any[]> => {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<any>("wms", `/inventory/reconciliation-reports${query}`);
  const list = res?.value || res?.items || res || [];
  return list.map((r: any) => ({
    id: r.id,
    inventoryItemId: r.inventoryItemId,
    sku: r.sku,
    warehouseId: r.warehouseId,
    binId: r.binId,
    lotNo: r.lotNo || 'N/A',
    snapshotQty: r.snapshotQty || 0,
    ledgerQty: r.ledgerQty || 0,
    difference: r.difference || 0,
    detectedAt: r.detectedAt,
    status: r.status, // Pending = 1, Resolved = 2, Ignored = 3
    resolutionNotes: r.resolutionNotes || ''
  }));
};

export const resolveReconciliationReport = async (id: string, notes: string): Promise<{ success: boolean }> => {
  await fetchApi("wms", `/inventory/reconciliation-reports/${id}/resolve`, {
    method: "POST",
    body: { notes }
  });
  return { success: true };
};

export const ignoreReconciliationReport = async (id: string, notes: string): Promise<{ success: boolean }> => {
  await fetchApi("wms", `/inventory/reconciliation-reports/${id}/ignore`, {
    method: "POST",
    body: { notes }
  });
  return { success: true };
};
