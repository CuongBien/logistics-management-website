import { useState } from 'react';
import { OperatorDto, RoleName } from '@/types/wms-rbac';
import { AssignRoleDialog } from './AssignRoleDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OperatorDataTableProps {
  data: OperatorDto[];
  onRoleAssigned: () => void;
}

export function OperatorDataTable({ data, onRoleAssigned }: OperatorDataTableProps) {
  const [selectedOperator, setSelectedOperator] = useState<OperatorDto | null>(null);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên nhân viên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Username (Sub)</TableHead>
            <TableHead>Phân quyền (Kho - Vai trò)</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Không có dữ liệu.
              </TableCell>
            </TableRow>
          ) : (
            data.map((op) => (
              <TableRow key={op.operatorSub}>
                <TableCell className="font-medium">{op.fullName}</TableCell>
                <TableCell>{op.email}</TableCell>
                <TableCell className="text-muted-foreground">{op.username}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {op.roles.map((r, i) => (
                      <Badge key={i} variant="secondary">
                        {r.roleName} (Kho: {r.warehouseId.split('-')[0]})
                      </Badge>
                    ))}
                    {op.roles.length === 0 && <span className="text-muted-foreground text-sm">Chưa có quyền</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setSelectedOperator(op)}>
                    Phân quyền
                  </Button>
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
    </div>
  );
}
