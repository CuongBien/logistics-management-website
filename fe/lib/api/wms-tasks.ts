import { PutawayTaskDto, ReplenishmentTaskDto, CycleCountTaskDto } from "@/types/wms-tasks";
import { fetchApi } from "@/lib/api-client";

// ----------------------------------------------------------------------------
// 1. GET ALL PUTAWAY TASKS
// ----------------------------------------------------------------------------
export async function getPutawayTasks(warehouseId?: string): Promise<PutawayTaskDto[]> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  return await fetchApi<PutawayTaskDto[]>("wms", `/inbound/putaway-tasks${query}`);
}

export async function fetchPutawayTasks(): Promise<PutawayTaskDto[]> {
  return await getPutawayTasks();
}

export async function completePutawayTask(taskId: string, scannedDestinationBinCode: string): Promise<void> {
  await fetchApi('wms', `/inbound/putaway-tasks/${taskId}/complete`, {
    method: 'POST',
    body: { scannedDestinationBinCode }
  });
}

// ----------------------------------------------------------------------------
// 2. GET ALL REPLENISHMENT TASKS
// ----------------------------------------------------------------------------
export async function getReplenishmentTasks(warehouseId?: string): Promise<ReplenishmentTaskDto[]> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  return await fetchApi<ReplenishmentTaskDto[]>("wms", `/inventory/tasks/replenish${query}`);
}

export async function fetchReplenishmentTasks(): Promise<ReplenishmentTaskDto[]> {
  return await getReplenishmentTasks();
}

export async function completeReplenishmentTask(taskId: string): Promise<void> {
  await fetchApi('wms', `/inventory/tasks/replenish/${taskId}/complete`, {
    method: 'POST'
  });
}

// ----------------------------------------------------------------------------
// 3. GET ALL CYCLE COUNT TASKS
// ----------------------------------------------------------------------------
export async function getCycleCountTasks(warehouseId?: string): Promise<CycleCountTaskDto[]> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  return await fetchApi<CycleCountTaskDto[]>("wms", `/inventory/tasks/cycle-count${query}`);
}

export async function fetchCycleCountTasks(): Promise<CycleCountTaskDto[]> {
  return await getCycleCountTasks();
}

export async function submitCycleCount(taskId: string, countedQty: number): Promise<void> {
  await fetchApi('wms', `/inventory/tasks/cycle-count/${taskId}/submit`, {
    method: 'POST',
    body: { countedQty }
  });
}

// ----------------------------------------------------------------------------
// 4. TRIGGER REPLENISHMENT ALGORITHM
// ----------------------------------------------------------------------------
export async function generateReplenishment(warehouseId: string): Promise<ReplenishmentTaskDto[]> {
  return await fetchApi<ReplenishmentTaskDto[]>("wms", `/inventory/tasks/replenish/generate?tenantId=default-tenant&warehouseId=${warehouseId}`, {
    method: "POST"
  });
}

// ----------------------------------------------------------------------------
// 5. GENERATE AUTO-CYCLE COUNT TASK
// ----------------------------------------------------------------------------
export async function generateCycleCount(warehouseId: string, binCode: string, sku: string): Promise<CycleCountTaskDto> {
  return await fetchApi<CycleCountTaskDto>("wms", `/inventory/tasks/cycle-count/generate?tenantId=default-tenant&warehouseId=${warehouseId}&maxTasks=1`, {
    method: "POST"
  });
}

// ----------------------------------------------------------------------------
// 6. APPROVE CYCLE COUNT DISCREPANCY
// ----------------------------------------------------------------------------
export async function approveCycleCount(id: string, notes?: string): Promise<CycleCountTaskDto | void> {
  await fetchApi("wms", `/inventory/tasks/cycle-count/${id}/approve`, {
    method: "POST",
    body: { notes: notes || "Phê duyệt" }
  });
}

// ----------------------------------------------------------------------------
// 7. REJECT CYCLE COUNT DISCREPANCY
// ----------------------------------------------------------------------------
export async function rejectCycleCount(id: string, notes: string): Promise<CycleCountTaskDto> {
  return await fetchApi<CycleCountTaskDto>("wms", `/inventory/tasks/cycle-count/${id}/reject`, {
    method: "POST",
    body: { notes }
  });
}
