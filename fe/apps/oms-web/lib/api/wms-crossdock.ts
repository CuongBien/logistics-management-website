import { CrossDockTaskDto } from "@/types/wms-crossdock";
import { fetchApi } from "@/lib/api-client";

// Get all cross-dock tasks from live database
export async function getCrossDockTasks(): Promise<CrossDockTaskDto[]> {
  const res = await fetchApi<CrossDockTaskDto[]>("wms", "/inbound/cross-dock-tasks");
  return res || [];
}
