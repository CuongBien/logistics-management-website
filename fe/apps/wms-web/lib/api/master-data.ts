import { ItemDto, PartnerDto } from "@/types/master-data";
import { fetchApi } from "@/lib/api-client";

// ============================================================================
// DUAL-MODE API STRATEGY (MOCK VS REAL DATABASE CONNECTION)
// ============================================================================
const USE_MOCK = false;

// Mocked item data aligned with WMS database seeds to prevent inventory mismatches
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getItems(searchTerm?: string): Promise<ItemDto[]> {
  try {
    const res = await fetchApi<any>('wms', '/inventory/skus');
    const items = res?.value || res?.items || res || [];
    
    const mapped = items.map((item: any) => {
      let name = item.name || '';
      let weight = 0.25;
      let length = 20;
      let width = 15;
      let height = 2;
      let category = "Thời Trang";

      if (name.includes('|')) {
        const parts = name.split('|');
        if (parts.length >= 6) {
          name = parts[0];
          weight = parseFloat(parts[1]) || 0.25;
          length = parseFloat(parts[2]) || 20;
          width = parseFloat(parts[3]) || 15;
          height = parseFloat(parts[4]) || 2;
          category = parts[5];
        }
      }

      return {
        id: item.id || `ITEM-${item.skuCode}`,
        sku: item.skuCode,
        name: name,
        weight: weight,
        length: length,
        width: width,
        height: height,
        category: category,
        isActive: item.status === 'active' || item.status === 'Active',
        createdAt: item.createdAt || new Date().toISOString()
      };
    });

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      return mapped.filter(
        (item: any) =>
          item.sku.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }
    return mapped;
  } catch (err) {
    console.error("Failed to load SKUs from backend:", err);
    return [];
  }
}

export async function getPartners(searchTerm?: string): Promise<PartnerDto[]> {
  const res = await fetchApi<any>('masterdata', `/Partners?searchTerm=${searchTerm || ''}&page=1&pageSize=100`);
  const items = res?.value?.items || res?.items || res || [];
  
  return items.map((p: any) => ({
    id: p.id,
    tenantId: p.tenantId || 'tenant-1',
    name: p.name,
    type: p.type === 1 || p.type === 'Supplier' ? 'Supplier' : 'Consignor',
    phone: p.phone || '',
    address: p.address || '',
    city: p.city || '',
    isActive: p.isActive !== false,
    createdAt: p.createdAt || new Date().toISOString()
  }));
}

export async function createItem(
  data: Omit<ItemDto, "id" | "createdAt" | "isActive">
): Promise<ItemDto> {
  const serializedName = `${data.name}|${data.weight}|${data.length}|${data.width}|${data.height}|${data.category}`;
  
  const payload = {
    skuCode: data.sku,
    name: serializedName,
    unitOfMeasure: 'PCS',
    status: 'active'
  };

  const res = await fetchApi<any>('wms', '/inventory/skus', {
    method: 'POST',
    body: payload
  });

  const skuId = res?.value || res?.id || `ITEM-${Date.now()}`;
  return {
    id: skuId,
    sku: data.sku,
    name: data.name,
    weight: data.weight,
    length: data.length,
    width: data.width,
    height: data.height,
    category: data.category,
    isActive: true,
    createdAt: new Date().toISOString()
  };
}

export async function updateItem(
  id: string,
  data: Partial<Omit<ItemDto, "id" | "createdAt">>
): Promise<ItemDto> {
  const serializedName = `${data.name}|${data.weight}|${data.length}|${data.width}|${data.height}|${data.category}`;
  
  const payload = {
    skuCode: data.sku,
    name: serializedName,
    unitOfMeasure: 'PCS',
    status: 'active'
  };

  await fetchApi<any>('wms', '/inventory/skus', {
    method: 'POST',
    body: payload
  });

  return {
    id,
    sku: data.sku || "SKU-UPDATE",
    name: data.name || "Product Name",
    weight: data.weight || 0.25,
    length: data.length || 20,
    width: data.width || 15,
    height: data.height || 2,
    category: data.category || "Thời Trang",
    isActive: true,
    createdAt: new Date().toISOString()
  };
}

export async function toggleActiveStatus(item: ItemDto, newActiveState: boolean): Promise<ItemDto> {
  const serializedName = `${item.name}|${item.weight}|${item.length}|${item.width}|${item.height}|${item.category}`;
  const statusVal = newActiveState ? 'active' : 'inactive';
  
  const payload = {
    skuCode: item.sku,
    name: serializedName,
    unitOfMeasure: 'PCS',
    status: statusVal
  };

  await fetchApi<any>('wms', '/inventory/skus', {
    method: 'POST',
    body: payload
  });

  return {
    ...item,
    isActive: newActiveState
  };
}

export async function togglePartnerStatus(id: string): Promise<PartnerDto> {
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

export async function deleteItem(skuCode: string): Promise<boolean> {
  const res = await fetchApi<any>('wms', `/inventory/skus/${skuCode}`, {
    method: 'DELETE'
  });
  return res?.isSuccess || res === true;
}
