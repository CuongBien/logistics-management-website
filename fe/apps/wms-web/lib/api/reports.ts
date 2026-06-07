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

export async function getCapacity(warehouseId?: string): Promise<WarehouseCapacityDto> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<any>('wms', `/Dashboard/capacity${query}`);
  return res?.value || res;
}

export async function getInventoryStats(warehouseId?: string): Promise<InventoryStatsDto> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<any>('wms', `/Dashboard/inventory${query}`);
  return res?.value || res;
}

export async function getWorkloads(warehouseId?: string): Promise<PendingWorkloadsDto> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<any>('wms', `/Dashboard/workloads${query}`);
  return res?.value || res;
}

export async function getDiscrepancies(warehouseId?: string): Promise<DiscrepanciesStatsDto> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<any>('wms', `/Dashboard/discrepancies${query}`);
  return res?.value || res;
}

export async function getOperatorProductivity(warehouseId?: string): Promise<OperatorProductivityDto[]> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<any>('wms', `/Dashboard/operator-productivity${query}`);
  return res?.value || res || [];
}

export async function getTopMovingSkus(warehouseId?: string): Promise<TopMovingSkuDto[]> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<any>('wms', `/Dashboard/top-skus${query}`);
  return res?.value || res || [];
}

export interface ZoneOccupancyDto {
  id: string;
  name: string;
  ordersActive: number;
  workersAssigned: number;
  capacity: number;
  alerts: number;
}

export async function getZoneOccupancy(warehouseId: string): Promise<ZoneOccupancyDto[]> {
  const res = await fetchApi<any>('wms', `/Dashboard/zone-occupancy?warehouseId=${warehouseId}`);
  return res?.value || res || [];
}

export interface DailyProductivityDto {
  date: string;
  putawayCount: number;
  pickCount: number;
  replenishCount: number;
  countCount: number;
}

export interface OperatorLeaderboardDto {
  operatorId: string;
  totalCompleted: number;
  avgDurationSeconds: number;
  pendingTasksCount: number;
}

export interface OperatorProductivityHistoryDto {
  trend: DailyProductivityDto[];
  leaderboard: OperatorLeaderboardDto[];
}

export async function getProductivityHistory(warehouseId?: string): Promise<OperatorProductivityHistoryDto> {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
  const res = await fetchApi<any>('wms', `/Dashboard/productivity-history${query}`);
  return res?.value || res;
}
