export type TaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';

export interface PutawayTaskDto {
  id: string;
  sku: string;
  quantity: number;
  sourceBinCode: string;
  suggestedBinCode: string;
  status: TaskStatus;
  operatorName?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ReplenishmentTaskDto {
  id: string;
  sku: string;
  quantity: number;
  fromBinCode: string;
  toBinCode: string;
  status: TaskStatus;
  operatorName?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CycleCountTaskDto {
  id: string;
  binCode: string;
  sku: string;
  expectedQty: number;
  countedQty?: number;
  status: 'Pending' | 'Counted' | 'Approved' | 'Rejected';
  operatorName?: string;
  completedAt?: string;
  notes?: string;
  supervisorNotes?: string;
}
