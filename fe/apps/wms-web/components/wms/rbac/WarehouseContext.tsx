"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      const saved = localStorage.getItem(`wms_active_wh_${session.user.email}`);
      if (saved) {
        setActiveWarehouseIdState(saved);
      } else {
        setActiveWarehouseIdState(null);
      }
    }
  }, [session?.user?.email]);

  const setActiveWarehouseId = (id: string) => {
    setActiveWarehouseIdState(id);
    if (session?.user?.email) {
      localStorage.setItem(`wms_active_wh_${session.user.email}`, id);
    }
  };

  return (
    <WarehouseContext.Provider value={{ activeWarehouseId, setActiveWarehouseId }}>
      {children}
    </WarehouseContext.Provider>
  );
}
