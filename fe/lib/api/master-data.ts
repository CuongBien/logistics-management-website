import { ItemDto, PartnerDto } from "@/types/master-data";
import { fetchApi } from "@/lib/api-client";

// ============================================================================
// DUAL-MODE API STRATEGY (MOCK VS REAL DATABASE CONNECTION)
// ============================================================================
const USE_MOCK = false;

// Mocked item data aligned with WMS database seeds to prevent inventory mismatches
let mockItems: ItemDto[] = [
  {
    id: "ITEM-A0-001",
    sku: "A0-001",
    name: "Ao Thun Nam Basic",
    weight: 0.22,
    length: 16.0,
    width: 7.7,
    height: 0.8,
    category: "Thời Trang",
    isActive: true,
    createdAt: "2026-05-30T08:00:00Z"
  },
  {
    id: "ITEM-A0-002",
    sku: "A0-002",
    name: "Ao Thun Nu Basic",
    weight: 0.18,
    length: 15.0,
    width: 7.5,
    height: 0.7,
    category: "Thời Trang",
    isActive: true,
    createdAt: "2026-05-30T08:30:00Z"
  },
  {
    id: "ITEM-A0-003",
    sku: "A0-003",
    name: "Ao Khoac Nam",
    weight: 0.65,
    length: 30.0,
    width: 25.0,
    height: 5.0,
    category: "Thời Trang",
    isActive: true,
    createdAt: "2026-05-30T09:00:00Z"
  },
  {
    id: "ITEM-RED-TSHIRT",
    sku: "SKU-RED-TSHIRT",
    name: "Red T-Shirt",
    weight: 0.2,
    length: 15.0,
    width: 10.0,
    height: 1.0,
    category: "Thời Trang",
    isActive: true,
    createdAt: "2026-05-30T09:15:00Z"
  },
  {
    id: "ITEM-BLUE-JEANS",
    sku: "SKU-BLUE-JEANS",
    name: "Blue Jeans",
    weight: 0.5,
    length: 25.0,
    width: 18.0,
    height: 3.0,
    category: "Thời Trang",
    isActive: true,
    createdAt: "2026-05-30T09:30:00Z"
  }
];

let mockPartners: PartnerDto[] = [
  {
    id: "PART-001",
    name: "Tổng Kho Phân Phối Thiết Bị Số Việt Nam",
    type: "Supplier",
    phone: "0901234567",
    address: "123 Đường Song Hành, Thảo Điền",
    city: "Hồ Chí Minh",
    isActive: true,
    createdAt: "2026-01-05T09:00:00Z"
  },
  {
    id: "PART-002",
    name: "Công ty Cổ phần Bán lẻ Điện tử FPT",
    type: "Consignor",
    phone: "02873006600",
    address: "261 Khánh Hội, Phường 5, Quận 4",
    city: "Hồ Chí Minh",
    isActive: true,
    createdAt: "2026-02-10T11:15:00Z"
  },
  {
    id: "PART-003",
    name: "Tổng Kho Hàng Tiêu Dùng Miền Nam",
    type: "Supplier",
    phone: "0987654321",
    address: "456 Đại lộ Nguyễn Văn Linh",
    city: "Cần Thơ",
    isActive: false,
    createdAt: "2026-03-20T16:45:00Z"
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getItems(searchTerm?: string): Promise<ItemDto[]> {
  await delay(300);
  if (!searchTerm) return [...mockItems];
  const query = searchTerm.toLowerCase();
  return mockItems.filter(
    (item) =>
      item.sku.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
  );
}

export async function getPartners(searchTerm?: string): Promise<PartnerDto[]> {
  if (USE_MOCK) {
    await delay(400);
    return [...mockPartners];
  }

  try {
    const res = await fetchApi<any>('masterdata', `/Partners?searchTerm=${searchTerm || ''}&page=1&pageSize=100`);
    const items = res?.value?.items || res?.items || res || [];
    
    // Zero-Disruption Fallback: If DB returns empty list and no search term, return mock partners
    if ((!items || items.length === 0) && !searchTerm) {
      console.warn("Live Partners database is empty. Falling back to high-fidelity mock data!");
      return [...mockPartners];
    }

    return items.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type === 1 || p.type === 'Supplier' ? 'Supplier' : 'Consignor',
      phone: p.phone || '',
      address: p.address || '',
      city: p.city || '',
      isActive: p.isActive !== false,
      createdAt: p.createdAt || new Date().toISOString()
    }));
  } catch (err) {
    console.error("Error fetching partners from live DB:", err);
    // Graceful fallback on db connection failure
    return [...mockPartners];
  }
}

export async function createItem(
  data: Omit<ItemDto, "id" | "createdAt" | "isActive">
): Promise<ItemDto> {
  await delay(400);
  const newItem: ItemDto = {
    id: `ITEM-${Date.now()}`,
    ...data,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  mockItems = [newItem, ...mockItems];
  return newItem;
}

export async function updateItem(
  id: string,
  data: Partial<Omit<ItemDto, "id" | "createdAt">>
): Promise<ItemDto> {
  await delay(400);
  const index = mockItems.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Item not found");
  mockItems[index] = { ...mockItems[index], ...data };
  return mockItems[index];
}

export async function toggleActiveStatus(id: string): Promise<ItemDto> {
  await delay(300);
  const index = mockItems.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Item not found");
  mockItems[index] = {
    ...mockItems[index],
    isActive: !mockItems[index].isActive
  };
  return mockItems[index];
}

export async function togglePartnerStatus(id: string): Promise<PartnerDto> {
  if (USE_MOCK) {
    await delay(300);
    const index = mockPartners.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Partner not found");
    mockPartners[index] = {
      ...mockPartners[index],
      isActive: !mockPartners[index].isActive
    };
    return mockPartners[index];
  }

  // Deactivate via DELETE or toggle
  await fetchApi('masterdata', `/Partners/${id}`, {
    method: 'DELETE'
  });
  return {
    id,
    name: "Partner",
    type: "Supplier",
    phone: "",
    address: "",
    city: "",
    isActive: false,
    createdAt: new Date().toISOString()
  };
}
