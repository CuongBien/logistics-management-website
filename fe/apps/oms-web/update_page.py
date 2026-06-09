import sys

file_path = r'd:\Logistics\fe\apps\oms-web\app\(portal)\orders\create\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    '''import { useForm, UseFormReturn } from 'react-hook-form';''',
    '''import { useForm, UseFormReturn, useFieldArray } from 'react-hook-form';\nimport { QRCodeSVG } from 'qrcode.react';'''
)

content = content.replace(
    '''  Loader2,
} from 'lucide-react';''',
    '''  Loader2,
  QrCode,
  Printer,
  Plus,
  Trash2
} from 'lucide-react';'''
)

# 2. Steps
content = content.replace(
    '''  { title: 'Xác nhận', description: 'Kiểm tra và tạo đơn', icon: CheckCircle },
];''',
    '''  { title: 'Xác nhận', description: 'Kiểm tra và tạo đơn', icon: CheckCircle },
  { title: 'Hoàn tất', description: 'In vận đơn', icon: QrCode },
];'''
)

# 3. Zod Schema
content = content.replace(
    '''  productType: z.enum(['Document', 'Fragile', 'Electronic', 'Food', 'Clothing', 'Other']),
  codAmount: z.coerce.number().min(0, 'Số tiền COD không hợp lệ'),''',
    '''  productType: z.enum(['Document', 'Fragile', 'Electronic', 'Food', 'Clothing', 'Other']),
  items: z.array(z.object({ sku: z.string().min(1, 'Vui lòng nhập SKU') })).min(1, 'Phải có ít nhất 1 sản phẩm'),
  codAmount: z.coerce.number().min(0, 'Số tiền COD không hợp lệ'),'''
)

# 4. AddressFields component
content = content.replace(
    '''      {/* Saved Address Book Dropdown Selector (Shopee-style) */}
      {prefix === 'receiver' && savedAddresses && savedAddresses.length > 0 && (
        <div className="md:col-span-2 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shadow-sm animate-in fade-in duration-300">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
              <MapPin className="size-4 text-indigo-600 animate-pulse" />
              Địa chỉ người nhận đã lưu
            </h4>
            <p className="text-xs text-indigo-700/80">Chọn nhanh thông tin người nhận từ danh bạ để tiết kiệm thời gian.</p>
          </div>''',
    '''      {/* Saved Address Book Dropdown Selector (Shopee-style) */}
      {savedAddresses && savedAddresses.length > 0 && (
        <div className="md:col-span-2 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 shadow-sm animate-in fade-in duration-300">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
              <MapPin className="size-4 text-indigo-600 animate-pulse" />
              {prefix === 'receiver' ? 'Địa chỉ người nhận đã lưu' : 'Địa chỉ người gửi đã lưu'}
            </h4>
            <p className="text-xs text-indigo-700/80">Chọn nhanh thông tin từ danh bạ để tiết kiệm thời gian.</p>
          </div>'''
)

content = content.replace(
    '''      {/* Save to contacts checkbox */}
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
      )}''',
    '''      {/* Save to contacts checkbox */}
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
      )}'''
)

# 5. Page Component Setup
content = content.replace(
    '''  const { data: session } = useSession();
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [saveToContacts, setSaveToContacts] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);''',
    '''  const { data: session } = useSession();
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [saveToContacts, setSaveToContacts] = useState(false);
  const [savedSenderAddresses, setSavedSenderAddresses] = useState<any[]>([]);
  const [saveSenderToContacts, setSaveSenderToContacts] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<{id: string, waybillCode: string} | null>(null);'''
)

content = content.replace(
    '''      width: '' as any,
      height: '' as any,
      productType: 'Other',
      codAmount: '' as any,
      notes: '',
    },
  });''',
    '''      width: '' as any,
      height: '' as any,
      productType: 'Other',
      items: [{ sku: '' }],
      codAmount: '' as any,
      notes: '',
    },
  });'''
)

content = content.replace(
    '''  const watchedValues = form.watch();''',
    '''  const watchedValues = form.watch();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items'
  });'''
)

content = content.replace(
    '''        const consignees = items.filter((p: any) => p.type === 1 || p.type === 'Consignee');
        setSavedAddresses(consignees);''',
    '''        const consignees = items.filter((p: any) => p.type === 1 || p.type === 'Consignee');
        const consignors = items.filter((p: any) => p.type === 0 || p.type === 'Consignor');
        setSavedAddresses(consignees);
        setSavedSenderAddresses(consignors);'''
)

content = content.replace(
    '''    form.setValue('receiverName', addr.name || '');
    form.setValue('receiverPhone', addr.phone || '');
    form.setValue('receiverProvince', provinceCode);
    
    setTimeout(() => {
      form.setValue('receiverDistrict', districtCode);
      setTimeout(() => {
        form.setValue('receiverWard', wardCode);
      }, 50);
    }, 50);
    
    form.setValue('receiverAddress', street);''',
    '''    const isSender = (addr.type === 0 || addr.type === 'Consignor');
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
    
    form.setValue(`${prefix}Address` as any, street);'''
)

# 6. onSubmit
content = content.replace(
    '''      skuCodes: ["UNKNOWN-SKU"],
      consignee: {''',
    '''      skuCodes: data.items.map(i => i.sku),
      consignee: {'''
)

content = content.replace(
    '''    try {
      const res = await fetchApi<{isSuccess: boolean}>('oms', '/orders', { method: 'POST', body: payload });
      if (res && res.isSuccess) {
        toast.success('Đơn hàng đã được tạo thành công!');

        // Save new receiver to Master Data address book if enabled
        if (saveToContacts && session?.user?.id) {''',
    '''    try {
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
        if (saveToContacts && session?.user?.id) {'''
)

content = content.replace(
    '''        form.reset();
        setCurrentStep(0);
        router.push('/orders');
      } else {
        toast.error('Có lỗi xảy ra khi tạo đơn hàng');
      }
    } catch (e) {
      toast.error('Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }''',
    '''        try {
          const detailRes = await fetchApi<any>('oms', `/orders/${res.value}`);
          if (detailRes && detailRes.isSuccess && detailRes.value) {
            setCreatedOrder({ id: res.value, waybillCode: detailRes.value.waybillCode });
          } else {
            setCreatedOrder({ id: res.value, waybillCode: res.value });
          }
        } catch {
          setCreatedOrder({ id: res.value, waybillCode: res.value });
        }

        setCurrentStep(4);
      } else {
        toast.error('Có lỗi xảy ra khi tạo đơn hàng');
      }
    } catch (e) {
      toast.error('Có lỗi xảy ra khi tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }'''
)

# 7. Render Step
content = content.replace(
    '''      case 0:
        return (
          <AddressFields
            form={form}
            prefix="sender"
            districtList={senderDistrictList}
            wardList={senderWardList}
          />
        );''',
    '''      case 0:
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
        );'''
)

content = content.replace(
    '''      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="weight"''',
    '''      case 2:
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
                            <Input placeholder="Nhập mã SKU... (ví dụ: TSHIRT-RED-M)" {...inputField} />
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
              name="weight"'''
)

content = content.replace(
    '''      case 3:
        return <ReviewStep v={watchedValues} estimatedFee={estimatedFee} />;
      default:
        return null;''',
    '''      case 3:
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
                        @media print { button { display: none; } }
                      </style>
                    </head>
                    <body>
                      <h1>Mã vận đơn: ${createdOrder.waybillCode}</h1>
                      <div class="qr">
                        <img src="` + document.querySelector('svg')?.outerHTML.replace(/#/g, '%23').replace(/"/g, "'").replace(/</g, '%3C').replace(/>/g, '%3E').replace(/^/, 'data:image/svg+xml;utf8,') + `" alt="QR Code" width="200" height="200" />
                      </div>
                      <div class="details">
                        <strong>Người gửi:</strong> ${watchedValues.senderName} (${watchedValues.senderPhone})<br/>
                        <strong>Người nhận:</strong> ${watchedValues.receiverName} (${watchedValues.receiverPhone})<br/>
                        <strong>Thu hộ:</strong> ${watchedValues.codAmount} đ<br/>
                        <strong>Hàng hóa:</strong> ${watchedValues.items.map(i => i.sku).join(', ')}<br/>
                      </div>
                      <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;">In ngay</button>
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
        return null;'''
)

content = content.replace(
    '''                {currentStep < steps.length - 1 ? (''',
    '''                {currentStep === 4 ? null : currentStep < steps.length - 2 ? ('''
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated page.tsx successfully')
