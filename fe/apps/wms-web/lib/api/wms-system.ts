import { fetchApi } from "@/lib/api-client";

export interface SyncCheckpointDto {
  id: string;
  tenantId: string;
  entityType: string;
  lastSuccessCursor: string;
  lastSyncedAt: string;
}

export async function getSyncCheckpoints(): Promise<SyncCheckpointDto[]> {
  const res = await fetchApi<any>("wms", "/System/sync-checkpoints");
  return res || [];
}

export async function triggerSync(): Promise<{ message: string }> {
  return await fetchApi<any>("wms", "/System/sync-checkpoints/trigger", {
    method: "POST"
  });
}
