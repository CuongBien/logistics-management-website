'use client';

import { useState, useEffect } from 'react';
import { RoleDto } from '@/types/wms-rbac';
import { fetchApi } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { toast as sonnerToast } from 'sonner';
import {
  UserPlus, Warehouse, UserCog, Loader2, Key, User, Mail
} from 'lucide-react';

interface CreateStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateStaffDialog({ open, onOpenChange, onSuccess }: CreateStaffDialogProps) {
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleCode, setRoleCode] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');

  // Try to use shadcn toast, fallback to sonner
  let toastFn: any;
  try {
    const { toast } = useToast();
    toastFn = toast;
  } catch {
    toastFn = null;
  }

  const showToast = (title: string, description: string, variant?: 'destructive') => {
    if (toastFn) {
      toastFn({ title, description, variant });
    } else {
      if (variant === 'destructive') {
        sonnerToast.error(`${title}: ${description}`);
      } else {
        sonnerToast.success(`${title}: ${description}`);
      }
    }
  };

  useEffect(() => {
    if (open) {
      // Reset form
      setUsername('');
      setPassword('');
      setEmail('');
      setFirstName('');
      setLastName('');
      setRoleCode('');
      setWarehouseId('');

      const loadWarehouses = async () => {
        try {
          const res = await fetchApi<any>('wms', '/Warehouse');
          let list: any[] = [];
          if (res) {
            if (res.isSuccess && Array.isArray(res.value)) {
              list = res.value;
            } else if (Array.isArray(res)) {
              list = res;
            }
          }
          setWarehouses(list);
          if (list.length > 0) {
            setWarehouseId(list[0].id);
          }
        } catch (e) {
          console.error("Failed to load warehouses from live API", e);
          setWarehouses([]);
          showToast('Lỗi', 'Không thể kết nối đến máy chủ WMS để tải danh sách Kho', 'destructive');
        }
      };

      const loadRoles = async () => {
        try {
          const res = await fetch('/api/wms/roles');
          const data = await res.json();
          if (data && data.isSuccess && Array.isArray(data.value)) {
            setRoles(data.value);
          } else if (data && Array.isArray(data)) {
            setRoles(data);
          } else {
            throw new Error("Invalid roles response format");
          }
        } catch (e) {
          console.error("Failed to load roles from API", e);
          setRoles([]);
          showToast('Lỗi', 'Không thể tải danh sách Vai trò từ hệ thống', 'destructive');
        }
      };

      loadWarehouses();
      loadRoles();
    }
  }, [open]);

  const handleSubmit = async () => {
    // Validation
    if (!username.trim() || !password.trim() || !email.trim() || !firstName.trim() || !lastName.trim() || !roleCode || !warehouseId) {
      showToast('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc', 'destructive');
      return;
    }

    if (password.length < 6) {
      showToast('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự', 'destructive');
      return;
    }

    // Chữ thường không dấu cho username
    const usernameRegex = /^[a-z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      showToast('Lỗi', 'Tên đăng nhập chỉ chứa chữ thường không dấu, số, dấu chấm, dấu gạch dưới hoặc gạch nối', 'destructive');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wms/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          roleCode,
          warehouseId
        })
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Thành công', `Đã tạo tài khoản nhân viên ${username} và gán quyền thành công.`);
        onSuccess();
        onOpenChange(false);
      } else {
        console.error("Failed to create staff:", data);
        showToast('Thất bại', data.details || data.error || 'Có lỗi xảy ra khi tạo nhân viên.', 'destructive');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Thất bại', e.message || 'Lỗi kết nối hệ thống, vui lòng thử lại.', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-primary" />
            Thêm Nhân viên mới
          </DialogTitle>
          <DialogDescription>
            Tạo tài khoản xác thực mới trên hệ thống Identity (Keycloak) và gán vai trò làm việc trong WMS.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* User Credentials & Info Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="create-username" className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Tên đăng nhập (Username) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-username"
                placeholder="Ví dụ: khoanv (chữ thường không dấu)"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="h-10"
              />
            </div>
            
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="create-password" className="flex items-center gap-1.5 text-sm font-medium">
                <Key className="h-3.5 w-3.5 text-muted-foreground" />
                Mật khẩu khởi tạo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-password"
                type="password"
                placeholder="Mật khẩu tài khoản (tối thiểu 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-2 col-span-2">
              <Label htmlFor="create-email" className="flex items-center gap-1.5 text-sm font-medium">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Địa chỉ Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-email"
                type="email"
                placeholder="Ví dụ: khoanv@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-lastname" className="text-sm font-medium">
                Họ (Last Name) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-lastname"
                placeholder="Ví dụ: Nguyễn Văn"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-firstname" className="text-sm font-medium">
                Tên (First Name) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-firstname"
                placeholder="Ví dụ: Khoa"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="border-t border-muted my-2" />

          {/* WMS Assignment Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="create-warehouse" className="flex items-center gap-1.5 text-sm font-medium">
                <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                Kho làm việc <span className="text-destructive">*</span>
              </Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger id="create-warehouse" className="h-10">
                  <SelectValue placeholder="Chọn kho..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      <div className="flex items-center gap-2">
                        <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                        {w.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-role" className="flex items-center gap-1.5 text-sm font-medium">
                <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                Vai trò gán <span className="text-destructive">*</span>
              </Label>
              <Select value={roleCode} onValueChange={setRoleCode}>
                <SelectTrigger id="create-role" className="h-10">
                  <SelectValue placeholder="Chọn vai trò..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      <div className="flex items-center gap-2">
                        <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                        {r.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !username || !password || !email || !firstName || !lastName || !roleCode || !warehouseId}
            className="bg-primary hover:bg-primary/90 font-semibold min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Đang tạo...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1.5" />
                Thêm nhân sự
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
