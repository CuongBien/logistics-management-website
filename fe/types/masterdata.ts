export interface PartnerDto {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
}

export interface PartnerFormValues {
  name: string;
  phone: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}
