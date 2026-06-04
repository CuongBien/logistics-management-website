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

export function WorkerStatus() {
  const workers: Worker[] = []

  return (
    <div className="border border-border bg-white">
      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Worker Status</h3>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px]">
            <span className="h-2 w-2 bg-green-500"></span>
            <span className="text-muted-foreground">8 Active</span>
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="h-2 w-2 bg-yellow-500"></span>
            <span className="text-muted-foreground">1 Idle</span>
          </span>
          <span className="flex items-center gap-1 text-[10px]">
            <span className="h-2 w-2 bg-gray-400"></span>
            <span className="text-muted-foreground">1 Break</span>
          </span>
        </div>
      </div>
      <div className="overflow-auto max-h-[200px]">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-0">
          {workers.map((worker) => (
            <div
              key={worker.id}
              className="border-b border-r border-border/50 p-2 flex flex-col gap-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 ${statusClasses[worker.status]}`}></span>
                  <span className="text-xs font-medium">{worker.name}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{worker.id}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {worker.task} {worker.orderId !== "-" && <span className="text-blue-600">{worker.orderId}</span>}
              </div>
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1 bg-muted overflow-hidden">
                  <div
                    className={`h-full ${worker.efficiency >= 100 ? "bg-green-500" : worker.efficiency >= 90 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(worker.efficiency, 120)}%` }}
                  ></div>
                </div>
                <span className="text-[9px] font-mono">{worker.efficiency}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
