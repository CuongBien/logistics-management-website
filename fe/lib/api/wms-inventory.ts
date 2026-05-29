import { InventoryItemDto, InventoryLedgerDto, LedgerTransactionType, ReconcileRequest } from '@/types/wms-inventory';

// Mocked local database for Inventory Items
let mockInventoryDb: InventoryItemDto[] = [
  {
    id: 'inv-1',
    tenantId: 'tenant-shopee',
    sku: 'IPHONE15-PRO-256',
    binCode: 'ST-A-01',
    quantityOnHand: 150,
    availableQuantity: 120, // 30 reserved
    lotNo: 'LOT-2026-A',
    expiryDate: '2028-12-31T23:59:59Z',
  },
  {
    id: 'inv-2',
    tenantId: 'tenant-shopee',
    sku: 'MACBOOK-M3-16GB',
    binCode: 'ST-A-02',
    quantityOnHand: 45,
    availableQuantity: 45, // 0 reserved
    lotNo: 'LOT-2026-B',
    expiryDate: '2029-06-30T23:59:59Z',
  },
  {
    id: 'inv-3',
    tenantId: 'tenant-lazada',
    sku: 'SAM-S24-ULTRA',
    binCode: 'ST-B-01',
    quantityOnHand: 80,
    availableQuantity: 60, // 20 reserved
    lotNo: 'LOT-2026-C',
    expiryDate: '2028-09-15T23:59:59Z',
  },
  {
    id: 'inv-4',
    tenantId: 'tenant-tiktok',
    sku: 'AIRPODS-PRO-2',
    binCode: 'ST-B-02',
    quantityOnHand: 300,
    availableQuantity: 300, // 0 reserved
    lotNo: 'LOT-2026-D',
    expiryDate: '2027-11-20T23:59:59Z',
  },
  {
    id: 'inv-5',
    tenantId: 'tenant-shopee',
    sku: 'SONY-WH1000XM5',
    binCode: 'IN-A-01',
    quantityOnHand: 0,
    availableQuantity: 0, // Out of stock
    lotNo: 'LOT-2026-E',
    expiryDate: '2028-01-10T23:59:59Z',
  },
  {
    id: 'inv-6',
    tenantId: 'tenant-lazada',
    sku: 'NINTENDO-SWITCH-OLED',
    binCode: 'IN-A-02',
    quantityOnHand: 15,
    availableQuantity: 5, // 10 reserved
    lotNo: 'LOT-2026-F',
    expiryDate: '2027-08-05T23:59:59Z',
  },
  {
    id: 'inv-7',
    tenantId: 'tenant-tiktok',
    sku: 'LOGITECH-MX-KEYS',
    binCode: 'CD-B-01',
    quantityOnHand: 120,
    availableQuantity: 120, // 0 reserved
    lotNo: 'LOT-2026-G',
    expiryDate: '2029-01-01T23:59:59Z',
  }
];

