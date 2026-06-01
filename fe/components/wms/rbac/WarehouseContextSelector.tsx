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
        const res = await fetchApi<any>('wms', '/Warehouse?all=true');
        let list: any[] = [];
        if (res) {
          if (res.isSuccess && Array.isArray(res.value)) {
            list = res.value;
          } else if (Array.isArray(res)) {
            list = res;
          }
        }
        
        setWarehouses(list);
        
        // If no active warehouse is set, set to the first one available
        if (!activeWarehouseId && list.length > 0) {
          const defaultId = localStorage.getItem('wms_active_warehouse_id') || list[0].id;
          setActiveWarehouseId(defaultId);
        }
      } catch (e) {
        console.error("Failed to load warehouses for selector from live API", e);
        setWarehouses([]);
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
