import { fetchApi } from '../api-client';
import type {
  InboundReceipt,
  CreateReceiptRequest,
  ReceiveItemRequest,
} from '../types';

export async function getReceiptByOrderId(
  orderId: string,
  warehouseId?: string,
): Promise<InboundReceipt> {
  const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
  return fetchApi<InboundReceipt>('wms', `/inbound/receipts/by-order/${orderId}${params}`);
}

export async function createReceipt(data: CreateReceiptRequest): Promise<string> {
  return fetchApi<string>('wms', '/inbound/receipts', {
    method: 'POST',
    body: data,
  });
}

export async function receiveItem(
  receiptId: string,
  data: ReceiveItemRequest,
): Promise<unknown> {
  return fetchApi('wms', `/inbound/receipts/${receiptId}/receive`, {
    method: 'PUT',
    body: data,
  });
}

export async function forceCloseReceipt(receiptId: string): Promise<unknown> {
  return fetchApi('wms', `/inbound/receipts/${receiptId}/force-close`, {
    method: 'POST',
  });
}
