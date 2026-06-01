import { PutawayTaskDto, ReplenishmentTaskDto, CycleCountTaskDto } from "@/types/wms-tasks";
import { fetchApi } from "@/lib/api-client"; // Standard API Client with JWT Auth and Next.js proxy rewrite support

// ============================================================================
// DUAL-MODE API STRATEGY (MOCK VS REAL DATABASE CONNECTION)
// ============================================================================
// - Set USE_MOCK to 'true' to use high-fidelity mock data (prevents blank pages when DB is empty).
// - Set USE_MOCK to 'false' to pull real tasks directly from the WMS Postgres Database in Docker!
// ============================================================================
const USE_MOCK = false; 

// In-memory static database to persist modifications during the React session (when in Mock mode)
let mockPutawayTasks: PutawayTaskDto[] = [
  {
    id: "PT-TASK-001",
    sku: "IPHONE15PM",
    quantity: 10,
    sourceBinCode: "ST-RCV-01",
    suggestedBinCode: "ST-ELEC-22",
    status: "InProgress",
    operatorName: "Nguyễn Văn Khoa",
    createdAt: "2026-05-30T08:00:00Z"
  },
  {
    id: "PT-TASK-002",
    sku: "BIMTA-HUG-M",
    quantity: 50,
    sourceBinCode: "ST-RCV-02",
    suggestedBinCode: "ST-BABY-05",
    status: "Pending",
    operatorName: "Trần Thị Vân",
    createdAt: "2026-05-30T09:15:00Z"
  },
  {
    id: "PT-TASK-003",
    sku: "DAUAN-SIMPLY-1L",
    quantity: 100,
    sourceBinCode: "ST-RCV-01",
    suggestedBinCode: "ST-GROC-12",
    status: "Completed",
    operatorName: "Lê Văn Nam",
    createdAt: "2026-05-29T14:00:00Z",
    completedAt: "2026-05-29T15:22:00Z"
  }
];

let mockReplenishmentTasks: ReplenishmentTaskDto[] = [
  {
    id: "RP-TASK-001",
    sku: "IPHONE15PM",
    quantity: 20,
    fromBinCode: "DS-ELEC-01",
    toBinCode: "PK-ELEC-01",
    status: "InProgress",
    operatorName: "Lê Văn Nam",
    createdAt: "2026-05-30T08:30:00Z"
  },
  {
    id: "RP-TASK-002",
    sku: "DAUAN-SIMPLY-1L",
    quantity: 80,
    fromBinCode: "DS-GROC-03",
    toBinCode: "PK-GROC-01",
    status: "Completed",
    operatorName: "Nguyễn Văn Khoa",
    createdAt: "2026-05-29T11:00:00Z",
    completedAt: "2026-05-29T12:10:00Z"
  }
];

let mockCycleCountTasks: CycleCountTaskDto[] = [
  {
    id: "CC-TASK-001",
    binCode: "ST-ELEC-22",
    sku: "IPHONE15PM",
    expectedQty: 45,
    countedQty: 45,
    status: "Approved",
    operatorName: "Nguyễn Văn Khoa",
    completedAt: "2026-05-30T07:45:00Z",
    notes: "Không phát hiện sai lệch thực tế.",
    supervisorNotes: "Đã duyệt - Số liệu trùng khớp hoàn hảo."
  },
  {
    id: "CC-TASK-002",
    binCode: "ST-BABY-05",
    sku: "BIMTA-HUG-M",
    expectedQty: 120,
    countedQty: 118,
    status: "Counted", 
    operatorName: "Trần Thị Vân",
    completedAt: "2026-05-30T09:30:00Z",
    notes: "Phát hiện rách bao bì 2 bịch do cọ xát thành sắt ô kệ."
  },
  {
    id: "CC-TASK-003",
    binCode: "ST-GROC-12",
    sku: "DAUAN-SIMPLY-1L",
    expectedQty: 300,
    status: "Pending"
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ----------------------------------------------------------------------------
// 1. GET ALL PUTAWAY TASKS
// ----------------------------------------------------------------------------
export async function getPutawayTasks(): Promise<PutawayTaskDto[]> {
  if (USE_MOCK) {
    await delay(400);
    return [...mockPutawayTasks];
  }
  
  return await fetchApi<PutawayTaskDto[]>("wms", "/inbound/putaway-tasks");
}

export async function fetchPutawayTasks(): Promise<PutawayTaskDto[]> {
  return await getPutawayTasks();
}

export async function completePutawayTask(taskId: string, scannedDestinationBinCode: string): Promise<void> {
  if (USE_MOCK) {
    await delay(400);
    const index = mockPutawayTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      mockPutawayTasks[index].status = "Completed";
      mockPutawayTasks[index].completedAt = new Date().toISOString();
    }
    return;
  }

  await fetchApi('wms', `/inbound/putaway-tasks/${taskId}/complete`, {
    method: 'POST',
    body: { scannedDestinationBinCode }
  });
}

// ----------------------------------------------------------------------------
// 2. GET ALL REPLENISHMENT TASKS
// ----------------------------------------------------------------------------
export async function getReplenishmentTasks(): Promise<ReplenishmentTaskDto[]> {
  if (USE_MOCK) {
    await delay(400);
    return [...mockReplenishmentTasks];
  }
  
  return await fetchApi<ReplenishmentTaskDto[]>("wms", "/inventory/tasks/replenish");
}

export async function fetchReplenishmentTasks(): Promise<ReplenishmentTaskDto[]> {
  return await getReplenishmentTasks();
}

export async function completeReplenishmentTask(taskId: string): Promise<void> {
  if (USE_MOCK) {
    await delay(400);
    const index = mockReplenishmentTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      mockReplenishmentTasks[index].status = "Completed";
      mockReplenishmentTasks[index].completedAt = new Date().toISOString();
    }
    return;
  }

  await fetchApi('wms', `/inventory/tasks/replenish/${taskId}/complete`, {
    method: 'POST'
  });
}

