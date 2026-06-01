'use client';

import { useState, useEffect } from 'react';
import { useWarehouseContext } from './WarehouseContext';
import { fetchApi } from '@/lib/api-client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function WarehouseContextSelector() {
  const { activeWarehouseId, setActiveWarehouseId } = useWarehouseContext();
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const res = await fetchApi<any>('wms', '/Warehouse');
        let list: any[] = [];
        if (res) {
          if (res.isSuccess && Array.isArray(res.value)) {
            list = res.value;
          } else if (Array.isArray(res)) {
            list = res;
          }
        }
        
        if (!list || list.length === 0) {
          console.warn("Warehouse list is empty for selector, using fallback mock!");
          list = [
            { id: "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1", name: "HCM Mega Hub (WH-SG-002)" },
            { id: "e5e5e5e5-e5e5-e5e5-e5e5-e5e5-e5e5", name: "Hanoi Mega Hub (WH-HN-006)" },
            { id: "c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3", name: "Da Nang Sorting Center (WH-DN-004)" },
            { id: "b61a8f61-5238-4a18-809c-335cc293a025", name: "Can Tho Delivery Hub (WH-CT-001)" }
          ];
        }
        
        setWarehouses(list);
        
        // If no active warehouse is set, set to the first one available
        if (!activeWarehouseId && list.length > 0) {
          const defaultId = localStorage.getItem('wms_active_warehouse_id') || list[0].id;
          setActiveWarehouseId(defaultId);
        }
      } catch (e) {
        console.error("Failed to load warehouses for selector, using fallback mock!", e);
        const fallbackList = [
          { id: "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1", name: "HCM Mega Hub (WH-SG-002)" },
          { id: "e5e5e5e5-e5e5-e5e5-e5e5-e5e5-e5e5", name: "Hanoi Mega Hub (WH-HN-006)" },
          { id: "c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3", name: "Da Nang Sorting Center (WH-DN-004)" },
          { id: "b61a8f61-5238-4a18-809c-335cc293a025", name: "Can Tho Delivery Hub (WH-CT-001)" }
        ];
        setWarehouses(fallbackList);
        if (!activeWarehouseId) {
          const defaultId = localStorage.getItem('wms_active_warehouse_id') || fallbackList[0].id;
          setActiveWarehouseId(defaultId);
        }
      }
    };
    loadWarehouses();
  }, [activeWarehouseId, setActiveWarehouseId]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline-block">Đang làm việc tại:</span>
      <Select value={activeWarehouseId || ''} onValueChange={setActiveWarehouseId}>
        <SelectTrigger className="w-[180px] h-8 bg-background">
          <SelectValue placeholder="Chọn kho..." />
        </SelectTrigger>
        <SelectContent>
          {warehouses.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
