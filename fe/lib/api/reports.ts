import { fetchApi } from "@/lib/api-client";

export interface WarehouseCapacityDto {
  totalBins: number;
  emptyBins: number;
  occupiedBins: number;
  fullBins: number;
  occupancyRate: number;
}

export interface InventoryStatsDto {
  totalUniqueSkus: number;
  totalPhysicalQuantity: number;
}

export interface PendingWorkloadsDto {
  pendingInboundReceipts: number;
  pendingPutawayTasks: number;
  pendingOutboundWaves: number;
  pendingCrossDockTasks: number;
}

export interface DiscrepanciesStatsDto {
  unresolvedInboundDiscrepancies: number;
  unresolvedTransitDiscrepancies: number;
}

export interface OperatorProductivityDto {
  operatorId: string;
  pendingTasks: number;
  completedTasksToday: number;
}

export interface TopMovingSkuDto {
  skuId: string;
  totalMovement: number;
}

export async function getCapacity(): Promise<WarehouseCapacityDto> {
  const res = await fetchApi<any>('wms', '/Dashboard/capacity');
  return res?.value || res;
}

export async function getInventoryStats(): Promise<InventoryStatsDto> {
  const res = await fetchApi<any>('wms', '/Dashboard/inventory');
  return res?.value || res;
}

export async function getWorkloads(): Promise<PendingWorkloadsDto> {
  const res = await fetchApi<any>('wms', '/Dashboard/workloads');
  return res?.value || res;
}

export async function getDiscrepancies(): Promise<DiscrepanciesStatsDto> {
  const res = await fetchApi<any>('wms', '/Dashboard/discrepancies');
  return res?.value || res;
}

export async function getOperatorProductivity(): Promise<OperatorProductivityDto[]> {
  const res = await fetchApi<any>('wms', '/Dashboard/operator-productivity');
  return res?.value || res || [];
}

export async function getTopMovingSkus(): Promise<TopMovingSkuDto[]> {
  const res = await fetchApi<any>('wms', '/Dashboard/top-skus');
  return res?.value || res || [];
}
