import { OutboundOrderDto, OutboundOrderStatus, OutboundOrderTimelineDto, OutboundReturnDto, WaveDto } from '@/types/wms-outbound';


// Mocked database for Outbound Orders
let mockOrdersDb: OutboundOrderDto[] = [
  {
    id: 'out-1',
    orderNo: 'OUT-2026-0001',
    tenantId: 'tenant-shopee',
    status: 'New',
    createdAt: '2026-05-29T10:00:00Z',
    lines: [
      { id: 'oline-1-1', sku: 'IPHONE15-PRO-256', quantity: 20 },
      { id: 'oline-1-2', sku: 'MACBOOK-M3-16GB', quantity: 5 },
    ]
  },
  {
    id: 'out-2',
    orderNo: 'OUT-2026-0002',
    tenantId: 'tenant-lazada',
    status: 'Allocated',
    createdAt: '2026-05-28T14:30:00Z',
    lines: [
      { id: 'oline-2-1', sku: 'SAM-S24-ULTRA', quantity: 15 },
    ]
  },
  {
    id: 'out-3',
    orderNo: 'OUT-2026-0003',
    tenantId: 'tenant-tiktok',
    status: 'Picking',
    createdAt: '2026-05-29T08:15:00Z',
    lines: [
      { id: 'oline-3-1', sku: 'AIRPODS-PRO-2', quantity: 50 },
      { id: 'oline-3-2', sku: 'LOGITECH-MX-KEYS', quantity: 30 },
    ]
  },
  {
    id: 'out-4',
    orderNo: 'OUT-2026-0004',
    tenantId: 'tenant-shopee',
    status: 'Packed',
    createdAt: '2026-05-27T09:00:00Z',
    lines: [
      { id: 'oline-4-1', sku: 'SONY-WH1000XM5', quantity: 8 },
    ]
  },
  {
    id: 'out-5',
    orderNo: 'OUT-2026-0005',
    tenantId: 'tenant-lazada',
    status: 'Shipped',
    createdAt: '2026-05-28T16:00:00Z',
    lines: [
      { id: 'oline-5-1', sku: 'NINTENDO-SWITCH-OLED', quantity: 12 },
    ]
  }
];

// Mocked database for Tracking Timelines
let mockTimelinesDb: Record<string, OutboundOrderTimelineDto[]> = {
  'out-1': [
    { id: 'tl-1-1', status: 'New', occurredAt: '2026-05-29T10:00:00Z', notes: 'Đơn hàng xuất mới tiếp nhận từ hệ thống ERP.', operatorId: 'system' }
  ],
  'out-2': [
    { id: 'tl-2-1', status: 'New', occurredAt: '2026-05-28T14:30:00Z', notes: 'Đơn hàng xuất mới tiếp nhận.', operatorId: 'system' },
    { id: 'tl-2-2', status: 'Allocating', occurredAt: '2026-05-28T14:35:00Z', notes: 'Đang chạy thuật toán kiểm tra tồn kho.', operatorId: 'system' },
    { id: 'tl-2-3', status: 'Allocated', occurredAt: '2026-05-28T14:40:00Z', notes: 'Đã hoàn tất giữ hàng 15 máy SAM-S24-ULTRA tại kệ ST-B-01.', operatorId: 'user-admin' }
  ],
  'out-3': [
    { id: 'tl-3-1', status: 'New', occurredAt: '2026-05-29T08:15:00Z', notes: 'Đơn hàng xuất mới tiếp nhận.', operatorId: 'system' },
    { id: 'tl-3-2', status: 'Allocated', occurredAt: '2026-05-29T08:20:00Z', notes: 'Cấp phát tồn kho khả dụng thành công.', operatorId: 'system' },
    { id: 'tl-3-3', status: 'AwaitingPick', occurredAt: '2026-05-29T08:30:00Z', notes: 'Lệnh lấy hàng đang nằm trong Wave Plan đợt gom hàng.', operatorId: 'user-admin' },
    { id: 'tl-3-4', status: 'Picking', occurredAt: '2026-05-29T09:00:00Z', notes: 'Nhân viên Nguyễn Văn A đang thực hiện lấy hàng tại các ô kệ ST-B-02.', operatorId: 'user-operator1' }
  ],
  'out-4': [
    { id: 'tl-4-1', status: 'New', occurredAt: '2026-05-27T09:00:00Z', notes: 'Tiếp nhận đơn xuất.', operatorId: 'system' },
    { id: 'tl-4-2', status: 'Allocated', occurredAt: '2026-05-27T09:10:00Z', notes: 'Cấp phát thành công.', operatorId: 'system' },
    { id: 'tl-4-3', status: 'Picked', occurredAt: '2026-05-27T10:30:00Z', notes: 'Hoàn tất Picking. Hàng được đưa về trạm đóng gói Put-To-Wall.', operatorId: 'user-operator2' },
    { id: 'tl-4-4', status: 'Packing', occurredAt: '2026-05-27T10:45:00Z', notes: 'Đang thực hiện phân chia ô chia chọn.', operatorId: 'user-operator3' },
    { id: 'tl-4-5', status: 'Packed', occurredAt: '2026-05-27T11:00:00Z', notes: 'Đóng thùng thành công. In vận đơn dán lên kiện hàng.', operatorId: 'user-operator3' }
  ],
  'out-5': [
    { id: 'tl-5-1', status: 'New', occurredAt: '2026-05-28T16:00:00Z', notes: 'Tiếp nhận đơn.', operatorId: 'system' },
    { id: 'tl-5-2', status: 'Allocated', occurredAt: '2026-05-28T16:10:00Z', notes: 'Giữ hàng thành công.', operatorId: 'system' },
    { id: 'tl-5-3', status: 'Picked', occurredAt: '2026-05-28T17:00:00Z', notes: 'Hoàn thành lấy hàng.', operatorId: 'user-operator1' },
    { id: 'tl-5-4', status: 'Packed', occurredAt: '2026-05-28T17:30:00Z', notes: 'Đóng gói hoàn tất.', operatorId: 'user-operator2' },
    { id: 'tl-5-5', status: 'Shipped', occurredAt: '2026-05-29T08:00:00Z', notes: 'Bàn giao cho tài xế Nguyễn Văn Giao (Xe tải 29C-12345). Hàng đã rời kho.', operatorId: 'user-admin' }
  ]
};

