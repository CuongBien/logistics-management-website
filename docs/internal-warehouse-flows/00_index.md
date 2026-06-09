# Internal Warehouse Flows — Tài liệu Phân tích & ERD

> Phiên bản: Sprint 7 | Cập nhật: 2026-06-09

## Mục lục

| File | Nội dung |
|------|----------|
| [01_system_overview.md](01_system_overview.md) | Tổng quan kiến trúc hệ thống & trạng thái hiện tại |
| [02_replenishment_flow.md](02_replenishment_flow.md) | Phân tích đầy đủ luồng Bổ sung hàng (Replenishment) |
| [03_cycle_count_flow.md](03_cycle_count_flow.md) | Phân tích đầy đủ luồng Kiểm kê định kỳ (Cycle Count) |
| [04_erd_warehouse_structure.md](04_erd_warehouse_structure.md) | ERD: Cấu trúc Kho (Warehouse → Zone → Bin) |
| [05_erd_replenishment.md](05_erd_replenishment.md) | ERD: Luồng Replenishment & Inventory |
| [06_erd_cycle_count.md](06_erd_cycle_count.md) | ERD: Luồng Cycle Count & Reconciliation |
| [07_erd_inbound_putaway.md](07_erd_inbound_putaway.md) | ERD: Nhận hàng & Cất hàng (Inbound + Putaway) |
| [08_erd_outbound_picking.md](08_erd_outbound_picking.md) | ERD: Xuất hàng & Lấy hàng (Outbound + Picking) |
| [09_backend_frontend_gap_analysis.md](09_backend_frontend_gap_analysis.md) | Gap Analysis: Backend vs Mobile PDA |
| [10_api_contract.md](10_api_contract.md) | Hợp đồng API đầy đủ cho các luồng nội bộ |

## Trạng thái Implement (tóm tắt nhanh)

| Tính năng | Backend | Mobile (Flutter) | Trạng thái |
|-----------|---------|------------------|------------|
| ReplenishmentExecutionScreen | ✅ | ✅ | **DONE** |
| CycleCountExecutionScreen | ✅ | ✅ | **DONE** |
| Dashboard routing Replenishment | ✅ | ✅ | **DONE** |
| Dashboard routing Cycle Count | ✅ | ✅ | **DONE** |
| Router `/wms/replenishment_execution` | ✅ | ✅ | **DONE** |
| Router `/wms/cycle_count_execution/:taskId` | ✅ | ✅ | **DONE** |
| QR Service `confirmReplenish` | ✅ | ✅ | **DONE** |
| QR Service `cycleCountStart` | ✅ | ✅ | **DONE** |
| Short Replenish (báo thiếu hàng) | ✅ | ✅ | **DONE** |
| Inventory Repository `assignReplenishmentTask` | ✅ | ✅ | **DONE** |
| Inventory Repository `startReplenishmentTask` | ✅ | ✅ | **DONE** |
| Inventory Repository `assignCycleCountTask` | ✅ | ✅ | **DONE** |
| Inventory Repository `startCycleCountTask` | ✅ | ✅ | **DONE** |
