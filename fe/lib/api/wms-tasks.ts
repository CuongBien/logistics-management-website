import { PutawayTaskDto, ReplenishmentTaskDto, CycleCountTaskDto } from "@/types/wms-tasks";

// In-memory static database to persist modifications during the React session
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
    status: "Counted", // Counts submitted by scanner but awaiting supervisor decision
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

export async function getPutawayTasks(): Promise<PutawayTaskDto[]> {
  await delay(500);
  return [...mockPutawayTasks];
}

export async function getReplenishmentTasks(): Promise<ReplenishmentTaskDto[]> {
  await delay(500);
  return [...mockReplenishmentTasks];
}

export async function getCycleCountTasks(): Promise<CycleCountTaskDto[]> {
  await delay(500);
  return [...mockCycleCountTasks];
}

export async function generateReplenishment(): Promise<ReplenishmentTaskDto[]> {
  await delay(500);
  // Auto-generate replenishment tasks simulating algorithm trigger
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

export async function generateCycleCount(binCode: string, sku: string): Promise<CycleCountTaskDto> {
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

export async function approveCycleCount(id: string, notes: string): Promise<CycleCountTaskDto> {
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

export async function rejectCycleCount(id: string, notes: string): Promise<CycleCountTaskDto> {
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