// Mocked database for Returns (For Step 4 usage)
let mockReturnsDb: OutboundReturnDto[] = [
  {
    id: 'ret-1',
    orderNo: 'OUT-2026-0005',
    sku: 'NINTENDO-SWITCH-OLED',
    returnedQty: 2,
    condition: 'Good',
    disposition: 'Pending',
    createdAt: '2026-05-29T10:30:00Z',
    notes: 'Khách hàng không nhận (Boom hàng). Vỏ hộp còn nguyên niêm phong.'
  },
  {
    id: 'ret-2',
    orderNo: 'OUT-2026-0004',
    sku: 'SONY-WH1000XM5',
    returnedQty: 1,
    condition: 'Damaged',
    disposition: 'Pending',
    createdAt: '2026-05-29T14:00:00Z',
    notes: 'Tai nghe bị trầy xước bên sườn, móp méo hộp nhựa bảo vệ.'
  }
];

// Mocked database for Wave Planning
let mockWavesDb: WaveDto[] = [
  {
    id: 'wave-1',
    waveNo: 'WAVE-2026-0001',
    type: 'Single-Item',
    orderCount: 12,
    status: 'Completed',
    createdAt: '2026-05-28T09:00:00Z'
  },
  {
    id: 'wave-2',
    waveNo: 'WAVE-2026-0002',
    type: 'Multi-Item',
    orderCount: 8,
    status: 'Picking',
    createdAt: '2026-05-29T11:00:00Z'
  }
];


import { fetchApi } from '../api-client';

export const getOrders = async (): Promise<OutboundOrderDto[]> => {
  return await fetchApi<OutboundOrderDto[]>('wms', '/outbound/orders');
};

export const getOrderById = async (id: string): Promise<OutboundOrderDto | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockOrdersDb.find(o => o.id === id);
};

export const getOrderTimeline = async (id: string): Promise<OutboundOrderTimelineDto[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return mockTimelinesDb[id] || [];
};

export const allocateOrder = async (id: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 450));
  const order = mockOrdersDb.find(o => o.id === id);
  if (!order) throw new Error("Order not found");
  
  order.status = 'Allocated';
  
  if (!mockTimelinesDb[id]) mockTimelinesDb[id] = [];
  mockTimelinesDb[id].push({
    id: `tl-${Date.now()}`,
    status: 'Allocated',
    occurredAt: new Date().toISOString(),
    notes: 'Cấp phát giữ hàng khả dụng trong kho thành công.',
    operatorId: 'user-admin'
  });
  
  return { success: true };
};

