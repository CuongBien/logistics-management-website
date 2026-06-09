'use client';

import { useState, useEffect } from 'react';
import { OperatorDto } from '@/types/wms-rbac';
import { Avatar, AvatarFallback } from '@repo/ui/components/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@repo/ui/components/sheet';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Loader2, TrendingUp, CheckCircle2, Clock, ClipboardList, 
  Phone, Mail, User, ShieldAlert, CheckCircle, Hourglass, Play
} from 'lucide-react';

interface OperatorPerformanceDrawerProps {
  operator: OperatorDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PendingTask {
  taskId: string;
  taskType: string;
  sku: string;
  quantity: number;
  createdAt: string;
}

interface CompletedTaskLog {
  taskId: string;
  taskType: string;
  sku: string;
  quantity: number;
  completedAt: string;
  durationSeconds: number;
}

interface PerformanceData {
  operatorSub: string;
  totalCompleted: number;
  averageDurationSeconds: number;
  totalPending: number;
  pendingTasks: PendingTask[];
  recentCompletedTasks: CompletedTaskLog[];
  completedCountByType: Record<string, number>;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function OperatorPerformanceDrawer({ operator, open, onOpenChange }: OperatorPerformanceDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'history'>('ongoing');

  useEffect(() => {
    if (open && operator?.operatorSub) {
      setLoading(true);
      setData(null);
      
      const fetchPerformance = async () => {
        try {
          const res = await fetch(`/api/wms/users/performance?operatorSub=${operator.operatorSub}`);
          if (res.ok) {
            const result = await res.json();
            if (result.isSuccess && result.value) {
              setData(result.value);
            }
          }
        } catch (e) {
          console.error("Failed to fetch operator performance metrics", e);
        } finally {
          setLoading(false);
        }
      };

      fetchPerformance();
    }
  }, [open, operator]);

  if (!operator) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-[90%] overflow-y-auto flex flex-col h-full bg-card border-l border-muted p-0">
        {/* Header Section */}
        <SheetHeader className="p-6 pb-4 border-b border-muted bg-muted/20">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 shrink-0 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {getInitials(operator.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl font-bold flex items-center gap-2 flex-wrap">
                <span>{operator.fullName}</span>
                {operator.employeeCode && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 text-xs">
                    {operator.employeeCode}
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription className="text-sm font-mono text-muted-foreground mt-0.5">
                @{operator.username}
              </SheetDescription>
            </div>
          </div>

          {/* Contact Details */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 truncate">
              <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span>{operator.email}</span>
            </div>
            {operator.phone && (
              <div className="flex items-center gap-2 truncate">
                <Phone className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <span>{operator.phone}</span>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground text-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>Đang tải số liệu hiệu suất...</span>
          </div>
        ) : data ? (
          <div className="flex-1 p-6 space-y-6 flex flex-col overflow-hidden">
            {/* Metrics cards grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/30 border border-muted rounded-xl p-3 text-center flex flex-col items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-1.5" />
                <span className="text-xl font-extrabold text-foreground">{data.totalCompleted}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">Đã hoàn thành</span>
              </div>
              <div className="bg-muted/30 border border-muted rounded-xl p-3 text-center flex flex-col items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500 mb-1.5" />
                <span className="text-xl font-extrabold text-foreground">{formatDuration(data.averageDurationSeconds)}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">Thời gian TB</span>
              </div>
              <div className="bg-muted/30 border border-muted rounded-xl p-3 text-center flex flex-col items-center justify-center">
                <Hourglass className="h-5 w-5 text-amber-500 mb-1.5" />
                <span className="text-xl font-extrabold text-foreground">{data.totalPending}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">Đang thực hiện</span>
              </div>
            </div>

            {/* Task Type Breakdown */}
            <div className="space-y-2 bg-muted/10 border border-muted/50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Phân loại tác vụ đã làm
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {['Putaway', 'Pick', 'Replenish', 'Count'].map((type) => {
                  const count = data.completedCountByType[type] || 0;
                  return (
                    <div key={type} className="bg-card border border-muted/65 rounded-lg p-2 flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-medium">{type}</span>
                      <span className="text-sm font-bold text-foreground mt-0.5">{count} tác vụ</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex border-b border-muted shrink-0 mb-3">
                <button
                  className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === 'ongoing'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('ongoing')}
                >
                  Đang làm ({data.totalPending})
                </button>
                <button
                  className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                    activeTab === 'history'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('history')}
                >
                  Lịch sử gần đây ({data.recentCompletedTasks.length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto pr-1">
                {activeTab === 'ongoing' ? (
                  data.pendingTasks.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground/60 text-xs">
                      <Hourglass className="h-8 w-8 text-muted-foreground/30" />
                      <span>Không có công việc nào đang chờ xử lý.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.pendingTasks.map((task, i) => (
                        <div
                          key={task.taskId || i}
                          className="flex items-center justify-between p-3 rounded-xl border border-muted bg-card hover:bg-muted/10 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-bold text-[10px] bg-amber-500/5 text-amber-600 border-amber-500/20 px-1.5 py-0">
                                {task.taskType}
                              </Badge>
                              <span className="text-xs font-bold text-foreground font-mono truncate">{task.sku}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              Được giao: {formatDate(task.createdAt)}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold text-foreground">SL: {task.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  data.recentCompletedTasks.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground/60 text-xs">
                      <CheckCircle className="h-8 w-8 text-muted-foreground/30" />
                      <span>Chưa có tác vụ nào được lưu trong nhật ký hoạt động.</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {data.recentCompletedTasks.map((log, i) => (
                        <div
                          key={log.taskId || i}
                          className="flex items-center justify-between p-3 rounded-xl border border-muted bg-card hover:bg-muted/10 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-bold text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-1.5 py-0">
                                {log.taskType}
                              </Badge>
                              <span className="text-xs font-bold text-foreground font-mono truncate">{log.sku}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              Hoàn thành: {formatDate(log.completedAt)}
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className="text-xs font-extrabold text-foreground">SL: {log.quantity}</span>
                            <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5 shrink-0" />
                              {formatDuration(log.durationSeconds)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground text-sm">
            <ShieldAlert className="h-8 w-8 text-destructive/50" />
            <span>Không thể tải dữ liệu hiệu suất của nhân viên này.</span>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
