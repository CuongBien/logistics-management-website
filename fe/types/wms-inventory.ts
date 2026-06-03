export interface InventoryItemDto {
  id: string;
  tenantId: string;
  sku: string;
  binCode: string;
  quantityOnHand: number;
  availableQuantity: number; 
  lotNo?: string;
  expiryDate?: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
}

export type LedgerTransactionType = 'Receipt' | 'Putaway' | 'Pick' | 'Pack' | 'Ship' | 'Adjust' | 'Transfer' | 'CycleCount';

export interface InventoryLedgerDto {
  id: string;
  inventoryItemId: string;
  transactionType: LedgerTransactionType;
  deltaQty: number;
  balanceAfter: number;
  referenceId: string;
  occurredAt: string;
  operatorId: string;
}

export interface ReconcileRequest {
  tenantId: string;
  warehouseId: string;
  binCode: string;
  sku: string;
  actualQuantity: number;
  reason: string;
}
