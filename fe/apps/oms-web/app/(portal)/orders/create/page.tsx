'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, UseFormReturn, useFieldArray } from 'react-hook-form';
import { QRCodeSVG } from 'qrcode.react';
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
  QrCode,
  Printer,
  Plus,
  Trash2
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@repo/ui/components/dialog';

// ──────────────────────────────────────────────
// Stepper steps
// ──────────────────────────────────────────────

const steps = [
  { title: 'Người gửi', description: 'Thông tin người gửi hàng', icon: UserCircle },
  { title: 'Người nhận', description: 'Thông tin người nhận hàng', icon: MapPin },
  { title: 'Hàng hóa', description: 'Thông tin kiện hàng', icon: Package },
  { title: 'Xác nhận', description: 'Kiểm tra và tạo đơn', icon: CheckCircle },
  { title: 'Hoàn tất', description: 'In vận đơn', icon: QrCode },
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
  items: z.array(z.object({ sku: z.string().min(1, 'Vui lòng nhập SKU') })).min(1, 'Phải có ít nhất 1 sản phẩm'),
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
      {savedAddresses && savedAddresses.length > 0 && (
        <div className="md:col-span-2 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shadow-sm animate-in fade-in duration-300">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
              <MapPin className="size-4 text-indigo-600 animate-pulse" />
              {prefix === 'receiver' ? 'Địa chỉ người nhận đã lưu' : 'Địa chỉ người gửi đã lưu'}
            </h4>
            <p className="text-xs text-indigo-700/80">Chọn nhanh thông tin từ danh bạ để tiết kiệm thời gian.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <MapPin className="size-4 mr-2" /> Mở sổ địa chỉ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{prefix === 'receiver' ? 'Sổ địa chỉ người nhận' : 'Sổ địa chỉ người gửi'}</DialogTitle>
                <DialogDescription>
                  Chọn nhanh địa chỉ đã lưu từ danh bạ để tự động điền thông tin.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[350px] overflow-y-auto space-y-2 mt-2 pr-1 custom-scrollbar">
                {savedAddresses.map((addr) => {
                  let street = addr.address;
                  if (street && street.startsWith('{')) {
                    try { street = JSON.parse(street).street; } catch {}
                  }
                  return (
                    <div 
                      key={addr.id} 
                      className="p-3 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/80 cursor-pointer transition-colors shadow-sm"
                      onClick={() => {
                        if (onSelectAddress) onSelectAddress(addr);
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                      }}
                    >
                      <div className="font-semibold text-sm flex items-center justify-between">
                        {addr.name}
                        <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{addr.phone}</span>
                      </div>
                      {street && <div className="text-xs text-muted-foreground mt-1.5 truncate">{street}</div>}
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
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
      {onSaveToContactsChange && (
        <div className="md:col-span-2 flex items-center space-x-2 pt-2 border-t border-muted/50 mt-2">
          <input
            type="checkbox"
            id={`saveAddress-${prefix}`}
            className="size-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
            checked={saveToContacts || false}
            onChange={(e) => onSaveToContactsChange(e.target.checked)}
          />
          <label htmlFor={`saveAddress-${prefix}`} className="text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer select-none">
            {prefix === 'receiver' ? 'Lưu thông tin người nhận này vào danh bạ' : 'Lưu thông tin người gửi này vào danh bạ'}
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
        <Card className="shadow-md border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800/50">
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
        <Card className="shadow-md border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800/50">
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
      <Card className="shadow-md border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow mt-4">
        <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800/50">
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
  const [savedSenderAddresses, setSavedSenderAddresses] = useState<any[]>([]);
  const [saveSenderToContacts, setSaveSenderToContacts] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{id: string, waybillCode: string} | null>(null);
  const [availableSkus, setAvailableSkus] = useState<any[]>([]);

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
      items: [{ sku: '' }],
      codAmount: '' as any,
      notes: '',
    },
  });

  const watchedValues = form.watch();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });

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
        const consignors = items.filter((p: any) => p.type === 0 || p.type === 'Consignor');
        setSavedAddresses(consignees);
        setSavedSenderAddresses(consignors);

        try {
          const skuRes = await fetchApi<any>('wms', '/inventory/skus');
          if (skuRes && skuRes.value) {
            setAvailableSkus(skuRes.value);
          } else if (Array.isArray(skuRes)) {
            setAvailableSkus(skuRes);
          }
        } catch (skuErr) {
          console.error("Failed to load SKUs:", skuErr);
        }
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
    
    const isSender = (addr.type === 0 || addr.type === 'Consignor');
    const prefix = isSender ? 'sender' : 'receiver';
    
    form.setValue(`${prefix}Name` as any, addr.name || '');
    form.setValue(`${prefix}Phone` as any, addr.phone || '');
    form.setValue(`${prefix}Province` as any, provinceCode);
    
    setTimeout(() => {
      form.setValue(`${prefix}District` as any, districtCode);
      setTimeout(() => {
        form.setValue(`${prefix}Ward` as any, wardCode);
      }, 50);
    }, 50);
    
    form.setValue(`${prefix}Address` as any, street);
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
      skuCodes: data.items.map(i => i.sku),
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
      const res = await fetchApi<any>('oms', '/orders', { method: 'POST', body: payload });
      if (res && res.isSuccess && res.value) {
        toast.success('Đơn hàng đã được tạo thành công!');

        // Save new sender to Master Data address book if enabled
        if (saveSenderToContacts && session?.user?.id) {
          try {
            const addressJson = JSON.stringify({ street: data.senderAddress, district: data.senderDistrict, ward: data.senderWard, province: data.senderProvince });
            await fetchApi('masterdata', '/Partners', {
              method: 'POST',
              body: { tenantId: session.user.id, code: `SNDR-${Date.now()}`, name: data.senderName, type: 0, phone: data.senderPhone, address: addressJson, city: data.senderProvince }
            });
          } catch (contactErr) {}
        }

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

        try {
          const detailRes = await fetchApi<any>('oms', `/orders/${res.value}`);
          if (detailRes && detailRes.isSuccess && detailRes.value) {
            setCreatedOrder({ id: res.value, waybillCode: detailRes.value.waybillCode });
          } else {
            setCreatedOrder({ id: res.value, waybillCode: res.value });
          }
        } catch (detailErr) {
          console.error("Fetch detail error:", detailErr);
          setCreatedOrder({ id: res.value, waybillCode: res.value });
        }

        setCurrentStep(4);
      } else {
        toast.error(res?.error?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
      }
    } catch (e: any) {
      console.error("Submit error:", e, e?.body);
      let msg = e?.body?.error?.message || e?.body?.message || e?.message || 'Có lỗi xảy ra khi tạo đơn hàng';
      if (e?.body?.errors) {
        // ASP.NET ValidationProblemDetails
        const errors = e.body.errors;
        msg = Object.values(errors).flat().join(', ');
      }
      toast.error(`Lỗi: ${msg}`);
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
            savedAddresses={savedSenderAddresses}
            onSelectAddress={handleSelectAddress}
            saveToContacts={saveSenderToContacts}
            onSaveToContactsChange={setSaveSenderToContacts}
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
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <FormLabel className="text-base">Danh sách sản phẩm (SKUs)</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ sku: '' })} className="h-8">
                  <Plus className="size-3.5 mr-1.5" /> Thêm sản phẩm
                </Button>
              </div>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-3 animate-in fade-in duration-200">
                    <FormField
                      control={form.control}
                      name={`items.${index}.sku`}
                      render={({ field: inputField }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Select value={inputField.value} onValueChange={inputField.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn sản phẩm (SKU)" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSkus.length > 0 ? (
                                  availableSkus.map(sku => (
                                    <SelectItem key={sku.id || sku.skuCode} value={sku.skuCode}>
                                      {sku.name || sku.skuCode} ({sku.skuCode})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-sm text-muted-foreground text-center">Không có sản phẩm nào</div>
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => remove(index)}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Separator className="md:col-span-2 my-2" />
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
      case 4:
        if (!createdOrder) return null;
        return (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center animate-in zoom-in-95 duration-500">
            <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle className="size-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Tạo đơn hàng thành công!</h2>
              <p className="text-gray-500">Mã vận đơn của bạn là: <strong className="text-indigo-600 text-lg">{createdOrder.waybillCode}</strong></p>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <QRCodeSVG value={createdOrder.waybillCode} size={200} level="H" includeMargin />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.push('/orders')} className="w-32">
                Về danh sách
              </Button>
              <Button type="button" onClick={() => {
                const printWindow = window.open('', '_blank');
                printWindow?.document.write(`
                  <html>
                    <head>
                      <title>Print Label - ${createdOrder.waybillCode}</title>
                      <style>
                        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        h1 { font-size: 24px; margin-bottom: 20px; }
                        .qr { margin-bottom: 30px; }
                        .details { text-align: left; max-width: 400px; padding: 20px; border: 2px dashed #ccc; border-radius: 8px; }
                        @page { size: 100mm 150mm; margin: 0; }
                        @media print { 
                          body { width: 100mm; height: 150mm; margin: 0; padding: 5mm; box-sizing: border-box; justify-content: flex-start; }
                          button { display: none; }
                          .details { max-width: none; border: 2px solid #000; border-radius: 0; padding: 10px; }
                        }
                        .cod { font-size: 18px; font-weight: bold; margin-top: 10px; text-align: center; border: 2px solid #000; padding: 5px; }
                      </style>
                    </head>
                    <body>
                      <h1>Mã vận đơn: ${createdOrder.waybillCode}</h1>
                      <div class="qr">
                        <img src="` + document.querySelector('svg')?.outerHTML.replace(/#/g, '%23').replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E').replace(/^/, 'data:image/svg+xml;utf8,') + `" alt="QR Code" width="180" height="180" />
                      </div>
                      <div class="details">
                        <strong>Người gửi:</strong> ${watchedValues.senderName} (${watchedValues.senderPhone})<br/>
                        ${watchedValues.senderAddress}<br/>
                        <hr style="margin: 10px 0" />
                        <strong>Người nhận:</strong> ${watchedValues.receiverName} (${watchedValues.receiverPhone})<br/>
                        ${watchedValues.receiverAddress}<br/>
                        <hr style="margin: 10px 0" />
                        <strong>Hàng hóa:</strong> ${watchedValues.items.map(i => i.sku).join(', ')}<br/>
                        <strong>Trọng lượng:</strong> ${watchedValues.weight} kg
                      </div>
                      <div class="cod">
                        THU HỘ: ${formatCurrency(watchedValues.codAmount || 0)}
                      </div>
                      <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer; background: #4f46e5; color: white; border: none; border-radius: 6px;">In nhãn (100x150)</button>
                      <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
                    </body>
                  </html>
                `);
                printWindow?.document.close();
              }} className="w-40 bg-indigo-600 hover:bg-indigo-700">
                <Printer className="size-4 mr-2" /> In vận đơn
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-white to-white dark:from-indigo-950/20 dark:via-background dark:to-background p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-violet-700 dark:from-indigo-400 dark:to-violet-400">Tạo đơn hàng mới</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Điền đầy đủ thông tin để khởi tạo lộ trình vận đơn hoàn hảo</p>
        </div>
        <div className="hidden sm:flex size-14 rounded-full bg-indigo-100 dark:bg-indigo-900/50 items-center justify-center shadow-inner border border-indigo-200 dark:border-indigo-800">
          <Package className="size-7 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      <Card className="shadow-lg border-indigo-100 dark:border-indigo-900/30 overflow-hidden rounded-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500" />
        <CardContent className="pt-8 px-6 sm:px-10">
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
                  className="gap-1.5 rounded-lg px-6 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeft className="size-4" />
                  Quay lại
                </Button>

                {currentStep === 4 ? null : currentStep < steps.length - 2 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md rounded-lg px-6"
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