export const cancelOrder = async (id: string, reason: string): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const order = mockOrdersDb.find(o => o.id === id);
  if (!order) throw new Error("Order not found");
  
  order.status = 'Cancelled';
  
  if (!mockTimelinesDb[id]) mockTimelinesDb[id] = [];
  mockTimelinesDb[id].push({
    id: `tl-${Date.now()}`,
    status: 'Cancelled',
    occurredAt: new Date().toISOString(),
    notes: `Hủy lệnh xuất kho thành công. Lý do: ${reason}`,
    operatorId: 'user-admin'
  });
  
  return { success: true };
};

export const splitOrder = async (id: string, lineId: string, splitQty: number): Promise<{ success: boolean }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const order = mockOrdersDb.find(o => o.id === id);
  if (!order) throw new Error("Order not found");
  
  const line = order.lines.find(l => l.id === lineId);
  if (!line) throw new Error("Order line not found");
  if (line.quantity <= splitQty) throw new Error("Số lượng tách phải nhỏ hơn số lượng hiện tại");

  // Deduct qty from original line
  line.quantity -= splitQty;

  // Create a new mock order representing the split package
  const splitOrderNo = `${order.orderNo}-B`;
  const newOrder: OutboundOrderDto = {
    id: `out-${Date.now()}`,
    orderNo: splitOrderNo,
    tenantId: order.tenantId,
    status: 'New',
    createdAt: new Date().toISOString(),
    lines: [
      { id: `oline-${Date.now()}`, sku: line.sku, quantity: splitQty }
    ]
  };
  mockOrdersDb.push(newOrder);

  // Initialize new order timeline
  mockTimelinesDb[newOrder.id] = [
    {
      id: `tl-${Date.now()}`,
      status: 'New',
      occurredAt: new Date().toISOString(),
      notes: `Đơn hàng xuất được tách ra từ đơn gốc ${order.orderNo}.`,
      operatorId: 'user-admin'
    }
  ];

  // Append timeline to original order
  mockTimelinesDb[id].push({
    id: `tl-${Date.now() + 1}`,
    status: order.status,
    occurredAt: new Date().toISOString(),
    notes: `Tách dòng SKU ${line.sku} số lượng ${splitQty} sang đơn con mới ${splitOrderNo}.`,
    operatorId: 'user-admin'
  });

  return { success: true };
};

export const getReturns = async (): Promise<OutboundReturnDto[]> => {
  // Use a hardcoded warehouseId or get it from context/store. For testing, using HCM warehouse ID from seed.
  const warehouseId = 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
  return await fetchApi<OutboundReturnDto[]>('wms', `/outbound/returns?warehouseId=${warehouseId}`);
};

export const processDisposition = async (id: string, disposition: 'Restocked' | 'Scrapped' | 'Penalized', notes?: string): Promise<{ success: boolean }> => {
  const warehouseId = 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
  let condition = 1; // Good
  if (disposition === 'Scrapped' || disposition === 'Penalized') condition = 2; // Damaged

  await fetchApi<{ success: boolean }>('wms', `/outbound/returns/disposition`, {
    method: 'POST',
    body: JSON.stringify({
      warehouseId,
      sku: 'UNKNOWN', // Ideally, pass sku/qty from frontend, but we handle it via ReferenceId
      quantity: 1, 
      condition,
      targetBinCode: disposition === 'Restocked' ? 'ST-B-01' : undefined,
      referenceId: id,
      referenceType: 'OutboundReturn',
      notes: notes || 'Processed via Web UI'
    })
  });
  
  return { success: true };
};

export const getWaves = async (): Promise<WaveDto[]> => {
  const warehouseId = 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
  return await fetchApi<WaveDto[]>('wms', `/outbound/waves?warehouseId=${warehouseId}`);
};

export const autoPlanWaves = async (): Promise<{ success: boolean; createdWavesCount: number }> => {
  const warehouseId = 'a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
  const res = await fetchApi<{ createdWaveIds: string[], totalOrdersPlanned: number }>('wms', `/outbound/waves/auto-plan`, {
    method: 'POST',
    body: JSON.stringify({
      warehouseId,
      maxSingleItemOrdersPerWave: 50,
      maxMultiItemOrdersPerWave: 20
    })
  });
  
  return { success: true, createdWavesCount: res.createdWaveIds?.length || 0 };
};

export const startWave = async (waveId: string): Promise<{ success: boolean }> => {
  await fetchApi<{ success: boolean }>('wms', `/outbound/waves/${waveId}/start`, { method: 'POST' });
  return { success: true };
};

export const releaseWave = async (waveId: string): Promise<{ success: boolean }> => {
  await fetchApi<{ success: boolean }>('wms', `/outbound/waves/${waveId}/release`, { method: 'POST' });
  return { success: true };
};

