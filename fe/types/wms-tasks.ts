export type TaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';

export interface PutawayTaskDto {
  id: string;
  sku: string;
  quantity: number;
  sourceBinId: string;
  suggestedBinId: string;
  status: TaskStatus;
}

export interface ReplenishmentTaskDto {
  id: string;
  sku: string;
  quantity: number;
  fromBinId: string; // Kệ lưu trữ
  toBinId: string;   // Kệ lấy hàng (Pick Face)
  status: TaskStatus;
}

export interface CycleCountTaskDto {
  id: string;
  binId: string;
  sku: string;
  expectedQty: number; // Có thể ẩn đối với nhân viên đếm (Blind Count)
  countedQty?: number;
  status: 'Pending' | 'Counted' | 'Approved' | 'Rejected';
  operatorId?: string;
}
