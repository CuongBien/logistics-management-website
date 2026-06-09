'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Activity,
  Layers,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { fetchApi } from '@/lib/api-client';
import { usePermissions } from '@/components/wms/rbac/usePermissions';
import { AccessDeniedMessage } from '@/components/wms/rbac/AccessDeniedMessage';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Skeleton } from '@repo/ui/components/skeleton';

interface AuditLogDto {
  id: string;
  logType: 'Activity' | 'Override';
  operatorId: string;
  operatorName: string;
  employeeCode?: string;
  taskType: string;
  taskId: string;
  sku: string;
  quantity: number;
  timestamp: string;
  details: string;
  originalBinCode?: string;
  actualBinCode?: string;
  reason?: string;
  durationSeconds?: number;
}

interface OperatorOption {
  operatorSub: string;
  fullName: string;
  employeeCode?: string;
}

export default function AuditLogsPage() {
  const { isWmsManager, loading: authLoading } = usePermissions();

  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [operators, setOperators] = useState<OperatorOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedLogType, setSelectedLogType] = useState<string>('all');
  const [selectedTaskType, setSelectedTaskType] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const loadOperators = async () => {
    try {
      const res = await fetch('/api/wms/users');
      if (res.ok) {
        const data = await res.json();
        setOperators(data || []);
      }
    } catch (e) {
      console.error('Failed to load operators for filtering', e);
    }
  };

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedOperator !== 'all') params.append('operatorId', selectedOperator);
      if (selectedLogType !== 'all') params.append('logType', selectedLogType);
      if (selectedTaskType !== 'all') params.append('taskType', selectedTaskType);
      if (fromDate) params.append('fromDate', new Date(fromDate).toISOString());
      if (toDate) params.append('toDate', new Date(toDate).toISOString());

      const res = await fetch(`/api/wms/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data?.value || data || []);
      } else {
        console.error('Failed to fetch audit logs', await res.text());
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [selectedOperator, selectedLogType, selectedTaskType, fromDate, toDate]);

  useEffect(() => {
    if (isWmsManager) {
      loadOperators();
      fetchAuditLogs();
    }
  }, [isWmsManager]);

  const handleResetFilters = () => {
    setSelectedOperator('all');
    setSelectedLogType('all');
    setSelectedTaskType('all');
    setFromDate('');
    setToDate('');
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isWmsManager) {
    return <AccessDeniedMessage />;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-[#C41E3A]" />
            Nhật Ký Audit & Ghi Đè Ô Kệ
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Giám sát toàn bộ nhật ký vận hành và các hành vi ghi đè ô kệ quét thực tế của nhân viên
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchAuditLogs} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800 rounded-xl">
        <CardHeader className="pb-3 pt-4 border-b border-muted/50">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-slate-500" />
            Bộ lọc nâng cao
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Operator Filter */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Nhân viên</label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhân viên</SelectItem>
                  {operators.map((op) => (
                    <SelectItem key={op.operatorSub} value={op.operatorSub}>
                      {op.fullName} {op.employeeCode ? `(${op.employeeCode})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Log Type Filter */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Loại logs</label>
              <Select value={selectedLogType} onValueChange={setSelectedLogType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại log</SelectItem>
                  <SelectItem value="Activity">Hoàn thành việc (Activity)</SelectItem>
                  <SelectItem value="Override">Ghi đè ô kệ (Override)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Task Type Filter */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Loại tác vụ</label>
              <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả tác vụ</SelectItem>
                  <SelectItem value="Putaway">Cất hàng (Putaway)</SelectItem>
                  <SelectItem value="Pick">Lấy hàng (Pick)</SelectItem>
                  <SelectItem value="Replenish">Di chuyển (Replenish)</SelectItem>
                  <SelectItem value="Count">Kiểm kho (Count)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Date */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Từ ngày</label>
              <Input
                type="date"
                className="h-9 text-xs"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            {/* To Date */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Đến ngày</label>
              <Input
                type="date"
                className="h-9 text-xs"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-muted/30 pt-3">
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={handleResetFilters}>
              Đặt lại bộ lọc
            </Button>
            <Button size="sm" className="h-8 text-xs bg-slate-800 text-white hover:bg-slate-700" onClick={fetchAuditLogs}>
              Áp dụng lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      {loading ? (
        <Card className="p-4 shadow-sm border-slate-200 rounded-xl space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-32 w-full" />
        </Card>
      ) : logs.length > 0 ? (
        <Card className="shadow-sm border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="font-semibold text-xs py-3 pl-4">Thời gian</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Nhân viên</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Phân loại</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Tác vụ</TableHead>
                  <TableHead className="font-semibold text-xs py-3">SKU & Qty</TableHead>
                  <TableHead className="font-semibold text-xs py-3">Nội dung chi tiết</TableHead>
                  <TableHead className="font-semibold text-xs py-3 pr-4">Thay đổi ô kệ (Ghi đè)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    {/* Timestamp */}
                    <TableCell className="text-xs text-muted-foreground font-mono pl-4">
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>

                    {/* Operator */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {log.operatorName}
                        </span>
                        {log.employeeCode && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            MSNV: {log.employeeCode}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Log Type */}
                    <TableCell>
                      {log.logType === 'Override' ? (
                        <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950/20 dark:text-red-400 border-red-200 text-[10px] font-semibold gap-1 py-0.5">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          GHI ĐÈ BIN
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 text-[10px] font-semibold gap-1 py-0.5">
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          HOẠT ĐỘNG
                        </Badge>
                      )}
                    </TableCell>

                    {/* Task Type */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold uppercase py-0.5 ${
                          log.taskType === 'Putaway'
                            ? 'border-emerald-200 text-emerald-700 bg-emerald-50/20'
                            : log.taskType === 'Pick'
                            ? 'border-blue-200 text-blue-700 bg-blue-50/20'
                            : log.taskType === 'Replenish'
                            ? 'border-purple-200 text-purple-700 bg-purple-50/20'
                            : 'border-amber-200 text-amber-700 bg-amber-50/20'
                        }`}
                      >
                        {log.taskType === 'Putaway'
                          ? 'Cất hàng'
                          : log.taskType === 'Pick'
                          ? 'Lấy hàng'
                          : log.taskType === 'Replenish'
                          ? 'Bồi hàng'
                          : 'Kiểm kho'}
                      </Badge>
                    </TableCell>

                    {/* SKU & Quantity */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          {log.sku}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          SL: <strong className="text-slate-800 dark:text-slate-200">{log.quantity}</strong>
                        </span>
                      </div>
                    </TableCell>

                    {/* Details */}
                    <TableCell className="text-xs max-w-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {log.details}
                    </TableCell>

                    {/* Override details */}
                    <TableCell className="pr-4">
                      {log.logType === 'Override' ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-muted-foreground text-[10px]">
                              {log.originalBinCode}
                            </span>
                            <ArrowRight className="h-3 w-3 text-red-500 shrink-0" />
                            <span className="font-mono bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/50 text-red-700 dark:text-red-400 px-1 rounded text-[10px] font-bold">
                              {log.actualBinCode}
                            </span>
                          </div>
                          {log.reason && (
                            <span className="text-[10px] text-red-600 dark:text-red-400 italic">
                              Lý do: {log.reason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs font-mono">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card className="shadow-sm border-slate-200 rounded-xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4">
              <Activity className="size-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold mb-1">Không tìm thấy nhật ký audit</h3>
            <p className="text-muted-foreground max-w-sm text-xs mb-4">
              Không tìm thấy bản ghi log nào khớp với điều kiện lọc hiện tại. Thử nới rộng phạm vi tìm kiếm của bạn.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Xóa bộ lọc
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
