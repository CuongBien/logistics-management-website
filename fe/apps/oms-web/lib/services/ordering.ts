import type {
  Order,
  OrderConsignee,
  OrderStatusHistory,
  CreateOrderRequest,
  ApiResult,
} from '../types';
import { OrderStatus } from '../types';
import { fetchApi } from '../api-client';

// API Service Functions linking directly to C# Ordering Service via fetchApi proxy
export async function getOrderById(id: string): Promise<ApiResult<Order>> {
  try {
    const res = await fetchApi<any>('oms', `/orders/${id}`);
    if (res && res.isSuccess && res.value) {
      const o = res.value;
      const order: Order = {
        id: o.id,
        tenantId: o.tenantId,
        customerIdInternal: o.consignorId,
        consignorId: o.consignorId,
        externalReference: o.externalReference,
        waybillCode: o.waybillCode,
        status: o.status,
        codAmount: o.codAmount,
        shippingFee: o.shippingFee,
        weight: o.weight,
        note: o.note,
        createdAt: o.createdAt,
        lastModifiedAt: o.lastModifiedAt,
        createdByOperatorId: o.createdByOperatorId,
        updatedByOperatorId: o.updatedByOperatorId,
        pickupDriverId: o.pickupDriverId,
        warehouseId: o.warehouseId,
        destinationWarehouseId: o.destinationWarehouseId,
        deliveryDriverId: o.deliveryDriverId,
        routeId: o.routeId,
        proofOfDeliveryUrl: o.proofOfDeliveryUrl,
        failureReason: o.failureReason,
        deliveryAttempts: o.deliveryAttempts || 0,
        fulfillment: o.fulfillment || 'Pickup',
        sourceWarehouseCode: o.warehouseId,
        items: (o.items || []).map((it: any) => ({
          id: it.id,
          orderId: o.id,
          sku: it.skuCode || it.sku || '',
          skuCode: it.skuCode || it.sku || '',
          quantity: it.quantity || 1,
          price: it.price || 0
        })),
        consignee: {
          fullName: o.consignee?.fullName || '',
          phone: o.consignee?.phone || '',
          address: {
            street: o.consignee?.address?.street || '',
            city: o.consignee?.address?.city || '',
            state: o.consignee?.address?.state || '',
            country: o.consignee?.address?.country || '',
            zipCode: o.consignee?.address?.zipCode || ''
          }
        }
      };
      return { isSuccess: true, isFailure: false, value: order };
    }
    return { isSuccess: false, isFailure: true, error: res?.error || { code: "NotFound", message: "Không tìm thấy đơn hàng" } };
  } catch (error: any) {
    return { isSuccess: false, isFailure: true, error: { code: "Error", message: error.message } };
  }
}

export async function getOrderStatusHistory(id: string): Promise<ApiResult<OrderStatusHistory[]>> {
  try {
    const res = await fetchApi<any>('oms', `/orders/${id}/status-history`);
    if (res && res.isSuccess && res.value) {
      const list = res.value.map((h: any) => ({
        id: h.id,
        orderId: h.orderId,
        statusFrom: h.statusFrom,
        statusTo: h.statusTo,
        source: h.source,
        changedByOperatorId: h.changedByOperatorId,
        correlationId: h.correlationId,
        reason: h.reason,
        changedAt: h.changedAt
      }));
      return { isSuccess: true, isFailure: false, value: list };
    }
    return { isSuccess: true, isFailure: false, value: [] };
  } catch (error: any) {
    return { isSuccess: true, isFailure: false, value: [] };
  }
}

export async function getOrderConsignee(id: string): Promise<ApiResult<OrderConsignee>> {
  try {
    const res = await fetchApi<any>('oms', `/orders/${id}/consignee`);
    if (res && res.isSuccess && res.value) {
      const val = res.value;
      return {
        isSuccess: true,
        isFailure: false,
        value: {
          orderId: val.orderId,
          fullName: val.fullName || '',
          phone: val.phone || '',
          street: val.street || '',
          city: val.city || '',
          state: val.state || '',
          country: val.country || '',
          zipCode: val.zipCode || ''
        }
      };
    }
    return { isSuccess: false, isFailure: true, error: res?.error || { code: "NotFound", message: "Không tìm thấy người nhận" } };
  } catch (error: any) {
    return { isSuccess: false, isFailure: true, error: { code: "Error", message: error.message } };
  }
}

