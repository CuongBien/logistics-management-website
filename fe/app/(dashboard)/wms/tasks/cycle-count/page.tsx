"use client";

import { useEffect, useState } from "react";
import { 
  fetchCycleCountTasks, 
  CycleCountTaskDto, 
  submitCycleCount,
  approveCycleCount
} from "@/lib/api/wms-tasks";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CycleCountTasksPage() {
  const [tasks, setTasks] = useState<CycleCountTaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<string, string>>({});

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchCycleCountTasks();
      setTasks(data);
    } catch (err) {
      toast.error("Failed to load cycle count tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleSubmitCount = async (taskId: string) => {
    const qty = parseInt(counts[taskId] || "0", 10);
    if (isNaN(qty) || qty < 0) {
      toast.error("Vui lòng nhập số lượng hợp lệ");
      return;
    }
    try {
      await submitCycleCount(taskId, qty);
      toast.success("Đã ghi nhận số lượng đếm");
      loadTasks();
    } catch (err: any) {
      toast.error(err?.body?.message || "Lỗi khi gửi kết quả kiểm đếm");
    }
  };

  const handleApprove = async (taskId: string) => {
    try {
      await approveCycleCount(taskId);
      toast.success("Đã duyệt điều chỉnh tồn kho");
      loadTasks();
    } catch (err: any) {
      toast.error(err?.body?.message || "Lỗi khi duyệt");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Cycle Count Tasks</h1>
        <Button onClick={loadTasks} variant="outline" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Bin</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">SL mong đợi</th>
              <th className="px-4 py-3 font-medium">SL thực đếm</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{task.binId}</td>
                  <td className="px-4 py-3">{task.sku}</td>
                  <td className="px-4 py-3">{task.expectedQty}</td>
                  <td className="px-4 py-3">
                    {task.status === 'Pending' ? (
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Nhập SL..." 
                        className="w-24 h-8 text-xs" 
                        value={counts[task.id] || ""}
                        onChange={e => setCounts(prev => ({ ...prev, [task.id]: e.target.value }))}
                      />
                    ) : (
                      task.countedQty
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'Adjusted' ? 'bg-green-100 text-green-700' :
                      task.status === 'Counted' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {format(new Date(task.createdAt), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    {task.status === 'Pending' && (
                      <Button size="sm" onClick={() => handleSubmitCount(task.id)}>
                        Submit
                      </Button>
                    )}
                    {task.status === 'Counted' && (
                      <Button size="sm" variant="default" onClick={() => handleApprove(task.id)}>
                        Approve
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
