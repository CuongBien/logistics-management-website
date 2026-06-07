import { fetchApi } from '../api-client';
import type { CrossDockTask } from '../types';

export async function getCrossDockTasks(status: string = 'Pending'): Promise<CrossDockTask[]> {
  return fetchApi<CrossDockTask[]>('wms', `/inbound/cross-dock-tasks?status=${status}`);
}

export async function completeCrossDockTask(taskId: string, scannedDestinationBinCode: string): Promise<unknown> {
  return fetchApi('wms', `/inbound/cross-dock/${taskId}/complete`, {
    method: 'POST',
    body: { scannedDestinationBinCode }
  });
}
