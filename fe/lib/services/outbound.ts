import { fetchApi } from '../api-client';
import type { OutboundOrder, Shipment, SortOrderRequest } from '../types';

export async function getOutboundOrder(orderId: string): Promise<OutboundOrder> {
  return fetchApi<OutboundOrder>('wms', `/outbound/orders/${orderId}`);
}

export async function getShipments(): Promise<Shipment[]> {
  return fetchApi<Shipment[]>('wms', '/outbound/shipments');
}

export async function sortOrder(data: SortOrderRequest): Promise<unknown> {
  return fetchApi('wms', '/outbound/sort', {
    method: 'PUT',
    body: data,
  });
}
