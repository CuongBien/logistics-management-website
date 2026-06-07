'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, PlusCircle, MapPin, Phone, User, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';
import { useSession } from 'next-auth/react';

import type { PartnerDto } from '@/types/masterdata';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';

export default function ContactsPage() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<PartnerDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    if (!session?.user?.id) return;
    try {
      setLoading(true);
      const res = await fetchApi<{
        isSuccess: boolean;
        value: { items: PartnerDto[] };
      }>('masterdata', `/partners?tenantId=${session.user.id}&page=1&pageSize=50`);

      if (res && res.isSuccess && res.value) {
        setContacts(res.value.items || []);
      }
    } catch (err) {
      console.error('Failed to load contacts', err);
      toast.error('Lỗi khi tải danh bạ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchContacts();
    }
  }, [session]);

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(lowerSearch) ||
      (c.phone && c.phone.includes(lowerSearch)) ||
      (c.city && c.city.toLowerCase().includes(lowerSearch))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Sổ địa chỉ</h1>
          <p className="text-muted-foreground mt-1">Quản lý danh bạ người gửi và người nhận thường xuyên của bạn</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md gap-1.5 rounded-xl px-5 h-10">
          <Link href="/contacts/create">
            <PlusCircle className="size-4" /> Thêm địa chỉ mới
          </Link>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          placeholder="Tìm theo tên, SĐT hoặc thành phố..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white shadow-sm border-slate-200 h-11 rounded-xl focus-visible:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="size-10 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Đang tải sổ địa chỉ...</p>
        </div>
      ) : contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-500 font-medium">Không tìm thấy liên hệ nào phù hợp</p>
            </div>
          ) : (
            filtered.map((contact) => (
              <Card key={contact.id} className="shadow-sm hover:shadow-md transition-all duration-200 border-slate-200 overflow-hidden group rounded-2xl">
                <CardHeader className="p-5 pb-4 border-b border-slate-100 bg-slate-50/50 relative">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:text-slate-900 bg-white/80 backdrop-blur-sm shadow-sm border">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Edit className="size-4 text-slate-500" />
                          <span>Chỉnh sửa</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                          <Trash2 className="size-4" />
                          <span>Xóa liên hệ</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-start gap-3.5 pr-8">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-inner">
                      <User className="size-6" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate font-semibold text-slate-800" title={contact.name}>
                        {contact.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                        <Phone className="size-3.5" />
                        {contact.phone || 'Chưa cập nhật SĐT'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-4">
                  <div className="flex items-start gap-2.5 text-sm text-slate-600">
                    <MapPin className="size-4 mt-0.5 shrink-0 text-slate-400" />
                    <div className="flex flex-col gap-1">
                      <span className="line-clamp-2 leading-relaxed" title={contact.address}>
                        {(() => {
                          const addr = contact.address;
                          if (addr && addr.startsWith('{')) {
                            try {
                              const parsed = JSON.parse(addr);
                              return parsed.street || addr;
                            } catch (e) {}
                          }
                          return addr || 'Chưa cập nhật địa chỉ';
                        })()}
                      </span>
                      {contact.city && (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 w-fit px-2 py-0.5 rounded-md">
                          {contact.city}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={contact.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}>
                        {contact.isActive ? "Sẵn sàng" : "Đã ẩn"}
                      </Badge>
                      {(() => {
                        const isSender = contact.type === 0 || String(contact.type) === '0' || contact.type === 'Consignor';
                        return (
                          <Badge variant="secondary" className={isSender ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                            {isSender ? "Người gửi" : "Người nhận"}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center py-20 text-center shadow-sm">
          <div className="size-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-5">
            <User className="size-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Chưa có sổ địa chỉ nào</h2>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
            Lưu trữ danh bạ người nhận và gửi hàng thường xuyên để thao tác tạo đơn siêu tốc chỉ với 1 cú click.
          </p>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 shadow-lg shadow-blue-500/20 rounded-xl px-6 h-12">
            <Link href="/contacts/create">
              <PlusCircle className="size-5" /> Thêm địa chỉ đầu tiên
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
