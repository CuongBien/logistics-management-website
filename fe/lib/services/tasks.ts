import { fetchApi } from '../api-client';
import type { PutawayTask, ReplenishmentTask, CycleCountTask } from '../types';

export async function getPutawayTasks(status: string = 'Pending'): Promise<PutawayTask[]> {
  try {
    return await fetchApi<PutawayTask[]>('wms', `/inbound/putaway-tasks?status=${status}`);
  } catch (e) {
    // Backend doesn't have GET endpoint yet, suppress error
    return [];
  }
}

export async function completePutawayTask(taskId: string, scannedDestinationBinCode: string): Promise<unknown> {
  return fetchApi('wms', `/inbound/putaway-tasks/${taskId}/complete`, {
    method: 'POST',
    body: { scannedDestinationBinCode }
  });
}

export async function generateReplenishmentTasks(tenantId: string, warehouseId: string): Promise<unknown> {
  return fetchApi('wms', `/inventory/tasks/replenish/generate?tenantId=${tenantId}&warehouseId=${warehouseId}`, {
    method: 'POST'
  });
}

export async function getReplenishmentTasks(status: string = 'Pending'): Promise<ReplenishmentTask[]> {
  try {
    return await fetchApi<ReplenishmentTask[]>('wms', `/inventory/tasks/replenish?status=${status}`);
  } catch (e) {
    return [];
  }
}

export async function completeReplenishmentTask(taskId: string): Promise<unknown> {
  return fetchApi('wms', `/inventory/tasks/replenish/${taskId}/complete`, {
    method: 'POST'
  });
}

export async function generateCycleCountTasks(tenantId: string, warehouseId: string, maxTasks: number = 10): Promise<unknown> {
  return fetchApi('wms', `/inventory/tasks/cycle-count/generate?tenantId=${tenantId}&warehouseId=${warehouseId}&maxTasks=${maxTasks}`, {
    method: 'POST'
  });
}

export async function submitCycleCount(taskId: string, countedQty: number): Promise<unknown> {
  return fetchApi('wms', `/inventory/tasks/cycle-count/${taskId}/submit`, {
    method: 'POST',
    body: { countedQty }
  });
}

export async function approveCycleCount(taskId: string): Promise<unknown> {
  return fetchApi('wms', `/inventory/tasks/cycle-count/${taskId}/approve`, {
    method: 'POST'
  });
}
