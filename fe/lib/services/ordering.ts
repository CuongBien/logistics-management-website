import { fetchApi } from '../api-client';
import type {
  Order,
  OrderConsignee,
  OrderStatusHistory,
  CreateOrderRequest,
  ApiResult,
} from '../types';

export async function getOrderById(id: string): Promise<ApiResult<Order>> {
  return fetchApi<ApiResult<Order>>('oms', `/Orders/${id}`);
}

export async function getOrderStatusHistory(id: string): Promise<ApiResult<OrderStatusHistory[]>> {
  return fetchApi<ApiResult<OrderStatusHistory[]>>('oms', `/Orders/${id}/status-history`);
}

export async function getOrderConsignee(id: string): Promise<ApiResult<OrderConsignee>> {
  return fetchApi<ApiResult<OrderConsignee>>('oms', `/Orders/${id}/consignee`);
}

export async function createOrder(data: CreateOrderRequest, correlationId?: string): Promise<ApiResult<string>> {
  return fetchApi<ApiResult<string>>('oms', '/Orders', {
    method: 'POST',
    body: data,
    correlationId,
  });
}

export async function pickupOrder(orderId: string, driverId: string): Promise<ApiResult> {
  return fetchApi<ApiResult>('oms', `/orders/${orderId}/actions/pickup`, {
    method: 'PUT',
    body: { driverId },
  });
}

export async function dispatchOrder(orderId: string, driverId: string, routeId: string): Promise<ApiResult> {
  return fetchApi<ApiResult>('oms', `/orders/${orderId}/actions/dispatch`, {
    method: 'PUT',
    body: { driverId, routeId },
  });
}

export async function deliverOrder(orderId: string, proofOfDeliveryUrl: string): Promise<ApiResult> {
  return fetchApi<ApiResult>('oms', `/orders/${orderId}/actions/deliver`, {
    method: 'PUT',
    body: { proofOfDeliveryUrl },
  });
}

export async function failDelivery(orderId: string, reason: string): Promise<ApiResult> {
  return fetchApi<ApiResult>('oms', `/orders/${orderId}/actions/fail`, {
    method: 'PUT',
    body: { reason },
  });
}

