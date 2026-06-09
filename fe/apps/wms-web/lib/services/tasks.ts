import { fetchApi } from '../api-client';
import type { PutawayTask, ReplenishmentTask, CycleCountTask } from '../types';

export async function getPutawayTasks(
  status: string = 'Pending',
  filters: { assignedToMe?: boolean; unassigned?: boolean } = {}
): Promise<PutawayTask[]> {
  try {
    const params = new URLSearchParams({ status });
    if (filters.assignedToMe) params.append('assignedToMe', 'true');
    if (filters.unassigned) params.append('unassigned', 'true');
    return await fetchApi<PutawayTask[]>('wms', `/inbound/putaway-tasks?${params.toString()}`);
  } catch (e) {
    return [];
  }
}

export async function completePutawayTask(taskId: string, scannedDestinationBinCode: string): Promise<unknown> {
  return fetchApi('wms', `/inbound/putaway-tasks/${taskId}/complete`, {
    method: 'POST',
    body: { scannedDestinationBinCode }
  });
}

export async function claimPutawayTask(taskId: string): Promise<unknown> {
  return fetchApi('wms', `/inbound/putaway-tasks/${taskId}/claim`, {
    method: 'POST'
  });
}

export async function generateReplenishmentTasks(tenantId: string, warehouseId: string): Promise<unknown> {
  return fetchApi('wms', `/inventory/tasks/replenish/generate?tenantId=${tenantId}&warehouseId=${warehouseId}`, {
    method: 'POST'
  });
}

export async function getReplenishmentTasks(
  status: string = 'Pending',
  filters: { assignedToMe?: boolean; unassigned?: boolean } = {}
): Promise<ReplenishmentTask[]> {
  try {
    const params = new URLSearchParams({ status });
    if (filters.assignedToMe) params.append('assignedToMe', 'true');
    if (filters.unassigned) params.append('unassigned', 'true');
    return await fetchApi<ReplenishmentTask[]>('wms', `/inventory/tasks/replenish?${params.toString()}`);
  } catch (e) {
    return [];
  }
}

export async function completeReplenishmentTask(taskId: string): Promise<unknown> {
  return fetchApi('wms', `/inventory/tasks/replenish/${taskId}/complete`, {
    method: 'POST'
  });
}

export async function claimReplenishmentTask(taskId: string): Promise<unknown> {
  return fetchApi('wms', `/inventory/tasks/replenish/${taskId}/claim`, {
    method: 'POST'
  });
}

export async function generateCycleCountTasks(tenantId: string, warehouseId: string, maxTasks: number = 10): Promise<unknown> {
  return fetchApi('wms', `/inventory/tasks/cycle-count/generate?tenantId=${tenantId}&warehouseId=${warehouseId}&maxTasks=${maxTasks}`, {
    method: 'POST'
  });
}

export async function getCycleCountTasks(
  status: string = 'Pending',
  filters: { assignedToMe?: boolean; unassigned?: boolean } = {}
): Promise<CycleCountTask[]> {
  try {
    const params = new URLSearchParams({ status });
    if (filters.assignedToMe) params.append('assignedToMe', 'true');
    if (filters.unassigned) params.append('unassigned', 'true');
    return await fetchApi<CycleCountTask[]>('wms', `/inventory/tasks/cycle-count?${params.toString()}`);
  } catch (e) {
    // If backend cycle-count list endpoint isn't fully ready or returns 404, fall back to dummy/empty
    return [];
  }
}

export async function claimCycleCountTask(taskId: string): Promise<unknown> {
  return fetchApi('wms', `/inventory/tasks/cycle-count/${taskId}/assign`, {
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
