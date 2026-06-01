import { InventoryItemDto, InventoryLedgerDto, LedgerTransactionType } from '@/types/wms-inventory';
import { fetchApi } from '@/lib/api-client';

// ============================================================================
// DUAL-MODE API STRATEGY (MOCK VS REAL DATABASE CONNECTION)
// ============================================================================
const USE_MOCK = false;

// Mocked local database for Inventory Items (matches WMS database seed items to prevent mismatches)
let mockInventoryDb: InventoryItemDto[] = [
  {
    id: "inv-1",
    tenantId: "default-tenant",
    sku: "A0-001",
    binCode: "ST-A-01",
    quantityOnHand: 150,
    availableQuantity: 120,
    lotNo: "LOT-2026-A",
    expiryDate: "2028-12-31T23:59:59Z",
  },
  {
    id: "inv-2",
    tenantId: "default-tenant",
    sku: "A0-002",
    binCode: "ST-A-02",
    quantityOnHand: 45,
    availableQuantity: 45,
    lotNo: "LOT-2026-B",
    expiryDate: "2029-06-30T23:59:59Z",
  },
  {
    id: "inv-3",
    tenantId: "default-tenant",
    sku: "A0-003",
    binCode: "ST-B-01",
    quantityOnHand: 80,
    availableQuantity: 60,
    lotNo: "LOT-2026-C",
    expiryDate: "2028-09-15T23:59:59Z",
  },
  {
    id: "inv-4",
    tenantId: "default-tenant",
    sku: "SKU-RED-TSHIRT",
    binCode: "ST-B-02",
    quantityOnHand: 300,
    availableQuantity: 300,
    lotNo: "LOT-2026-D",
    expiryDate: "2027-11-20T23:59:59Z",
  },
  {
    id: "inv-5",
    tenantId: "default-tenant",
    sku: "SKU-BLUE-JEANS",
    binCode: "CD-B-01",
    quantityOnHand: 120,
    availableQuantity: 120,
    lotNo: "LOT-2026-E",
    expiryDate: "2029-01-01T23:59:59Z",
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
    }
  ]
};

// API Services
export const getInventoryList = async (): Promise<InventoryItemDto[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockInventoryDb];
  }

  try {
    const res = await fetchApi<InventoryItemDto[]>('wms', '/inventory');
    if (!res || res.length === 0) {
      console.warn("Inventory list is empty in DB, falling back to mock database!");
      return [...mockInventoryDb];
    }
    return res;
  } catch (err) {
    console.error("Error fetching inventory from WMS backend:", err);
    return [...mockInventoryDb];
  }
};

export const getInventoryItem = async (id: string): Promise<InventoryItemDto | undefined> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockInventoryDb.find(item => item.id === id);
  }

  try {
    return await fetchApi<InventoryItemDto>('wms', `/inventory/${id}`);
  } catch (err) {
    console.error(`Error fetching inventory item ${id} from WMS backend:`, err);
    return mockInventoryDb.find(item => item.id === id);
  }
};

export const getItemLedgers = async (id: string): Promise<InventoryLedgerDto[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockLedgersDb[id] || [];
  }

  try {
    const res = await fetchApi<any>("wms", `/inventory/${id}/ledger`);
    const list = res?.value || res?.items || res || [];
    
    if ((!list || list.length === 0) && mockLedgersDb[id]) {
      return mockLedgersDb[id];
    }

    return list.map((l: any) => ({
      id: l.id,
      inventoryItemId: l.inventoryItemId || id,
      transactionType: l.transactionType || 'Adjust',
      deltaQty: l.deltaQty || 0,
      balanceAfter: l.balanceAfter || 0,
      referenceId: l.referenceId || '',
      occurredAt: l.occurredAt || new Date().toISOString(),
      operatorId: l.operatorId || 'system'
    }));
  } catch (err) {
    console.error("Error fetching ledgers from WMS backend:", err);
    return mockLedgersDb[id] || [];
  }
};

export const transferStock = async (data: { inventoryItemId: string; destBin: string; qty: number }) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const item = mockInventoryDb.find(i => i.id === data.inventoryItemId);
    if (!item) throw new Error("Inventory item not found");
    if (item.availableQuantity < data.qty) throw new Error("Không đủ số lượng khả dụng để điều chuyển");
    item.quantityOnHand -= data.qty;
    item.availableQuantity -= data.qty;
    return { success: true };
  }

  // WMS expects { inventoryItemId, destBin, qty } in latest main branch code
  await fetchApi("wms", "/inventory/transfer", {
    method: "POST",
    body: {
      inventoryItemId: data.inventoryItemId,
      destBin: data.destBin,
      qty: data.qty
    }
  });
  return { success: true };
};

export const reconcileStock = async (data: { inventoryItemId: string; actualQuantity: number; reason: string }) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const item = mockInventoryDb.find(i => i.id === data.inventoryItemId);
    if (!item) throw new Error("Inventory item not found");
    item.quantityOnHand = data.actualQuantity;
    return { success: true };
  }

  await fetchApi("wms", "/inventory/reconcile", {
    method: "POST",
    body: {
      inventoryItemId: data.inventoryItemId,
      actualQuantity: data.actualQuantity,
      reason: data.reason
    }
  });
  return { success: true };
};

export const reserveStock = async (id: string, qty: number) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const item = mockInventoryDb.find(i => i.id === id);
    if (!item) throw new Error("Inventory item not found");
    item.availableQuantity -= qty;
    return { success: true };
  }

  await fetchApi("wms", "/inventory/reserve", {
    method: "POST",
    body: {
      inventoryItemId: id,
      quantity: qty
    }
  });
  return { success: true };
};

export const releaseStock = async (id: string, qty: number) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const item = mockInventoryDb.find(i => i.id === id);
    if (!item) throw new Error("Inventory item not found");
    item.availableQuantity += qty;
    return { success: true };
  }

  await fetchApi("wms", "/inventory/release", {
    method: "POST",
    body: {
      inventoryItemId: id,
      quantity: qty
    }
  });
  return { success: true };
};

export const consumeStock = async (id: string, qty: number) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const item = mockInventoryDb.find(i => i.id === id);
    if (!item) throw new Error("Inventory item not found");
    item.quantityOnHand -= qty;
    return { success: true };
  }

  await fetchApi("wms", "/inventory/consume", {
    method: "POST",
    body: {
      inventoryItemId: id,
      quantity: qty
    }
  });
  return { success: true };
};
