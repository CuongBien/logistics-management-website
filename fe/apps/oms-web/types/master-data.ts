export interface ItemDto {
  id: string;
  sku: string;
  name: string;
  weight: number; // in kg
  length: number; // in cm
  width: number;  // in cm
  height: number; // in cm
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface PartnerDto {
  id: string;
  name: string;
  type: 'Consignor' | 'Supplier';
  phone: string;
  address: string;
  city: string;
  isActive: boolean;
  createdAt: string;
}
