# 01 — Tổng quan Kiến trúc Hệ thống

## Stack kỹ thuật

| Lớp | Công nghệ |
|-----|-----------|
| Backend | .NET 8, Clean Architecture (Domain / Application / Infrastructure / API) |
| Database | PostgreSQL + EF Core |
| Message Bus | MassTransit + RabbitMQ (Outbox pattern) |
| Auth | Keycloak (JWT, tenant claim, RBAC) |
| API Gateway | YARP |
| Mobile | Flutter 3 + Dart ^3.11.5, Riverpod 3, GoRouter 17, Dio 5 |
| Real-time | SignalR (thông báo in-app) |
| Observability | OpenTelemetry + Jaeger |

---

## Kiến trúc Microservice (các service liên quan)

```
┌───────────────────┐     ┌──────────────────────────┐
│   OMS Service     │────▶│   Warehouse Service       │
│  (Order Mgmt)     │     │  ┌─────────────────────┐  │
└───────────────────┘     │  │ Domain Entities:     │  │
                          │  │  - Warehouse/Zone/Bin│  │
┌───────────────────┐     │  │  - InventoryItem     │  │
│   ERP Sync        │────▶│  │  - InboundReceipt    │  │
│  (ErpSkuMirror)   │     │  │  - PutawayTask       │  │
└───────────────────┘     │  │  - OutboundOrder     │  │
                          │  │  - PickTask / Wave   │  │
┌───────────────────┐     │  │  - ReplenishmentTask │  │ ← FOCUS
│  Mobile PDA       │◀───▶│  │  - CountTask         │  │ ← FOCUS
│  (Flutter App)    │     │  │  - Shipment          │  │
└───────────────────┘     │  └─────────────────────┘  │
                          └──────────────────────────┘
```

---

## Cấu trúc Kho vật lý (Physical Layout)

```
Warehouse
 └── Zone (ZoneType: Storage | Picking | Staging | Receiving | Dispatch | Quarantine)
      └── Bin (BinCode, Aisle, Rack, Shelf)
           └── InventoryItem (SKU, Qty, LotNo, ExpiryDate)
```

**Zone types và vai trò:**

| ZoneType | Vai trò | Liên quan đến luồng |
|----------|---------|---------------------|
| `Receiving` | Nhận hàng đến | Inbound, Transit Receive |
| `Storage` / `Bulk` | Lưu trữ số lượng lớn | Replenishment (nguồn) |
| `Picking` / `Pick Face` | Kệ nhặt hàng nhanh | Replenishment (đích), Picking |
| `Staging` | Khu trung gian | CrossDock, Sort |
| `Dispatch` | Xuất hàng | Shipment, Load |
| `Quarantine` | Hàng lỗi/dư | Inbound overage |

---

## Toàn bộ Domain Entities — Danh sách

| Entity | File | Vai trò |
|--------|------|---------|
| `Warehouse` | Warehouse.cs | Kho tổng |
| `Zone` | Zone.cs | Vùng trong kho |
| `Bin` | Bin.cs | Ô kệ vật lý |
| `InventoryItem` | InventoryItem.cs | Tồn kho tại bin |
| `InventoryLedger` | InventoryLedger.cs | Sổ cái tồn kho |
| `InventoryReconciliationReport` | InventoryReconciliationReport.cs | Báo cáo điều chỉnh |
| `InventoryReservation` | InventoryReservation.cs | Đặt trước tồn kho |
| `ErpSkuMirror` | ErpSkuMirror.cs | Mirror SKU từ ERP |
| `InboundReceipt` | InboundReceipt.cs | Phiếu nhập kho |
| `InboundReceiptLine` | InboundReceiptLine.cs | Dòng phiếu nhập |
| `InboundBinAllocation` | InboundBinAllocation.cs | Phân bổ bin nhập |
| `InboundDiscrepancy` | InboundDiscrepancy.cs | Sai lệch khi nhập |
| `PutawayTask` | PutawayTask.cs | Tác vụ cất hàng |
| `CrossDockTask` | CrossDockTask.cs | Tác vụ cross-dock |
| `ReplenishmentTask` | ReplenishmentTask.cs | **Tác vụ bổ sung** |
| `CountTask` | CountTask.cs | **Tác vụ kiểm kê** |
| `OutboundOrder` | OutboundOrder.cs | Đơn xuất kho |
| `OutboundOrderLine` | OutboundOrderLine.cs | Dòng đơn xuất |
| `PickTask` | PickTask.cs | Tác vụ lấy hàng |
| `Wave` | Wave.cs | Đợt lấy hàng |
| `PackVerification` | PackVerification.cs | Xác minh đóng gói |
| `Shipment` | Shipment.cs | Lô hàng xuất |
| `OutboundReturn` | OutboundReturn.cs | Hàng trả về |
| `TransitDiscrepancy` | TransitDiscrepancy.cs | Sai lệch trung chuyển |
| `OperatorProfile` | OperatorProfile.cs | Hồ sơ nhân viên |
| `OperatorActivityLog` | OperatorActivityLog.cs | Nhật ký hoạt động |
| `OperatorRoleAssignment` | OperatorRoleAssignment.cs | Phân quyền vai trò |
| `Role` / `Permission` / `RolePermission` | Role.cs etc. | IAM |
| `Notification` | Notification.cs | Thông báo real-time |
| `TaskOverrideLog` | TaskOverrideLog.cs | Log ghi đè tác vụ |
| `WarehouseRoute` | WarehouseRoute.cs | Tuyến đường vận chuyển |

---

## Trạng thái hiện tại (tháng 6/2026)

Toàn bộ các tính năng trong yêu cầu **đã được implement xong**:

- ✅ `ReplenishmentExecutionScreen` — 2-step stepper (scan source → scan dest → confirm)
- ✅ `CycleCountExecutionScreen` — 2-step flow (verify bin → numpad count)
- ✅ Dashboard routing cho cả 2 luồng (assign → start → navigate)
- ✅ Router đã có `/wms/replenishment_execution` và `/wms/cycle_count_execution/:taskId`
- ✅ `QrActionService.confirmReplenish()` và `cycleCountStart()`
- ✅ `InventoryRepository` đủ tất cả các method assign/start/reconcile

> **Kết luận**: Không cần tạo thêm file mới. Phân tích này cung cấp tài liệu hóa đầy đủ và ERD để tham khảo.
