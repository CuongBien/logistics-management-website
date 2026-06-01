'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Search, PlusCircle, MapPin, Phone, Building } from 'lucide-react';
import { fetchApi } from '@/lib/api-client';

import type { PartnerDto } from '@/types/masterdata';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function PartnersPage() {
  const [partners, setPartners] = useState<PartnerDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<{
        isSuccess: boolean;
        value: { items: PartnerDto[] };
      }>('masterdata', '/partners?page=1&pageSize=50');

      if (res && res.isSuccess && res.value) {
        setPartners(res.value.items || []);
      }
    } catch (err) {
      console.error('Failed to load partners', err);
      toast.error('Lỗi khi tải danh sách đối tác');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const filtered = partners.filter((p) => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(lowerSearch) ||
      (p.phone && p.phone.includes(lowerSearch)) ||
      (p.city && p.city.toLowerCase().includes(lowerSearch))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sổ địa chỉ (Đối tác)</h1>
          <p className="text-muted-foreground">Quản lý danh sách người gửi và người nhận thường xuyên</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm gap-1.5">
          <Link href="/portal/partners/create">
            <PlusCircle className="size-4" /> Thêm mới
          </Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, SĐT hoặc thành phố..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Đang tải dữ liệu...</div>
      ) : partners.length > 0 ? (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-base">
              {filtered.length} đối tác
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đối tác</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Thành phố</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Không tìm thấy đối tác nào phù hợp
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Building className="size-4 text-muted-foreground" />
                        {partner.name}
                      </TableCell>
                      <TableCell>
                        {partner.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="size-3 text-muted-foreground" />
                            {partner.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{partner.city || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={partner.address}>
                        {partner.address ? (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3 text-muted-foreground" />
                            {partner.address}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>
                        {partner.isActive ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Hoạt động</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Đã khóa</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(partner.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building className="size-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">Chưa có sổ địa chỉ nào</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Lưu trữ danh sách đối tác nhận và gửi hàng thường xuyên để việc lên đơn nhanh chóng hơn.
            </p>
            <Button asChild className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 gap-1.5 shadow-md">
              <Link href="/portal/partners/create">
                <PlusCircle className="size-4" /> Thêm đối tác ngay
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
