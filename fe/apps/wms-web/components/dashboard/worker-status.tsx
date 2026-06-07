"use client"

interface Worker {
  id: string
  name: string
  task: string
  orderId: string
  efficiency: number
  status: "active" | "idle" | "break"
}

const statusClasses = {
  active: "bg-green-500",
  idle: "bg-yellow-500",
  break: "bg-gray-400",
}

import { OperatorProductivityDto } from "@/lib/api/reports"

interface WorkerStatusProps {
  workers?: OperatorProductivityDto[];
}

export function WorkerStatus({ workers = [] }: WorkerStatusProps) {
  const mappedWorkers = workers.map(w => {
    const target = 10;
    const efficiency = target === 0 ? 0 : Math.round((w.completedTasksToday / target) * 100);
    
    let status: "active" | "idle" | "break" = "idle";
    if (w.pendingTasks > 0) {
      status = "active";
    } else if (w.completedTasksToday === 0) {
      status = "break";
    }

    return {
      id: w.operatorId.slice(0, 5),
      name: w.operatorId,
      task: w.pendingTasks > 0 ? `${w.pendingTasks} tác vụ chờ` : "Chờ việc",
      orderId: w.pendingTasks > 0 ? "Active" : "-",
      efficiency: efficiency,
      status: status
    }
  });

  const activeCount = mappedWorkers.filter(w => w.status === "active").length;
  const idleCount = mappedWorkers.filter(w => w.status === "idle").length;
  const breakCount = mappedWorkers.filter(w => w.status === "break").length;

  return (
    <div className="border border-border bg-white h-full">
      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Năng suất nhân viên</h3>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px]">
            <span className="h-2 w-2 bg-green-500"></span>
            <span className="text-muted-foreground">{activeCount} Active</span>
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="h-2 w-2 bg-yellow-500"></span>
            <span className="text-muted-foreground">{idleCount} Idle</span>
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="h-2 w-2 bg-gray-400"></span>
            <span className="text-muted-foreground">{breakCount} Break</span>
          </span>
        </div>
      </div>
      <div className="overflow-auto max-h-[200px]">
        <div className="grid grid-cols-2 gap-0">
          {mappedWorkers.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground col-span-2">Không có nhân sự ghi nhận</div>
          ) : (
            mappedWorkers.map((worker) => (
              <div
                key={worker.name}
                className="border-b border-r border-border/50 p-2 flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                    <span className={`h-2 w-2 shrink-0 ${statusClasses[worker.status]}`}></span>
                    <span className="text-xs font-semibold truncate">{worker.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{worker.id}</span>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {worker.task}
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1 bg-muted overflow-hidden">
                    <div
                      className={`h-full ${worker.efficiency >= 100 ? "bg-green-500" : worker.efficiency >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(worker.efficiency, 120)}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-mono">{worker.efficiency}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