// ----------------------------------------------------------------------------
// 3. GET ALL CYCLE COUNT TASKS
// ----------------------------------------------------------------------------
export async function getCycleCountTasks(): Promise<CycleCountTaskDto[]> {
  if (USE_MOCK) {
    await delay(400);
    return [...mockCycleCountTasks];
  }
  
  return await fetchApi<CycleCountTaskDto[]>("wms", "/inventory/tasks/cycle-count");
}

export async function fetchCycleCountTasks(): Promise<CycleCountTaskDto[]> {
  return await getCycleCountTasks();
}

export async function submitCycleCount(taskId: string, countedQty: number): Promise<void> {
  if (USE_MOCK) {
    await delay(400);
    const index = mockCycleCountTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      mockCycleCountTasks[index].status = "Counted";
      mockCycleCountTasks[index].countedQty = countedQty;
      mockCycleCountTasks[index].completedAt = new Date().toISOString();
    }
    return;
  }

  await fetchApi('wms', `/inventory/tasks/cycle-count/${taskId}/submit`, {
    method: 'POST',
    body: { countedQty }
  });
}

// ----------------------------------------------------------------------------
// 4. TRIGGER REPLENISHMENT ALGORITHM
// ----------------------------------------------------------------------------
export async function generateReplenishment(): Promise<ReplenishmentTaskDto[]> {
  if (USE_MOCK) {
    await delay(600);
    const newTasks: ReplenishmentTaskDto[] = [
      {
        id: `RP-TASK-00${mockReplenishmentTasks.length + 1}`,
        sku: "BIMTA-HUG-M",
        quantity: 40,
        fromBinCode: "DS-BABY-02",
        toBinCode: "PK-BABY-01",
        status: "Pending",
        operatorName: "Trần Thị Vân",
        createdAt: new Date().toISOString()
      },
      {
        id: `RP-TASK-00${mockReplenishmentTasks.length + 2}`,
        sku: "DAUAN-SIMPLY-1L",
        quantity: 120,
        fromBinCode: "DS-GROC-05",
        toBinCode: "PK-GROC-01",
        status: "Pending",
        operatorName: "Nguyễn Văn Khoa",
        createdAt: new Date().toISOString()
      }
    ];
    mockReplenishmentTasks = [...newTasks, ...mockReplenishmentTasks];
    return mockReplenishmentTasks;
  }
  
  const defaultWarehouseId = "a0d33e7c-eb5a-4b08-9df2-5d46487e411b"; // Active South ATL-01
  return await fetchApi<ReplenishmentTaskDto[]>("wms", `/inventory/tasks/replenish/generate?tenantId=default-tenant&warehouseId=${defaultWarehouseId}`, {
    method: "POST"
  });
}

// ----------------------------------------------------------------------------
// 5. GENERATE AUTO-CYCLE COUNT TASK
// ----------------------------------------------------------------------------
export async function generateCycleCount(binCode: string, sku: string): Promise<CycleCountTaskDto> {
  if (USE_MOCK) {
    await delay(500);
    const newTask: CycleCountTaskDto = {
      id: `CC-TASK-00${mockCycleCountTasks.length + 1}`,
      binCode,
      sku,
      expectedQty: Math.floor(Math.random() * 200) + 10,
      status: "Pending"
    };
    mockCycleCountTasks = [newTask, ...mockCycleCountTasks];
    return newTask;
  }
  
  const defaultWarehouseId = "a0d33e7c-eb5a-4b08-9df2-5d46487e411b";
  return await fetchApi<CycleCountTaskDto>("wms", `/inventory/tasks/cycle-count/generate?tenantId=default-tenant&warehouseId=${defaultWarehouseId}&maxTasks=1`, {
    method: "POST"
  });
}

// ----------------------------------------------------------------------------
// 6. APPROVE CYCLE COUNT DISCREPANCY
// ----------------------------------------------------------------------------
export async function approveCycleCount(id: string, notes?: string): Promise<CycleCountTaskDto | void> {
  if (USE_MOCK) {
    await delay(500);
    const index = mockCycleCountTasks.findIndex((task) => task.id === id);
    if (index === -1) throw new Error("Cycle count task not found");
    mockCycleCountTasks[index] = {
      ...mockCycleCountTasks[index],
      status: "Approved",
      supervisorNotes: notes || "Phê duyệt điều chỉnh tồn kho vật lý"
    };
    return mockCycleCountTasks[index];
  }
  
  await fetchApi("wms", `/inventory/tasks/cycle-count/${id}/approve`, {
    method: "POST",
    body: { notes: notes || "Phê duyệt" }
  });
}

// ----------------------------------------------------------------------------
// 7. REJECT CYCLE COUNT DISCREPANCY
// ----------------------------------------------------------------------------
export async function rejectCycleCount(id: string, notes: string): Promise<CycleCountTaskDto> {
  if (USE_MOCK) {
    await delay(500);
    const index = mockCycleCountTasks.findIndex((task) => task.id === id);
    if (index === -1) throw new Error("Cycle count task not found");
    mockCycleCountTasks[index] = {
      ...mockCycleCountTasks[index],
      status: "Rejected",
      supervisorNotes: notes || "Không đồng ý điều chỉnh số liệu"
    };
    return mockCycleCountTasks[index];
  }
  
  return await fetchApi<CycleCountTaskDto>("wms", `/inventory/tasks/cycle-count/${id}/reject`, {
    method: "POST",
    body: { notes }
  });
}
