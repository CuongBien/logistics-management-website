import { InventoryItemDto, InventoryLedgerDto, LedgerTransactionType, ReconcileRequest } from '@/types/wms-inventory';
import { fetchApi } from '../api-client';

export const getInventoryList = async (): Promise<InventoryItemDto[]> => {
  return fetchApi<InventoryItemDto[]>('wms', '/inventory');
};

export const getInventoryItem = async (id: string): Promise<InventoryItemDto | undefined> => {
  return fetchApi<InventoryItemDto>('wms', `/inventory/${id}`);
};

export const getItemLedgers = async (id: string): Promise<InventoryLedgerDto[]> => {
  return fetchApi<InventoryLedgerDto[]>('wms', `/inventory/${id}/ledger`);
};

export const transferStock = async (data: { inventoryItemId: string; destBin: string; qty: number }) => {
  return fetchApi('wms', '/inventory/transfer', {
    method: 'POST',
    body: data
  });
};

export const reconcileStock = async (data: { inventoryItemId: string; actualQuantity: number; reason: string }) => {
  return fetchApi('wms', '/inventory/reconcile', {
    method: 'POST',
    body: data
  });
};

export const reserveStock = async (id: string, qty: number) => {
  return fetchApi('wms', '/inventory/reserve', {
    method: 'POST',
    body: { inventoryItemId: id, quantity: qty }
  });
};

export const releaseStock = async (id: string, qty: number) => {
  return fetchApi('wms', '/inventory/release', {
    method: 'POST',
    body: { inventoryItemId: id, quantity: qty }
  });
};

export const consumeStock = async (id: string, qty: number) => {
  return fetchApi('wms', '/inventory/consume', {
    method: 'POST',
    body: { inventoryItemId: id, quantity: qty }
  });
};
