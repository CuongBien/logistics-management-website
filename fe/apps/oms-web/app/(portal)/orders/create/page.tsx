'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fetchApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import {
  UserCircle,
  MapPin,
  Package,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';

import type { CreateOrderFormValues, ProductType } from '@/types/oms';
import { OrderStepper } from '@/components/portal/order-stepper';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Textarea } from '@repo/ui/components/textarea';
import { Separator } from '@repo/ui/components/separator';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@repo/ui/components/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';

// ──────────────────────────────────────────────
// Stepper steps
// ──────────────────────────────────────────────

const steps = [
  { title: 'Người gửi', description: 'Thông tin người gửi hàng', icon: UserCircle },
  { title: 'Người nhận', description: 'Thông tin người nhận hàng', icon: MapPin },
  { title: 'Hàng hóa', description: 'Thông tin kiện hàng', icon: Package },
  { title: 'Xác nhận', description: 'Kiểm tra và tạo đơn', icon: CheckCircle },
];

// ──────────────────────────────────────────────
// Address data
// ──────────────────────────────────────────────

const provinces = [
  { code: 'HCM', name: 'Hồ Chí Minh' },
  { code: 'HN', name: 'Hà Nội' },
  { code: 'DN', name: 'Đà Nẵng' },
  { code: 'CT', name: 'Cần Thơ' },
  { code: 'HP', name: 'Hải Phòng' },
];

const districts: Record<string, { code: string; name: string }[]> = {
  HCM: [
    { code: 'Q1', name: 'Quận 1' },
    { code: 'Q3', name: 'Quận 3' },
    { code: 'QBT', name: 'Quận Bình Thạnh' },
    { code: 'QGV', name: 'Quận Gò Vấp' },
    { code: 'QTD', name: 'Thủ Đức' },
  ],
  HN: [
    { code: 'HK', name: 'Hoàn Kiếm' },
    { code: 'BD', name: 'Ba Đình' },
    { code: 'CG', name: 'Cầu Giấy' },
    { code: 'TX', name: 'Thanh Xuân' },
  ],
  DN: [
    { code: 'HC', name: 'Hải Châu' },
    { code: 'TK', name: 'Thanh Khê' },
    { code: 'ST', name: 'Sơn Trà' },
  ],
  CT: [
    { code: 'NK', name: 'Ninh Kiều' },
    { code: 'BT', name: 'Bình Thủy' },
  ],
  HP: [
    { code: 'HB', name: 'Hồng Bàng' },
    { code: 'LC', name: 'Lê Chân' },
  ],
};

const wards: Record<string, { code: string; name: string }[]> = {
  Q1: [
    { code: 'BN', name: 'Phường Bến Nghé' },
    { code: 'BT', name: 'Phường Bến Thành' },
    { code: 'PNL', name: 'Phường Nguyễn Thái Bình' },
  ],
  Q3: [
    { code: 'P1', name: 'Phường 1' },
    { code: 'P2', name: 'Phường 2' },
  ],
  QBT: [
    { code: 'P1BT', name: 'Phường 1' },
    { code: 'P2BT', name: 'Phường 2' },
  ],
  QGV: [
    { code: 'P3GV', name: 'Phường 3' },
    { code: 'P5GV', name: 'Phường 5' },
  ],
  QTD: [
    { code: 'LV', name: 'Phường Linh Vực' },
    { code: 'HPC', name: 'Phường Hiệp Phú' },
  ],
  HK: [
    { code: 'HG', name: 'Phường Hàng Gai' },
    { code: 'HBT', name: 'Phường Hàng Bạc' },
  ],
  BD: [
    { code: 'TP', name: 'Phường Trúc Bạch' },
    { code: 'LG', name: 'Phường Liễu Giai' },
  ],
  CG: [
    { code: 'DM', name: 'Phường Dịch Vọng' },
    { code: 'MY', name: 'Phường Mai Dịch' },
  ],
  TX: [
    { code: 'TXP', name: 'Phường Thanh Xuân Bắc' },
    { code: 'NS', name: 'Phường Nhân Chính' },
  ],
  HC: [
    { code: 'TN', name: 'Phường Thạch Thang' },
    { code: 'HH', name: 'Phường Hải Châu 1' },
  ],
  TK: [
    { code: 'TAP', name: 'Phường Tam Thuận' },
    { code: 'TAN', name: 'Phường Tân Chính' },
  ],
  ST: [
    { code: 'MAN', name: 'Phường Mân Thái' },
    { code: 'AHP', name: 'Phường An Hải Bắc' },
  ],
  NK: [
    { code: 'XK', name: 'Phường Xuân Khánh' },
    { code: 'AK', name: 'Phường An Khánh' },
  ],
  BT: [
    { code: 'BTH', name: 'Phường Bình Thủy' },
    { code: 'TL', name: 'Phường Trà An' },
  ],
  HB: [
    { code: 'QLO', name: 'Phường Quán Toan' },
    { code: 'HGP', name: 'Phường Hoàng Văn Thụ' },
  ],
  LC: [
    { code: 'ANB', name: 'Phường An Biên' },
    { code: 'DK', name: 'Phường Đông Khê' },
  ],
};

