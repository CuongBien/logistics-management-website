import { ItemDto, PartnerDto } from "@/types/master-data";

// In-memory mock database to persist changes during the current session
let mockItems: ItemDto[] = [
  {
    id: "ITEM-001",
    sku: "IPHONE15PM",
    name: "Điện thoại iPhone 15 Pro Max 256GB - Titan Tự Nhiên",
    weight: 0.221,
    length: 16.0,
    width: 7.7,
    height: 0.8,
    category: "Điện Tử",
    isActive: true,
    createdAt: "2026-01-10T08:00:00Z"
  },
  {
    id: "ITEM-002",
    sku: "BIMTA-HUG-M",
    name: "Bỉm tã quần Huggies Platinum Nature Made Size M 58 miếng",
    weight: 1.5,
    length: 40.0,
    width: 30.0,
    height: 20.0,
    category: "Mẹ & Bé",
    isActive: true,
    createdAt: "2026-02-15T10:30:00Z"
  },
  {
    id: "ITEM-003",
    sku: "DAUAN-SIMPLY-1L",
    name: "Dầu ăn nguyên chất Simply chai 1 Lít",
    weight: 0.95,
    length: 25.0,
    width: 10.0,
    height: 10.0,
    category: "Hàng Tiêu Dùng",
    isActive: false, // Inactive to show both active/inactive
    createdAt: "2026-03-05T14:20:00Z"
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
  await delay(500);
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
  await delay(500);
  if (!searchTerm) return [...mockPartners];
  const query = searchTerm.toLowerCase();
  return mockPartners.filter(
    (partner) =>
      partner.name.toLowerCase().includes(query) ||
      partner.phone.includes(query) ||
      partner.city.toLowerCase().includes(query)
  );
}

export async function createItem(
  data: Omit<ItemDto, "id" | "createdAt" | "isActive">
): Promise<ItemDto> {
  await delay(500);
  const newItem: ItemDto = {
    id: `ITEM-00${mockItems.length + 1}`,
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
  await delay(500);
  const index = mockItems.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Item not found");
  mockItems[index] = { ...mockItems[index], ...data };
  return mockItems[index];
}

export async function toggleActiveStatus(id: string): Promise<ItemDto> {
  await delay(500);
  const index = mockItems.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Item not found");
  mockItems[index] = {
    ...mockItems[index],
    isActive: !mockItems[index].isActive
  };
  return mockItems[index];
}

export async function togglePartnerStatus(id: string): Promise<PartnerDto> {
  await delay(500);
  const index = mockPartners.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Partner not found");
  mockPartners[index] = {
    ...mockPartners[index],
    isActive: !mockPartners[index].isActive
  };
  return mockPartners[index];
}