// Mocked local database for Ledger Entries
let mockLedgersDb: Record<string, InventoryLedgerDto[]> = {
  'inv-1': [
    {
      id: 'led-101',
      inventoryItemId: 'inv-1',
      transactionType: 'Receipt',
      deltaQty: 100,
      balanceAfter: 100,
      referenceId: 'RCV-000102',
      occurredAt: '2026-05-10T08:00:00Z',
      operatorId: 'user-admin'
    },
    {
      id: 'led-102',
      inventoryItemId: 'inv-1',
      transactionType: 'Putaway',
      deltaQty: 50,
      balanceAfter: 150,
      referenceId: 'PUT-000551',
      occurredAt: '2026-05-11T10:30:00Z',
      operatorId: 'user-operator1'
    },
    {
      id: 'led-103',
      inventoryItemId: 'inv-1',
      transactionType: 'Pick',
      deltaQty: -10,
      balanceAfter: 140,
      referenceId: 'ORD-000987',
      occurredAt: '2026-05-15T14:20:00Z',
      operatorId: 'user-operator2'
    },
    {
      id: 'led-104',
      inventoryItemId: 'inv-1',
      transactionType: 'Adjust',
      deltaQty: 10,
      balanceAfter: 150,
      referenceId: 'ADJ-000003',
      occurredAt: '2026-05-20T16:00:00Z',
      operatorId: 'user-admin'
    }
  ],
  'inv-2': [
    {
      id: 'led-201',
      inventoryItemId: 'inv-2',
      transactionType: 'Receipt',
      deltaQty: 45,
      balanceAfter: 45,
      referenceId: 'RCV-000103',
      occurredAt: '2026-05-12T09:15:00Z',
      operatorId: 'user-admin'
    }
  ],
  'inv-3': [
    {
      id: 'led-301',
      inventoryItemId: 'inv-3',
      transactionType: 'Receipt',
      deltaQty: 100,
      balanceAfter: 100,
      referenceId: 'RCV-000104',
      occurredAt: '2026-05-13T11:00:00Z',
      operatorId: 'user-admin'
    },
    {
      id: 'led-302',
      inventoryItemId: 'inv-3',
      transactionType: 'Pick',
      deltaQty: -20,
      balanceAfter: 80,
      referenceId: 'ORD-000990',
      occurredAt: '2026-05-18T15:30:00Z',
      operatorId: 'user-operator1'
    }
  ],
  'inv-4': [
    {
      id: 'led-401',
      inventoryItemId: 'inv-4',
      transactionType: 'Receipt',
      deltaQty: 300,
      balanceAfter: 300,
      referenceId: 'RCV-000105',
      occurredAt: '2026-05-14T14:45:00Z',
      operatorId: 'user-admin'
    }
  ]
};

// API Services
export const getInventoryList = async (): Promise<InventoryItemDto[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockInventoryDb];
};

export const getInventoryItem = async (id: string): Promise<InventoryItemDto | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockInventoryDb.find(item => item.id === id);
};

export const getItemLedgers = async (id: string): Promise<InventoryLedgerDto[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockLedgersDb[id] || [];
};

export const transferStock = async (data: { inventoryItemId: string; destBin: string; qty: number }) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const item = mockInventoryDb.find(i => i.id === data.inventoryItemId);
  if (!item) throw new Error("Inventory item not found");
  if (item.availableQuantity < data.qty) throw new Error("Không đủ số lượng khả dụng để điều chuyển");

  // Deduct from current item
  const originalBin = item.binCode;
  item.quantityOnHand -= data.qty;
  item.availableQuantity -= data.qty;

  // Add ledger entry for original item
  if (!mockLedgersDb[item.id]) mockLedgersDb[item.id] = [];
  mockLedgersDb[item.id].push({
    id: `led-${Date.now()}`,
    inventoryItemId: item.id,
    transactionType: 'Transfer',
    deltaQty: -data.qty,
    balanceAfter: item.quantityOnHand,
    referenceId: `TRF-${originalBin}→${data.destBin}`,
    occurredAt: new Date().toISOString(),
    operatorId: 'user-admin'
  });

  // Check if a similar item exists in destination bin (same SKU, Lot)
  let destItem = mockInventoryDb.find(i => i.sku === item.sku && i.binCode === data.destBin && i.lotNo === item.lotNo);
  
  if (destItem) {
    destItem.quantityOnHand += data.qty;
    destItem.availableQuantity += data.qty;
  } else {
    // Create new item in destination bin
    destItem = {
      id: `inv-${Date.now()}`,
      tenantId: item.tenantId,
      sku: item.sku,
      binCode: data.destBin,
      quantityOnHand: data.qty,
      availableQuantity: data.qty,
      lotNo: item.lotNo,
      expiryDate: item.expiryDate
    };
    mockInventoryDb.push(destItem);
  }

  // Add ledger entry for destination item
  if (!mockLedgersDb[destItem.id]) mockLedgersDb[destItem.id] = [];
  mockLedgersDb[destItem.id].push({
    id: `led-${Date.now() + 1}`,
    inventoryItemId: destItem.id,
    transactionType: 'Transfer',
    deltaQty: data.qty,
    balanceAfter: destItem.quantityOnHand,
    referenceId: `TRF-${originalBin}→${data.destBin}`,
    occurredAt: new Date().toISOString(),
    operatorId: 'user-admin'
  });

  return { success: true };
};

