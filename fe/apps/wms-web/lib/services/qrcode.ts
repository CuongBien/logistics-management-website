import { fetchApi, getStoredToken } from '../api-client';

// ============================================
// DTO Types for QR Operations
// ============================================

export interface ParseQrRequest {
  rawValue: string;
  warehouseId?: string;
}

export interface ParseQrResponse {
  type: string; // BIN | ORDER | OUTBOUND_ORDER | SHIPMENT | SKU | RECEIPT | UNKNOWN
  entityId: string | null;
  data: any;
  message?: string;
}

export interface ScanReceiveRequest {
  receiptId: string;
  scannedSku: string;
  scannedBin: string;
  quantity: number;
  lotNo?: string;
  expiryDate?: string;
}

export interface ConfirmPutawayRequest {
  taskId: string;
  scannedBin: string;
}

export interface ConfirmCrossDockRequest {
  taskId: string;
  scannedBin: string;
}

export interface TransitReceiveRequest {
  scannedOrder: string;
  warehouseId: string;
  scannedBin?: string;
  receivedItems?: Record<string, number>;
}

export interface ConfirmPickRequest {
  pickTaskId: string;
  scannedBin: string;
  scannedSku: string;
}

export interface VerifyPackRequest {
  outboundOrderId: string;
  scannedSku: string;
  quantity: number;
}

export interface ScanSortRequest {
  scannedOrder: string;
  destinationWarehouseId?: string;
}

export interface ScanLoadRequest {
  scannedOrder: string;
  shipmentId?: string;
}

export interface ShipAndReleaseRequest {
  scannedOrder: string;
  shipmentId?: string;
}

export interface CycleCountStartRequest {
  countTaskId: string;
  scannedBin: string;
}

export interface ConfirmReplenishRequest {
  taskId: string;
  scannedSourceBin: string;
  scannedDestBin: string;
}

// ============================================
// API Endpoints (Direct Integration)
// ============================================

// B1: Parse QR code
export async function parseQrCode(data: ParseQrRequest): Promise<ParseQrResponse> {
  return await fetchApi<ParseQrResponse>('wms', '/qrcode/parse', {
    method: 'POST',
    body: data,
  });
}

// B2 - B5: Lookups
export async function lookupBin(binId: string): Promise<any> {
  return await fetchApi('wms', `/qrcode/lookup/bin/${binId}`);
}

export async function lookupOrder(orderId: string): Promise<any> {
  return await fetchApi('wms', `/qrcode/lookup/order/${orderId}`);
}

export async function lookupShipment(shipmentId: string): Promise<any> {
  return await fetchApi('wms', `/qrcode/lookup/shipment/${shipmentId}`);
}

export async function lookupSku(skuCode: string): Promise<any> {
  return await fetchApi('wms', `/qrcode/lookup/sku/${skuCode}`);
}

// C1 - C11: Actions
export async function scanReceive(data: ScanReceiveRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/scan-receive', {
    method: 'POST',
    body: data,
  });
}

export async function confirmPutaway(data: ConfirmPutawayRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/confirm-putaway', {
    method: 'POST',
    body: data,
  });
}

export async function confirmCrossDock(data: ConfirmCrossDockRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/confirm-crossdock', {
    method: 'POST',
    body: data,
  });
}

export async function transitReceive(data: TransitReceiveRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/transit-receive', {
    method: 'POST',
    body: data,
  });
}

export async function confirmPick(data: ConfirmPickRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/confirm-pick', {
    method: 'POST',
    body: data,
  });
}

export async function verifyPack(data: VerifyPackRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/verify-pack', {
    method: 'POST',
    body: data,
  });
}

export async function scanSort(data: ScanSortRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/scan-sort', {
    method: 'POST',
    body: data,
  });
}

export async function scanLoad(data: ScanLoadRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/scan-load', {
    method: 'POST',
    body: data,
  });
}

export async function shipAndRelease(data: ShipAndReleaseRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/ship-and-release', {
    method: 'POST',
    body: data,
  });
}

export async function cycleCountStart(data: CycleCountStartRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/cycle-count-start', {
    method: 'POST',
    body: data,
  });
}

export async function confirmReplenish(data: ConfirmReplenishRequest): Promise<any> {
  return await fetchApi('wms', '/qrcode/actions/confirm-replenish', {
    method: 'POST',
    body: data,
  });
}

// A1 - A7: Helper to get QR image URL as object URL from blob (including auth header)
export async function getQrImageUrl(
  type: 'bin' | 'order' | 'outbound-order' | 'shipment' | 'receipt' | 'sku', 
  idOrCode: string,
  tokenOverride?: string | null
): Promise<string> {
  const token = tokenOverride !== undefined ? tokenOverride : await getStoredToken();
  const path = `/qrcode/${type}/${idOrCode}`;
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`/api/wms${path}`, {
    headers,
    cache: 'no-store',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch QR image: ${response.statusText}`);
  }
  
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('image/')) {
    throw new Error(`Expected image, but got content-type: ${contentType}`);
  }
  
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

// Batch download helper
export async function getBinsBatchQr(warehouseId: string): Promise<any[]> {
  return await fetchApi<any[]>('wms', `/qrcode/warehouse/${warehouseId}/bins/batch`);
}
