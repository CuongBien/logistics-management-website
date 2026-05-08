import { fetchApi } from '../api-client';
import type {
  InventoryLedger,
  ReserveStockRequest,
  ReleaseStockRequest,
  ConsumeStockRequest,
  ReconcileRequest,
  ApiResult,
} from '../types';

export async function getLedger(inventoryItemId: string): Promise<ApiResult<InventoryLedger[]>> {
  return fetchApi<ApiResult<InventoryLedger[]>>('wms', `/inventory/${inventoryItemId}/ledger`);
}

export async function reserveStock(data: ReserveStockRequest): Promise<ApiResult<string>> {
  return fetchApi<ApiResult<string>>('wms', '/inventory/reserve', {
    method: 'POST',
    body: data,
  });
}

export async function releaseStock(data: ReleaseStockRequest): Promise<ApiResult> {
  return fetchApi<ApiResult>('wms', '/inventory/release', {
    method: 'POST',
    body: data,
  });
}

export async function consumeStock(data: ConsumeStockRequest): Promise<ApiResult> {
  return fetchApi<ApiResult>('wms', '/inventory/consume', {
    method: 'POST',
    body: data,
  });
}

export async function reconcileInventory(data: ReconcileRequest): Promise<ApiResult> {
  return fetchApi<ApiResult>('wms', '/inventory/reconcile', {
    method: 'POST',
    body: data,
  });
}
