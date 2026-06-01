import React, { createContext, useContext, useState, useEffect } from 'react';

interface WarehouseContextType {
  activeWarehouseId: string | null;
  setActiveWarehouseId: (id: string) => void;
}

const WarehouseContext = createContext<WarehouseContextType>({
  activeWarehouseId: null,
  setActiveWarehouseId: () => {},
});

export const useWarehouseContext = () => useContext(WarehouseContext);

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [activeWarehouseId, setActiveWarehouseIdState] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('wms_active_warehouse_id');
    if (saved) {
      setActiveWarehouseIdState(saved);
    }
  }, []);

  const setActiveWarehouseId = (id: string) => {
    setActiveWarehouseIdState(id);
    localStorage.setItem('wms_active_warehouse_id', id);
  };

  return (
    <WarehouseContext.Provider value={{ activeWarehouseId, setActiveWarehouseId }}>
      {children}
    </WarehouseContext.Provider>
  );
}