// ──────────────────────────────────────────────
// Product type labels
// ──────────────────────────────────────────────

const productTypeLabels: Record<ProductType, string> = {
  Document: 'Tài liệu',
  Fragile: 'Dễ vỡ',
  Electronic: 'Điện tử',
  Food: 'Thực phẩm',
  Clothing: 'Quần áo',
  Other: 'Khác',
};

// ──────────────────────────────────────────────
// Zod schema
// ──────────────────────────────────────────────

const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

const formSchema = z.object({
  senderName: z.string().min(2, 'Tên người gửi phải có ít nhất 2 ký tự'),
  senderPhone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  senderProvince: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành phố'),
  senderDistrict: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
  senderWard: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  senderAddress: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),

  receiverName: z.string().min(2, 'Tên người nhận phải có ít nhất 2 ký tự'),
  receiverPhone: z.string().regex(phoneRegex, 'Số điện thoại không hợp lệ'),
  receiverProvince: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành phố'),
  receiverDistrict: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
  receiverWard: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  receiverAddress: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),

  weight: z.coerce.number().min(0.1, 'Trọng lượng tối thiểu 0.1kg').max(50, 'Trọng lượng tối đa 50kg'),
  length: z.coerce.number().min(0).optional(),
  width: z.coerce.number().min(0).optional(),
  height: z.coerce.number().min(0).optional(),
  productType: z.enum(['Document', 'Fragile', 'Electronic', 'Food', 'Clothing', 'Other']),
  codAmount: z.coerce.number().min(0, 'Số tiền COD không hợp lệ'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Fields to validate at each step
const stepFields: (keyof FormValues)[][] = [
  ['senderName', 'senderPhone', 'senderProvince', 'senderDistrict', 'senderWard', 'senderAddress'],
  ['receiverName', 'receiverPhone', 'receiverProvince', 'receiverDistrict', 'receiverWard', 'receiverAddress'],
  ['weight', 'productType', 'codAmount'],
  [],
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

function getProvinceName(code: string) {
  return provinces.find((p) => p.code === code)?.name ?? code;
}

function getDistrictName(provinceCode: string, districtCode: string) {
  return districts[provinceCode]?.find((d) => d.code === districtCode)?.name ?? districtCode;
}

function getWardName(districtCode: string, wardCode: string) {
  return wards[districtCode]?.find((w) => w.code === wardCode)?.name ?? wardCode;
}

// ──────────────────────────────────────────────
// Sub-components (Defined outside to avoid React unmount focus loss bug)
// ──────────────────────────────────────────────

interface AddressFieldsProps {
  form: UseFormReturn<FormValues>;
  prefix: 'sender' | 'receiver';
  districtList: { code: string; name: string }[];
  wardList: { code: string; name: string }[];
  savedAddresses?: any[];
  onSelectAddress?: (addr: any) => void;
  saveToContacts?: boolean;
  onSaveToContactsChange?: (checked: boolean) => void;
}

function AddressFields({
  form,
  prefix,
  districtList,
  wardList,
  savedAddresses,
  onSelectAddress,
  saveToContacts,
  onSaveToContactsChange,
}: AddressFieldsProps) {
  const nameField = `${prefix}Name` as keyof FormValues;
  const phoneField = `${prefix}Phone` as keyof FormValues;
  const provinceField = `${prefix}Province` as keyof FormValues;
  const districtField = `${prefix}District` as keyof FormValues;
  const wardField = `${prefix}Ward` as keyof FormValues;
  const addressField = `${prefix}Address` as keyof FormValues;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Saved Address Book Dropdown Selector (Shopee-style) */}
      {prefix === 'receiver' && savedAddresses && savedAddresses.length > 0 && (
        <div className="md:col-span-2 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shadow-sm animate-in fade-in duration-300">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
              <MapPin className="size-4 text-indigo-600 animate-pulse" />
              Địa chỉ người nhận đã lưu
            </h4>
            <p className="text-xs text-indigo-700/80">Chọn nhanh thông tin người nhận từ danh bạ để tiết kiệm thời gian.</p>
          </div>
          <Select
            onValueChange={(val) => {
              const addr = savedAddresses.find(a => a.id === val);
              if (addr && onSelectAddress) onSelectAddress(addr);
            }}
          >
            <FormControl>
              <SelectTrigger className="w-full sm:w-[280px] bg-background border-indigo-200 focus:ring-indigo-500 font-medium">
                <SelectValue placeholder="Chọn địa chỉ từ danh bạ" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {savedAddresses.map((addr) => (
                <SelectItem key={addr.id} value={addr.id} className="cursor-pointer">
                  {addr.name} ({addr.phone})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <FormField
        control={form.control}
        name={nameField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Họ tên</FormLabel>
            <FormControl>
              <Input placeholder="Nguyễn Văn A" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={phoneField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Số điện thoại</FormLabel>
            <FormControl>
              <Input placeholder="0901234567" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={provinceField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tỉnh/Thành phố</FormLabel>
            <Select
              value={field.value as string}
              onValueChange={(v) => {
                field.onChange(v);
                form.setValue(districtField, '');
                form.setValue(wardField, '');
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn Tỉnh/Thành phố" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {provinces.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={districtField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Quận/Huyện</FormLabel>
            <Select
              value={field.value as string}
              onValueChange={(v) => {
                field.onChange(v);
                form.setValue(wardField, '');
              }}
              disabled={districtList.length === 0}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn Quận/Huyện" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {districtList.map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={wardField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phường/Xã</FormLabel>
            <Select
              value={field.value as string}
              onValueChange={field.onChange}
              disabled={wardList.length === 0}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn Phường/Xã" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {wardList.map((w) => (
                  <SelectItem key={w.code} value={w.code}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={addressField}
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Địa chỉ chi tiết</FormLabel>
            <FormControl>
              <Textarea placeholder="Số nhà, tên đường..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Save to contacts checkbox */}
      {prefix === 'receiver' && onSaveToContactsChange && (
        <div className="md:col-span-2 flex items-center space-x-2 pt-2 border-t border-muted/50 mt-2">
          <input
            type="checkbox"
            id="saveAddress"
            className="size-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
            checked={saveToContacts || false}
            onChange={(e) => onSaveToContactsChange(e.target.checked)}
          />
          <label htmlFor="saveAddress" className="text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer select-none">
            Lưu thông tin người nhận này vào danh bạ địa chỉ để dùng lại lần sau
          </label>
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  v,
  estimatedFee,
}: {
  v: FormValues;
  estimatedFee: number;
}) {
  const senderFullAddress = [
    v.senderAddress,
    getWardName(v.senderDistrict, v.senderWard),
    getDistrictName(v.senderProvince, v.senderDistrict),
    getProvinceName(v.senderProvince),
  ].filter(Boolean).join(', ');

  const receiverFullAddress = [
    v.receiverAddress,
    getWardName(v.receiverDistrict, v.receiverWard),
    getDistrictName(v.receiverProvince, v.receiverDistrict),
    getProvinceName(v.receiverProvince),
  ].filter(Boolean).join(', ');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sender card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="size-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                <UserCircle className="size-3.5 text-blue-600" />
              </div>
              Người gửi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Họ tên:</span> {v.senderName}</p>
            <p><span className="text-muted-foreground">SĐT:</span> {v.senderPhone}</p>
            <p><span className="text-muted-foreground">Địa chỉ:</span> {senderFullAddress}</p>
          </CardContent>
        </Card>

        {/* Receiver card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="size-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <MapPin className="size-3.5 text-emerald-600" />
              </div>
              Người nhận
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Họ tên:</span> {v.receiverName}</p>
            <p><span className="text-muted-foreground">SĐT:</span> {v.receiverPhone}</p>
            <p><span className="text-muted-foreground">Địa chỉ:</span> {receiverFullAddress}</p>
          </CardContent>
        </Card>
      </div>

      {/* Package info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="size-6 rounded-md bg-violet-500/10 flex items-center justify-center">
              <Package className="size-3.5 text-violet-600" />
            </div>
            Thông tin kiện hàng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Trọng lượng</p>
              <p className="font-medium">{v.weight} kg</p>
            </div>
            <div>
              <p className="text-muted-foreground">Loại hàng</p>
              <p className="font-medium">{productTypeLabels[v.productType]}</p>
            </div>
            {(v.length || v.width || v.height) && (
              <div>
                <p className="text-muted-foreground">Kích thước</p>
                <p className="font-medium">{v.length ?? 0} × {v.width ?? 0} × {v.height ?? 0} cm</p>
              </div>
            )}
            {v.notes && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Ghi chú</p>
                <p className="font-medium">{v.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fee summary */}
      <Card className="shadow-sm border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tiền thu hộ (COD)</span>
              <span className="font-medium">{formatCurrency(Number(v.codAmount) || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Phí vận chuyển (ước tính)</span>
              <span className="font-medium">{formatCurrency(estimatedFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm font-semibold">
              <span>Tổng tiền thu người nhận</span>
              <span className="text-lg">{formatCurrency((Number(v.codAmount) || 0) + estimatedFee)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// Page Component
// ──────────────────────────────────────────────

export default function CreateOrderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: session } = useSession();
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [saveToContacts, setSaveToContacts] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      senderName: '',
      senderPhone: '',
      senderProvince: '',
      senderDistrict: '',
      senderWard: '',
      senderAddress: '',
      receiverName: '',
      receiverPhone: '',
      receiverProvince: '',
      receiverDistrict: '',
      receiverWard: '',
      receiverAddress: '',
      weight: '' as any,
      length: '' as any,
      width: '' as any,
      height: '' as any,
      productType: 'Other',
      codAmount: '' as any,
      notes: '',
    },
  });

  const watchedValues = form.watch();

  const senderDistrictList = districts[watchedValues.senderProvince] ?? [];
  const senderWardList = wards[watchedValues.senderDistrict] ?? [];
  const receiverDistrictList = districts[watchedValues.receiverProvince] ?? [];
  const receiverWardList = wards[watchedValues.receiverDistrict] ?? [];

  const estimatedFee = (watchedValues.weight || 0) * 5000 + 15000;

  useEffect(() => {
    async function loadAddresses() {
      if (!session?.user?.id) return;
      try {
        setLoadingAddresses(true);
        const res = await fetchApi<any>('masterdata', `/Partners?tenantId=${session.user.id}&pageSize=100`);
        const items = res?.value?.items || res?.items || res || [];
        const consignees = items.filter((p: any) => p.type === 1 || p.type === 'Consignee');
        setSavedAddresses(consignees);
      } catch (err) {
        console.error("Failed to load saved addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    }
    loadAddresses();
  }, [session]);

  function handleSelectAddress(addr: any) {
    if (!addr) return;
    
    let street = addr.address || '';
    let districtCode = '';
    let wardCode = '';
    let provinceCode = addr.city || '';
    
    if (street.startsWith('{')) {
      try {
        const parsed = JSON.parse(street);
        street = parsed.street || '';
        districtCode = parsed.district || '';
        wardCode = parsed.ward || '';
        provinceCode = parsed.province || provinceCode;
      } catch (e) {
        console.error("Failed to parse saved address JSON:", e);
      }
    }
    
    form.setValue('receiverName', addr.name || '');
    form.setValue('receiverPhone', addr.phone || '');
    form.setValue('receiverProvince', provinceCode);
    
    setTimeout(() => {
      form.setValue('receiverDistrict', districtCode);
      setTimeout(() => {
        form.setValue('receiverWard', wardCode);
      }, 50);
    }, 50);
    
    form.setValue('receiverAddress', street);
    toast.success(`Đã tự động điền địa chỉ của ${addr.name}!`);
  }

  async function handleNext() {
    const fields = stepFields[currentStep];
    if (fields.length > 0) {
      const valid = await form.trigger(fields);
      if (!valid) return;
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    
    const payload = {
      skuCodes: ["UNKNOWN-SKU"],
      consignee: {
        fullName: data.receiverName,
        phone: data.receiverPhone,
        address: {
          street: data.receiverAddress,
          city: getProvinceName(data.receiverProvince),
          state: getDistrictName(data.receiverProvince, data.receiverDistrict),
          country: "VN",
          zipCode: data.receiverWard
        }
      },
      consignor: {
        fullName: data.senderName,
        phone: data.senderPhone,
        address: {
          street: data.senderAddress,
          city: getProvinceName(data.senderProvince),
          state: getDistrictName(data.senderProvince, data.senderDistrict),
          country: "VN",
          zipCode: data.senderWard
        }
      },
      codAmount: data.codAmount || 0,
      shippingFee: estimatedFee || 0,
      weight: data.weight || 0.1,
      note: data.notes || "",
      fulfillmentMode: 1,
      orderType: 1
    };

    try {
      const res = await fetchApi<{isSuccess: boolean}>('oms', '/orders', { method: 'POST', body: payload });
      if (res && res.isSuccess) {
        toast.success('Đơn hàng đã được tạo thành công!');

        // Save new receiver to Master Data address book if enabled
        if (saveToContacts && session?.user?.id) {
          try {
            const addressJson = JSON.stringify({
              street: data.receiverAddress,
              district: data.receiverDistrict,
              ward: data.receiverWard,
              province: data.receiverProvince
            });
            
            await fetchApi('masterdata', '/Partners', {
              method: 'POST',
              body: {
                tenantId: session.user.id,
                code: `ADDR-${Date.now()}`,
                name: data.receiverName,
                type: 1, // Consignee
                phone: data.receiverPhone,
                address: addressJson,
                city: data.receiverProvince
              }
            });
            toast.success('Đã lưu thông tin người nhận vào danh bạ địa chỉ!');
          } catch (contactErr) {
            console.error("Failed to save address to contacts:", contactErr);
          }
        }

        form.reset();
        setCurrentStep(0);
        router.push('/orders');
      } else {
        toast.error('Có lỗi xảy ra khi tạo đơn hàng');
      }
    } catch (e) {
      toast.error('Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ──────────────────────────────────────────
  // Step content
  // ──────────────────────────────────────────

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <AddressFields
            form={form}
            prefix="sender"
            districtList={senderDistrictList}
            wardList={senderWardList}
          />
        );
      case 1:
        return (
          <AddressFields
            form={form}
            prefix="receiver"
            districtList={receiverDistrictList}
            wardList={receiverWardList}
            savedAddresses={savedAddresses}
            onSelectAddress={handleSelectAddress}
            saveToContacts={saveToContacts}
            onSaveToContactsChange={setSaveToContacts}
          />
        );
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trọng lượng (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" min="0" placeholder="0.5" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại hàng hóa</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn loại hàng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(productTypeLabels) as ProductType[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {productTypeLabels[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dimensions */}
            <div className="md:col-span-2">
              <p className="text-sm font-medium mb-2">Kích thước (cm) <span className="text-muted-foreground font-normal">- tùy chọn</span></p>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" min="0" placeholder="Dài" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" min="0" placeholder="Rộng" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="number" min="0" placeholder="Cao" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="codAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiền thu hộ (COD)</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type="number" min="0" step="1000" placeholder="0" className="pr-8" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₫</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Ghi chú <span className="text-muted-foreground font-normal">- tùy chọn</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Giao giờ hành chính, gọi trước khi giao..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
      case 3:
        return <ReviewStep v={watchedValues} estimatedFee={estimatedFee} />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo đơn hàng mới</h1>
        <p className="text-muted-foreground">Điền đầy đủ thông tin để tạo đơn gửi hàng</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          {/* Stepper */}
          <OrderStepper steps={steps} currentStep={currentStep} onStepClick={(s) => {
            // Only allow clicking back, not forward (validation required)
            if (s < currentStep) setCurrentStep(s);
          }} />

          <Separator className="my-6" />

          {/* Step content */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="min-h-[320px]">
                {renderStep()}
              </div>

              {/* Navigation */}
              <Separator />
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="gap-1.5"
                >
                  <ArrowLeft className="size-4" />
                  Quay lại
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-1.5"
                  >
                    Tiếp tục
                    <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md hover:shadow-lg transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-4" />
                        Tạo đơn hàng
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
