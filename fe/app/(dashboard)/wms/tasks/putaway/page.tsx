"use client";

import { useEffect, useState } from "react";
import { 
  fetchPutawayTasks, 
  PutawayTaskDto, 
  completePutawayTask 
} from "@/lib/api/wms-tasks";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function PutawayTasksPage() {
  const [tasks, setTasks] = useState<PutawayTaskDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannedBin, setScannedBin] = useState("");

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await fetchPutawayTasks();
      setTasks(data);
    } catch (err) {
      toast.error("Failed to load putaway tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleComplete = async (taskId: string, suggestedBin: string) => {
    const binToUse = scannedBin || suggestedBin;
    if (!binToUse) {
      toast.error("Vui lòng nhập/quét mã Bin đích (hoặc dùng Suggested Bin)");
      return;
    }
    try {
      await completePutawayTask(taskId, binToUse);
      toast.success("Đã hoàn tất Putaway");
      setScannedBin("");
      loadTasks();
    } catch (err: any) {
      toast.error(err?.body?.message || "Lỗi khi hoàn tất Putaway");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Putaway Tasks</h1>
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
              <th className="px-4 py-3 font-medium">Nguồn (Bin)</th>
              <th className="px-4 py-3 font-medium">Gợi ý (Bin)</th>
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
                  <td className="px-4 py-3">{task.sourceBinId}</td>
                  <td className="px-4 py-3">{task.suggestedBinId}</td>
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
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Scan Bin..." 
                          className="w-32 h-8 text-xs" 
                          value={scannedBin}
                          onChange={e => setScannedBin(e.target.value)}
                        />
                        <Button size="sm" onClick={() => handleComplete(task.id, task.suggestedBinId)}>
                          Xong
                        </Button>
                      </div>
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
