import { CrossDockTaskDto } from "@/types/wms-crossdock";

// Mock Database for Cross-Docking Tasks
const mockCrossDockTasks: CrossDockTaskDto[] = [
  {
    id: "CD-TASK-001",
    tenantId: "tenant-shopee",
    inboundReceiptId: "RCP-2026-0012",
    outboundOrderId: "OUT-2026-0001",
    sku: "IPHONE15-PRO-256",
    quantity: 20,
    inboundStagingBinId: "bin-rcv-01",
    inboundStagingBinCode: "ST-RCV-01",
    outboundStagingBinId: "bin-out-01",
    outboundStagingBinCode: "ST-OUT-01",
    status: "Pending",
  },
  {
    id: "CD-TASK-002",
    tenantId: "tenant-shopee",
    inboundReceiptId: "RCP-2026-0012",
    outboundOrderId: "OUT-2026-0001",
    sku: "MACBOOK-M3-16GB",
    quantity: 5,
    inboundStagingBinId: "bin-rcv-01",
    inboundStagingBinCode: "ST-RCV-01",
    outboundStagingBinId: "bin-out-02",
    outboundStagingBinCode: "ST-OUT-02",
    status: "Completed",
    operatorId: "op-driver-221",
    completedAt: "2026-05-29T10:00:00Z",
  },
  {
    id: "CD-TASK-003",
    tenantId: "tenant-lazada",
    inboundReceiptId: "RCP-2026-0015",
    outboundOrderId: "OUT-2026-0002",
    sku: "SAM-S24-ULTRA",
    quantity: 15,
    inboundStagingBinId: "bin-rcv-02",
    inboundStagingBinCode: "ST-RCV-02",
    outboundStagingBinId: "bin-out-01",
    outboundStagingBinCode: "ST-OUT-01",
    status: "Pending",
  },
  {
    id: "CD-TASK-004",
    tenantId: "tenant-shopee",
    inboundReceiptId: "RCP-2026-0018",
    outboundOrderId: "OUT-2026-0004",
    sku: "SONY-WH1000XM5",
    quantity: 8,
    inboundStagingBinId: "bin-rcv-03",
    inboundStagingBinCode: "ST-RCV-03",
    outboundStagingBinId: "bin-out-03",
    outboundStagingBinCode: "ST-OUT-03",
    status: "Completed",
    operatorId: "op-driver-104",
    completedAt: "2026-05-29T14:30:00Z",
  },
  {
    id: "CD-TASK-005",
    tenantId: "tenant-tiktok",
    inboundReceiptId: "RCP-2026-0019",
    outboundOrderId: "OUT-2026-0003",
    sku: "AIRPODS-PRO-2",
    quantity: 10,
    inboundStagingBinId: "bin-rcv-04",
    inboundStagingBinCode: "ST-RCV-04",
    outboundStagingBinId: "bin-out-02",
    outboundStagingBinCode: "ST-OUT-02",
    status: "Failed",
    operatorId: "op-driver-205",
    completedAt: "2026-05-28T16:15:00Z",
  }
];

// Asynchronous mock function representing GET API call with network lag
export async function getCrossDockTasks(): Promise<CrossDockTaskDto[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [...mockCrossDockTasks];
}
