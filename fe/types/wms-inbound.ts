export type InboundReceiptStatus = 'Pending' | 'PartiallyReceived' | 'Received' | 'CompletedWithExceptions' | 'Closed' | 'Cancelled';
export type DiscrepancyStatus = 'Pending' | 'ResolvedApprove' | 'ResolvedReject';

export interface InboundReceiptLineDto {
  id: string;
  sku: string;
  expectedQuantity: number;
  receivedQuantity: number;
}

export interface InboundReceiptDto {
  id: string;
  receiptNo: string;
  orderId: string;
  status: InboundReceiptStatus;
  lines: InboundReceiptLineDto[];
}

export interface DiscrepancyDto {
  id: string;
  type: 'Over' | 'Short' | 'Damage';
  sku: string;
  expectedQty: number;
  actualQty: number;
  status: DiscrepancyStatus;
  notes?: string;
}

export interface PutawayTaskDto {
  id: string;
  sku: string;
  quantity: number;
  sourceBinId: string; 
  suggestedBinId: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
}
