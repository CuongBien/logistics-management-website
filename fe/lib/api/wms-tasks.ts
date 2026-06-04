import { PutawayTaskDto, ReplenishmentTaskDto, CycleCountTaskDto } from "@/types/wms-tasks";
import { fetchApi } from "@/lib/api-client";

// ----------------------------------------------------------------------------
// 1. GET ALL PUTAWAY TASKS
// ----------------------------------------------------------------------------
export async function getPutawayTasks(): Promise<PutawayTaskDto[]> {
  return await fetchApi<PutawayTaskDto[]>("wms", "/inbound/putaway-tasks");
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
export async function getReplenishmentTasks(): Promise<ReplenishmentTaskDto[]> {
  return await fetchApi<ReplenishmentTaskDto[]>("wms", "/inventory/tasks/replenish");
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
export async function getCycleCountTasks(): Promise<CycleCountTaskDto[]> {
  return await fetchApi<CycleCountTaskDto[]>("wms", "/inventory/tasks/cycle-count");
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
export async function generateReplenishment(): Promise<ReplenishmentTaskDto[]> {
  const defaultWarehouseId = "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1"; // HCM warehouse ID from seed
  return await fetchApi<ReplenishmentTaskDto[]>("wms", `/inventory/tasks/replenish/generate?tenantId=default-tenant&warehouseId=${defaultWarehouseId}`, {
    method: "POST"
  });
}

// ----------------------------------------------------------------------------
// 5. GENERATE AUTO-CYCLE COUNT TASK
// ----------------------------------------------------------------------------
export async function generateCycleCount(binCode: string, sku: string): Promise<CycleCountTaskDto> {
  const defaultWarehouseId = "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1"; // HCM warehouse ID from seed
  return await fetchApi<CycleCountTaskDto>("wms", `/inventory/tasks/cycle-count/generate?tenantId=default-tenant&warehouseId=${defaultWarehouseId}&maxTasks=1`, {
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