export const reconcileStock = async (data: { inventoryItemId: string; actualQuantity: number; reason: string }) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const item = mockInventoryDb.find(i => i.id === data.inventoryItemId);
  if (!item) throw new Error("Inventory item not found");

  const diff = data.actualQuantity - item.quantityOnHand;
  const oldReserved = item.quantityOnHand - item.availableQuantity;

  item.quantityOnHand = data.actualQuantity;
  item.availableQuantity = Math.max(0, data.actualQuantity - oldReserved);

  // Add ledger entry
  if (!mockLedgersDb[item.id]) mockLedgersDb[item.id] = [];
  mockLedgersDb[item.id].push({
    id: `led-${Date.now()}`,
    inventoryItemId: item.id,
    transactionType: 'CycleCount',
    deltaQty: diff,
    balanceAfter: item.quantityOnHand,
    referenceId: `REC-${data.reason}`,
    occurredAt: new Date().toISOString(),
    operatorId: 'user-admin'
  });

  return { success: true };
};

export const reserveStock = async (id: string, qty: number) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const item = mockInventoryDb.find(i => i.id === id);
  if (!item) throw new Error("Inventory item not found");
  if (item.availableQuantity < qty) throw new Error("Số lượng khả dụng không đủ để bảo lưu");

  item.availableQuantity -= qty;

  // Add ledger entry for reservation
  if (!mockLedgersDb[item.id]) mockLedgersDb[item.id] = [];
  mockLedgersDb[item.id].push({
    id: `led-${Date.now()}`,
    inventoryItemId: item.id,
    transactionType: 'Adjust',
    deltaQty: 0, // No change in physical stock
    balanceAfter: item.quantityOnHand,
    referenceId: `RES-${qty}-giu`,
    occurredAt: new Date().toISOString(),
    operatorId: 'user-admin'
  });

  return { success: true };
};

export const releaseStock = async (id: string, qty: number) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const item = mockInventoryDb.find(i => i.id === id);
  if (!item) throw new Error("Inventory item not found");
  
  const currentReserved = item.quantityOnHand - item.availableQuantity;
  if (qty > currentReserved) throw new Error("Số lượng giải phóng lớn hơn số lượng đang bảo lưu");

  item.availableQuantity += qty;

  // Add ledger entry for release
  if (!mockLedgersDb[item.id]) mockLedgersDb[item.id] = [];
  mockLedgersDb[item.id].push({
    id: `led-${Date.now()}`,
    inventoryItemId: item.id,
    transactionType: 'Adjust',
    deltaQty: 0,
    balanceAfter: item.quantityOnHand,
    referenceId: `REL-${qty}-nha`,
    occurredAt: new Date().toISOString(),
    operatorId: 'user-admin'
  });

  return { success: true };
};

export const consumeStock = async (id: string, qty: number) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const item = mockInventoryDb.find(i => i.id === id);
  if (!item) throw new Error("Inventory item not found");
  
  const currentReserved = item.quantityOnHand - item.availableQuantity;
  if (qty > currentReserved) throw new Error("Số lượng xuất kho lớn hơn số lượng đang bảo lưu");

  item.quantityOnHand -= qty;

  // Add ledger entry for consumption
  if (!mockLedgersDb[item.id]) mockLedgersDb[item.id] = [];
  mockLedgersDb[item.id].push({
    id: `led-${Date.now()}`,
    inventoryItemId: item.id,
    transactionType: 'Ship',
    deltaQty: -qty,
    balanceAfter: item.quantityOnHand,
    referenceId: `CON-${qty}-xuat`,
    occurredAt: new Date().toISOString(),
    operatorId: 'user-admin'
  });

  return { success: true };
};
