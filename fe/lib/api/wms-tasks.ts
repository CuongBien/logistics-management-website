import { fetchApi } from '../api-client';

export interface PutawayTaskDto {
  id: string;
  sku: string;
  quantity: number;
  sourceBinId: string;
  suggestedBinId: string;
  status: string;
  createdAt: string;
}

export interface ReplenishmentTaskDto {
  id: string;
  sku: string;
  quantity: number;
  fromBinId: string;
  toBinId: string;
  status: string;
  createdAt: string;
}

export interface CycleCountTaskDto {
  id: string;
  binId: string;
  sku: string;
  expectedQty: number;
  countedQty: number | null;
  status: string;
  operatorId: string | null;
  createdAt: string;
}

export async function fetchPutawayTasks(): Promise<PutawayTaskDto[]> {
  const result = await fetchApi<PutawayTaskDto[]>('wms', '/inbound/putaway-tasks');
  return result || [];
}

export async function completePutawayTask(taskId: string, scannedDestinationBinCode: string): Promise<void> {
  await fetchApi('wms', `/inbound/putaway-tasks/${taskId}/complete`, {
    method: 'POST',
    body: { scannedDestinationBinCode }
  });
}

export async function fetchReplenishmentTasks(): Promise<ReplenishmentTaskDto[]> {
  const result = await fetchApi<ReplenishmentTaskDto[]>('wms', '/inventory/tasks/replenish');
  return result || [];
}

export async function completeReplenishmentTask(taskId: string): Promise<void> {
  await fetchApi('wms', `/inventory/tasks/replenish/${taskId}/complete`, {
    method: 'POST'
  });
}

export async function fetchCycleCountTasks(): Promise<CycleCountTaskDto[]> {
  const result = await fetchApi<CycleCountTaskDto[]>('wms', '/inventory/tasks/cycle-count');
  return result || [];
}

export async function submitCycleCount(taskId: string, countedQty: number): Promise<void> {
  await fetchApi('wms', `/inventory/tasks/cycle-count/${taskId}/submit`, {
    method: 'POST',
    body: { countedQty }
  });
}

export async function approveCycleCount(taskId: string): Promise<void> {
  await fetchApi('wms', `/inventory/tasks/cycle-count/${taskId}/approve`, {
    method: 'POST'
  });
}
