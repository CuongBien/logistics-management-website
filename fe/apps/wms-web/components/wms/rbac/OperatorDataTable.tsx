'use client';

import { useState } from 'react';
import { OperatorDto } from '@/types/wms-rbac';
import { AssignRoleDialog } from './AssignRoleDialog';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import {
  ShieldPlus, ShieldCheck, ShieldAlert, Warehouse, Crown, Package, ScanLine, ClipboardList, UserCog, Edit2, Trash2
} from 'lucide-react';
import { EditStaffDialog } from './EditStaffDialog';
import { toast as sonnerToast } from 'sonner';

interface OperatorDataTableProps {
  data: OperatorDto[];
  onRoleAssigned: () => void;
}

// Map role codes/names to colors and icons for visual distinction
const roleStyleMap: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  'wms-admin': {
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
    icon: <Crown className="h-3 w-3 mr-1" />,
  },
  'wms-manager': {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20',
    icon: <UserCog className="h-3 w-3 mr-1" />,
  },
  'wms-picker': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    icon: <ScanLine className="h-3 w-3 mr-1" />,
  },
  'wms-packer': {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    icon: <Package className="h-3 w-3 mr-1" />,
  },
  'wms-receiver': {
    bg: 'bg-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/20',
    icon: <ClipboardList className="h-3 w-3 mr-1" />,
  },
};

const defaultRoleStyle = {
  bg: 'bg-zinc-500/10',
  text: 'text-zinc-600 dark:text-zinc-400',
  border: 'border-zinc-500/20',
  icon: <ShieldCheck className="h-3 w-3 mr-1" />,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const avatarColors = [
  'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600',
  'bg-amber-600', 'bg-teal-600', 'bg-indigo-600', 'bg-pink-600',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getRoleStyle(roleName: string) {
  const key = roleName.toLowerCase().replace(/\s+/g, '-');
  return roleStyleMap[key] || defaultRoleStyle;
}

export function OperatorDataTable({ data, onRoleAssigned }: OperatorDataTableProps) {
  const [selectedOperator, setSelectedOperator] = useState<OperatorDto | null>(null);
  const [editingOperator, setEditingOperator] = useState<OperatorDto | null>(null);

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}" khỏi toàn hệ thống (bao gồm tài khoản Identity Keycloak)? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/wms/users?id=${id}&deleteUser=true`, {
        method: 'DELETE'
      });
      if (res.ok) {
        sonnerToast.success(`Xóa nhân viên "${name}" thành công.`);
        onRoleAssigned();
      } else {
        const err = await res.json();
        sonnerToast.error(err.details || err.error || "Không thể xóa nhân viên.");
      }
    } catch (e: any) {
      console.error(e);
      sonnerToast.error(`Lỗi hệ thống: ${e.message}`);
    }
  };

  return (
    <TooltipProvider>
      <div className="bg-card rounded-xl border border-muted overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="font-bold w-[280px]">Nhân viên</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="font-bold">Phân quyền hiện tại</TableHead>
              <TableHead className="font-bold text-right w-[260px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <ShieldAlert className="h-10 w-10 text-muted-foreground/50" />
                    <span className="text-muted-foreground text-sm">
                      Không tìm thấy nhân viên nào phù hợp với bộ lọc.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((op) => (
                <TableRow key={op.operatorSub} className="hover:bg-muted/15 transition-colors group">
                  {/* Name + Avatar + Username */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback
                          className={`${getAvatarColor(op.fullName)} text-white text-xs font-bold`}
                        >
                          {getInitials(op.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {op.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          @{op.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-muted-foreground text-sm">
                    {op.email}
                  </TableCell>

                  {/* Roles */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {op.roles.length === 0 ? (
                        <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 font-medium px-2 py-0.5">
                          <ShieldAlert className="h-3 w-3 mr-1 text-zinc-400" />
                          Chưa có quyền
                        </Badge>
                      ) : (
                        op.roles.map((r, i) => {
                          const style = getRoleStyle(r.roleName);
                          return (
                            <Tooltip key={i}>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className={`${style.bg} ${style.text} ${style.border} font-semibold px-2 py-0.5 cursor-default`}
                                >
                                  {style.icon}
                                  {r.roleName}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  <Warehouse className="h-3 w-3" />
                                  <span>Kho: {r.warehouseName}</span>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })
                      )}
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOperator(op)}
                        className="h-8 text-primary hover:bg-primary/10 font-medium opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        <ShieldPlus className="h-3.5 w-3.5" />
                        Phân quyền
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingOperator(op)}
                        className="h-8 text-amber-600 hover:bg-amber-600/10 font-medium opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(op.operatorSub, op.fullName)}
                        className="h-8 text-rose-600 hover:bg-rose-600/10 font-medium opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {selectedOperator && (
          <AssignRoleDialog
            operator={selectedOperator}
            open={!!selectedOperator}
            onOpenChange={(open) => !open && setSelectedOperator(null)}
            onSuccess={() => {
              setSelectedOperator(null);
              onRoleAssigned();
            }}
          />
        )}

        {editingOperator && (
          <EditStaffDialog
            operator={editingOperator}
            open={!!editingOperator}
            onOpenChange={(open) => !open && setEditingOperator(null)}
            onSuccess={() => {
              setEditingOperator(null);
              onRoleAssigned();
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