export async function createOrder(data: CreateOrderRequest, correlationId?: string): Promise<ApiResult<string>> {
  try {
    const body = {
      skuCodes: data.skuCodes,
      consignee: {
        fullName: data.consignee.fullName,
        phone: data.consignee.phone,
        address: {
          street: data.consignee.address.street,
          city: data.consignee.address.city,
          state: data.consignee.address.state,
          country: data.consignee.address.country,
          zipCode: data.consignee.address.zipCode
        }
      },
      codAmount: data.codAmount,
      shippingFee: data.shippingFee,
      weight: data.weight,
      note: data.note,
      fulfillmentMode: data.fulfillmentMode ?? 1, // Dynamic fulfillment mode
      orderType: 1, // Parcel
      sourceWarehouseCode: data.sourceWarehouseCode
    };
    const res = await fetchApi<any>('oms', '/orders', {
      method: 'POST',
      body,
      correlationId
    });
    if (res && res.isSuccess && res.value) {
      return { isSuccess: true, isFailure: false, value: res.value };
    }
    return { isSuccess: false, isFailure: true, error: res?.error || { code: "Error", message: "Tạo đơn hàng thất bại" } };
  } catch (error: any) {
    return { isSuccess: false, isFailure: true, error: { code: "Error", message: error.message } };
  }
}

export async function searchOrders(
  query: string, 
  statusFilter: string, 
  page: number = 1, 
  pageSize: number = 5,
  warehouseId?: string
): Promise<ApiResult<{ orders: Order[]; totalCount: number }>> {
  try {
    const statusParam = (statusFilter && statusFilter !== 'All') ? `&status=${statusFilter}` : '';
    const searchParam = query.trim() ? `&searchTerm=${encodeURIComponent(query.trim())}` : '';
    const whParam = warehouseId ? `&warehouseId=${warehouseId}` : '';
    const res = await fetchApi<any>('oms', `/orders?page=${page}&pageSize=${pageSize}${statusParam}${searchParam}${whParam}`);
    
    if (res && res.isSuccess && res.value) {
      const items = res.value.items || [];
      const totalCount = res.value.totalCount || 0;
      
      const orders = items.map((o: any) => ({
        id: o.id,
        tenantId: o.tenantId || "default-tenant",
        customerIdInternal: o.consignorId,
        consignorId: o.consignorId,
        waybillCode: o.waybillCode,
        status: o.status,
        codAmount: o.codAmount,
        shippingFee: o.shippingFee,
        weight: o.weight,
        createdAt: o.createdAt,
        deliveryAttempts: 0,
        items: [],
        consignee: {
          fullName: o.consigneeName || '',
          phone: o.consigneePhone || '',
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
          }
        }
      }));
      
      return {
        isSuccess: true,
        isFailure: false,
        value: {
          orders,
          totalCount
        }
      };
    }
    return { isSuccess: true, isFailure: false, value: { orders: [], totalCount: 0 } };
  } catch (error: any) {
    return { isSuccess: true, isFailure: false, value: { orders: [], totalCount: 0 } };
  }
}

export async function getOrderStatusSummary(warehouseId?: string): Promise<ApiResult<{ pending: number; dispatched: number; delivered: number; failed: number; cancelled: number }>> {
  try {
    const whParam = warehouseId ? `?warehouseId=${warehouseId}` : '';
    const res = await fetchApi<any>('oms', `/dashboard/status-summary${whParam}`);
    if (res && res.isSuccess && res.value) {
      return {
        isSuccess: true,
        isFailure: false,
        value: {
          pending: res.value.pending || 0,
          dispatched: res.value.dispatched || 0,
          delivered: res.value.delivered || 0,
          failed: res.value.failed || 0,
          cancelled: res.value.cancelled || 0
        }
      };
    }
    return { isSuccess: true, isFailure: false, value: { pending: 0, dispatched: 0, delivered: 0, failed: 0, cancelled: 0 } };
  } catch (error: any) {
    return { isSuccess: true, isFailure: false, value: { pending: 0, dispatched: 0, delivered: 0, failed: 0, cancelled: 0 } };
  }
}
