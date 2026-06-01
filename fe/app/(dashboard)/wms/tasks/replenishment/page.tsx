"use client";

import { useEffect, useState } from "react";
import { 
  fetchReplenishmentTasks, 
  ReplenishmentTaskDto, 
  completeReplenishmentTask 
} from "@/lib/api/wms-tasks";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReplenishmentTasksPage() {
  const [tasks, setTasks] = useState<ReplenishmentTaskDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchReplenishmentTasks();
      setTasks(data);
    } catch (err) {
      toast.error("Failed to load replenishment tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleComplete = async (taskId: string) => {
    try {
      await completeReplenishmentTask(taskId);
      toast.success("Đã hoàn tất Replenishment");
      loadTasks();
    } catch (err: any) {
      toast.error(err?.body?.message || "Lỗi khi hoàn tất Replenishment");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Replenishment Tasks</h1>
        <Button onClick={loadTasks} variant="outline" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Số lượng</th>
              <th className="px-4 py-3 font-medium">Từ Bin</th>
              <th className="px-4 py-3 font-medium">Đến Bin</th>
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
                  <td className="px-4 py-3 font-medium">{task.sku}</td>
                  <td className="px-4 py-3">{task.quantity}</td>
                  <td className="px-4 py-3">{task.fromBinId}</td>
                  <td className="px-4 py-3">{task.toBinId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      task.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {format(new Date(task.createdAt), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    {task.status === 'Pending' && (
                      <Button size="sm" onClick={() => handleComplete(task.id)}>
                        Hoàn tất
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
