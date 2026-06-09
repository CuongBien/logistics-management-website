import psycopg2
import uuid

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()

    order_id = '21b07b73-3549-4af1-bff6-a62d2c3c770a'

    # Query OutboundOrder
    cur.execute('SELECT "Id", "OrderNo", "Status", "WarehouseId", "CreatedAt", "DestinationCity", "PlannedShipAt" FROM "OutboundOrders" WHERE "Id" = %s', (order_id,))
    order = cur.fetchone()
    if not order:
        print("Order not found.")
        return

    o_id, o_no, o_status, o_wh_id, o_created, o_dest_city, o_planned_ship = order
    print(f"Order: {o_no}, Status: {o_status}, Created: {o_created}")

    # Query Warehouses
    cur.execute('SELECT "Id", "Name" FROM "Warehouses"')
    wh_map = {row[0]: row[1] for row in cur.fetchall()}
    source_wh_name = wh_map.get(o_wh_id, "Unknown Hub")

    timeline = []
    
    # 1. Created Event
    timeline.append({
        'timestamp': o_created,
        'location': source_wh_name,
        'eventType': 'OrderCreated',
        'description': "Mới tạo: Đơn xuất kho được ghi nhận."
    })

    # Query PickTasks
    cur.execute('''
        SELECT pt."Id", pt."Status", pt."CreatedAt", pt."StartedAt", pt."PickedAt" 
        FROM "PickTasks" pt 
        JOIN "OutboundOrderLines" l ON pt."OutboundOrderLineId" = l."Id" 
        WHERE l."OutboundOrderId" = %s
    ''', (order_id,))
    pick_tasks = cur.fetchall()

    print(f"Pick tasks found: {len(pick_tasks)}")
    
    if pick_tasks:
        # Allocated
        created_times = [pt[2] for pt in pick_tasks if pt[2] is not None]
        if created_times:
            allocated_time = min(created_times)
            timeline.append({
                'timestamp': allocated_time,
                'location': source_wh_name,
                'eventType': 'Allocated',
                'description': "Đã cấp phát: Đã phân bổ tồn kho và tạo tác vụ lấy hàng."
            })

        # Picking
        started_times = [pt[3] for pt in pick_tasks if pt[3] is not None]
        if started_times:
            picking_time = min(started_times)
            timeline.append({
                'timestamp': picking_time,
                'location': source_wh_name,
                'eventType': 'Picking',
                'description': "Đang lấy hàng: Nhân viên kho bắt đầu lấy hàng."
            })
        else:
            picked_times = [pt[4] for pt in pick_tasks if pt[4] is not None]
            if picked_times:
                picking_time = min(picked_times)
                timeline.append({
                    'timestamp': picking_time,
                    'location': source_wh_name,
                    'eventType': 'Picking',
                    'description': "Đang lấy hàng: Nhân viên kho bắt đầu lấy hàng."
                })

        # Picked
        all_completed = all(pt[1] == 3 for pt in pick_tasks)
        print(f"All pick tasks completed? {all_completed}")
        if all_completed:
            picked_times = [pt[4] for pt in pick_tasks if pt[4] is not None]
            picked_time = max(picked_times) if picked_times else o_created
            timeline.append({
                'timestamp': picked_time,
                'location': source_wh_name,
                'eventType': 'Picked',
                'description': "Đã lấy hàng: Hoàn thành lấy hàng, chuyển hàng về khu vực đóng gói."
            })

            # Packing / Packed checks based on status
            print(f"Order status check: {o_status}")
            # OutboundOrderStatus status codes:
            # Picking = 5, PartiallyPicked = 6, Picked = 7, Packing = 8, Packed = 9, Loaded = 10, Shipped = 11, Delivered = 12
            if o_status in (8, 9, 10, 11, 12):
                timeline.append({
                    'timestamp': picked_time,
                    'location': source_wh_name,
                    'eventType': 'Packing',
                    'description': "Đang đóng gói: Bắt đầu kiểm đếm đóng gói."
                })
            if o_status in (9, 10, 11, 12):
                timeline.append({
                    'timestamp': picked_time,
                    'location': source_wh_name,
                    'eventType': 'Packed',
                    'description': "Đã đóng gói: Đơn hàng đã được đóng gói và dán nhãn vận chuyển."
                })

    # Print reconstructed timeline
    print("\nReconstructed Timeline:")
    for event in sorted(timeline, key=lambda x: x['timestamp']):
        print(f"[{event['timestamp']}] {event['eventType']} ({event['location']}): {event['description']}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
