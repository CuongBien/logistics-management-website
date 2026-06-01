import { InboundReceiptDto, InboundReceiptStatus, DiscrepancyDto, DiscrepancyStatus } from '@/types/wms-inbound';

// Mocked database for Inbound Receipts
let mockReceiptsDb: InboundReceiptDto[] = [
  {
    id: 'rec-1',
    receiptNo: 'REC-2026-0001',
    orderId: 'ORD-99901-OMS',
    status: 'Pending',
    lines: [
      { id: 'line-1-1', sku: 'IPHONE15-PRO-256', expectedQuantity: 100, receivedQuantity: 0 },
      { id: 'line-1-2', sku: 'MACBOOK-M3-16GB', expectedQuantity: 30, receivedQuantity: 0 },
    ]
  },
  {
    id: 'rec-2',
    receiptNo: 'REC-2026-0002',
    orderId: 'ORD-99902-OMS',
    status: 'PartiallyReceived',
    lines: [
      { id: 'line-2-1', sku: 'SAM-S24-ULTRA', expectedQuantity: 80, receivedQuantity: 65 },
      { id: 'line-2-2', sku: 'AIRPODS-PRO-2', expectedQuantity: 200, receivedQuantity: 180 },
    ]
  },
  {
    id: 'rec-3',
    receiptNo: 'REC-2026-0003',
    orderId: 'ORD-99903-OMS',
    status: 'Closed',
    lines: [
      { id: 'line-3-1', sku: 'LOGITECH-MX-KEYS', expectedQuantity: 120, receivedQuantity: 120 },
      { id: 'line-3-2', sku: 'SONY-WH1000XM5', expectedQuantity: 40, receivedQuantity: 40 },
    ]
  }
];

// Mocked database for OS&D Discrepancies
let mockDiscrepanciesDb: DiscrepancyDto[] = [
  {
    id: 'disc-1',
    type: 'Short',
    sku: 'SAM-S24-ULTRA',
    expectedQty: 80,
    actualQty: 65, // Short by 15
    status: 'Pending',
    notes: 'Thực tế nhận thiếu 15 máy so với phiếu nhập. Thùng hàng có dấu hiệu bị rách băng keo.'
  },
  {
    id: 'disc-2',
    type: 'Damage',
    sku: 'AIRPODS-PRO-2',
    expectedQty: 200,
    actualQty: 180, // 20 units damaged or rejected
    status: 'Pending',
    notes: '20 hộp tai nghe bị móp méo nặng do va đập trong quá trình vận chuyển từ supplier.'
  },
  {
    id: 'disc-3',
    type: 'Over',
    sku: 'LOGITECH-MX-KEYS',
    expectedQty: 120,
    actualQty: 130, // Over by 10
    status: 'ResolvedApprove',
    notes: 'Nhận thừa 10 bàn phím. Đã phê duyệt nhập kho và tăng số lượng thực tế ghi nhận.'
  },
  {
    id: 'disc-4',
    type: 'Short',
    sku: 'IPHONE15-PRO-256',
    expectedQty: 50,
    actualQty: 48, // Short by 2
    status: 'ResolvedReject',
    notes: 'Hàng thiếu 2 chiếc nhưng tài xế bàn giao không ký xác nhận biên bản đồng kiểm.'
  }
];

import { fetchApi } from '../api-client';

export const getReceipts = async (): Promise<InboundReceiptDto[]> => {
  return await fetchApi<InboundReceiptDto[]>('wms', '/inbound/receipts');
};

export const getReceipt = async (id: string): Promise<InboundReceiptDto | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockReceiptsDb.find(r => r.id === id);
};

export const getDiscrepancies = async (): Promise<DiscrepancyDto[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockDiscrepanciesDb];
};

export const forceCloseReceipt = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const receipt = mockReceiptsDb.find(r => r.id === id);
  if (!receipt) throw new Error("Receipt not found");
  
  receipt.status = 'Closed';
  return { success: true };
};

export const resolveDiscrepancy = async (
  id: string, 
  status: 'ResolvedApprove' | 'ResolvedReject', 
  notes?: string
): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const discrepancy = mockDiscrepanciesDb.find(d => d.id === id);
  if (!discrepancy) throw new Error("Discrepancy report not found");
  
  discrepancy.status = status;
  if (notes) {
    discrepancy.notes = notes;
  }
  return { success: true };
};
