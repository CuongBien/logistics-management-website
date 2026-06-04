export type CrossDockTaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Failed';

export interface CrossDockTaskDto {
  id: string;
  tenantId: string;
  inboundReceiptId: string;
  outboundOrderId: string;
  sku: string;
  quantity: number;
  
  inboundStagingBinId: string; 
  inboundStagingBinCode: string;

  outboundStagingBinId: string;
  outboundStagingBinCode: string;

  status: CrossDockTaskStatus;
  operatorId?: string;
  completedAt?: string;
}

export interface CompleteCrossDockTaskRequest {
  scannedDestinationBinCode: string;
}
