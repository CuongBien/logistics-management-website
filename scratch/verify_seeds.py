import psycopg2
import sys

# Force UTF-8 stdout encoding for Windows compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_MASTER = "dbname=lms_master_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_OMS = "dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def verify_master_data():
    print("=== VERIFYING MASTERDATA DATABASE ===")
    conn = psycopg2.connect(DB_MASTER)
    cur = conn.cursor()
    try:
        cur.execute('SELECT COUNT(*) FROM "Partners";')
        total_partners = cur.fetchone()[0]
        print(f"Total Partners: {total_partners}")

        # Count by type
        # Types: 1=Consignee, 2=Consignor, 3=Carrier, 4=Warehouse
        types = {1: "Consignees (Người nhận)", 2: "Consignors (Chủ hàng)", 3: "Carriers (Nhà xe)", 4: "Warehouses (Kho)"}
        for t_val, t_name in types.items():
            cur.execute('SELECT COUNT(*) FROM "Partners" WHERE "Type" = %s;', (t_val,))
            count = cur.fetchone()[0]
            print(f"  - {t_name}: {count}")

        # Sample Carriers
        cur.execute('SELECT "Code", "Name" FROM "Partners" WHERE "Type" = 3 ORDER BY "Code" LIMIT 5;')
        print("Sample Carriers:")
        for code, name in cur.fetchall():
            print(f"  * {code}: {name}")

        # Sample Consignors
        cur.execute('SELECT "Code", "Name" FROM "Partners" WHERE "Type" = 2 ORDER BY "Code" LIMIT 5;')
        print("Sample Consignors:")
        for code, name in cur.fetchall():
            print(f"  * {code}: {name}")

    except Exception as e:
        print(f"Error reading MasterData: {e}")
    finally:
        cur.close()
        conn.close()

def verify_oms():
    print("\n=== VERIFYING OMS DATABASE ===")
    conn = psycopg2.connect(DB_OMS)
    cur = conn.cursor()
    try:
        cur.execute('SELECT COUNT(*) FROM "erp_skus";')
        skus_count = cur.fetchone()[0]
        print(f"Total SKUs in erp_skus: {skus_count}")
        
        cur.execute('SELECT COUNT(*) FROM "Orders";')
        orders_count = cur.fetchone()[0]
        print(f"Total Orders: {orders_count}")
        
        cur.execute('SELECT "Status", COUNT(*) FROM "Orders" GROUP BY "Status";')
        print("Orders by Status:")
        for status, cnt in cur.fetchall():
            print(f"  * {status}: {cnt}")
            
        cur.execute('SELECT COUNT(*) FROM "OrderItems";')
        items_count = cur.fetchone()[0]
        print(f"Total OrderItems: {items_count}")
        
        cur.execute('SELECT COUNT(*) FROM "OrderStatusHistories";')
        history_count = cur.fetchone()[0]
        print(f"Total OrderStatusHistories: {history_count}")
    except Exception as e:
        print(f"Error reading OMS: {e}")
    finally:
        cur.close()
        conn.close()

def verify_wms():
    print("\n=== VERIFYING WMS DATABASE ===")
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()
    try:
        # SKUs
        cur.execute('SELECT COUNT(*) FROM "erp_skus";')
        skus_count = cur.fetchone()[0]
        print(f"Total SKUs in erp_skus: {skus_count}")

        # Warehouses
        cur.execute('SELECT COUNT(*) FROM "Warehouses";')
        wh_count = cur.fetchone()[0]
        print(f"Total Warehouses: {wh_count}")

        # Blocks
        cur.execute('SELECT COUNT(*) FROM "Blocks";')
        blk_count = cur.fetchone()[0]
        print(f"Total Blocks: {blk_count}")

        # Zones
        cur.execute('SELECT COUNT(*) FROM "Zones";')
        zone_count = cur.fetchone()[0]
        print(f"Total Zones: {zone_count}")

        # Bins
        cur.execute('SELECT COUNT(*) FROM "Bins";')
        bin_count = cur.fetchone()[0]
        print(f"Total Bins: {bin_count}")
        
        cur.execute('SELECT "Status", COUNT(*) FROM "Bins" GROUP BY "Status" ORDER BY "Status";')
        print("Bins by Status:")
        for status, cnt in cur.fetchall():
            print(f"  * {status}: {cnt}")

        # Operator profiles & role assignments
        cur.execute('SELECT COUNT(*) FROM operator_profiles;')
        op_count = cur.fetchone()[0]
        print(f"Total Operator Profiles: {op_count}")

        cur.execute('SELECT COUNT(*) FROM "OperatorRoleAssignments";')
        assign_count = cur.fetchone()[0]
        print(f"Total Operator Role Assignments: {assign_count}")

        # Outbound Orders
        cur.execute('SELECT COUNT(*) FROM "OutboundOrders";')
        outbound_count = cur.fetchone()[0]
        print(f"Total Outbound Orders: {outbound_count}")
        
        cur.execute('SELECT "Status", COUNT(*) FROM "OutboundOrders" GROUP BY "Status" ORDER BY "Status";')
        status_names = {
            1: "Draft", 2: "PendingAllocation", 3: "PartiallyAllocated", 4: "Allocated",
            5: "Picking", 6: "PartiallyPicked", 7: "Picked", 8: "Packing", 9: "Packed",
            10: "Loaded", 11: "Shipped", 12: "Delivered", 13: "Cancelled", 14: "Failed"
        }
        print("Outbound Orders by Status:")
        for status_val, cnt in cur.fetchall():
            status_name = status_names.get(status_val, f"Unknown ({status_val})")
            print(f"  * {status_name}: {cnt}")
            
        cur.execute('SELECT COUNT(*) FROM "OutboundOrderLines";')
        lines_count = cur.fetchone()[0]
        print(f"Total OutboundOrderLines: {lines_count}")
        
        cur.execute('SELECT COUNT(*) FROM "Waves";')
        waves_count = cur.fetchone()[0]
        print(f"Total Waves: {waves_count}")
        
        cur.execute('SELECT COUNT(*) FROM "PickTasks";')
        pick_count = cur.fetchone()[0]
        print(f"Total PickTasks: {pick_count}")
        
        cur.execute('SELECT "Status", COUNT(*) FROM "PickTasks" GROUP BY "Status" ORDER BY "Status";')
        pick_status_names = {1: "Pending", 2: "InProgress", 3: "Completed", 4: "Cancelled", 5: "Failed"}
        print("PickTasks by Status:")
        for status_val, cnt in cur.fetchall():
            status_name = pick_status_names.get(status_val, f"Unknown ({status_val})")
            print(f"  * {status_name}: {cnt}")
            
        cur.execute('SELECT COUNT(*) FROM inventory_reservations;')
        res_count = cur.fetchone()[0]
        print(f"Total Inventory Reservations: {res_count}")

        # Operator Activity Logs
        try:
            cur.execute('SELECT COUNT(*) FROM "OperatorActivityLogs";')
            activity_logs_count = cur.fetchone()[0]
            print(f"Total Operator Activity Logs: {activity_logs_count}")
            
            cur.execute('SELECT "TaskType", COUNT(*) FROM "OperatorActivityLogs" GROUP BY "TaskType" ORDER BY "TaskType";')
            print("Activity Logs by TaskType:")
            for t_type, cnt in cur.fetchall():
                print(f"  * {t_type}: {cnt}")
        except Exception as e:
            print(f"Error reading OperatorActivityLogs: {e}")


        # Detailed warehouse breakdown of Bins
        cur.execute('''
            SELECT w."Code", w."Name", COUNT(b."Id") as bin_count
            FROM "Warehouses" w
            LEFT JOIN "Bins" b ON w."Id" = b."WarehouseId"
            GROUP BY w."Code", w."Name"
            ORDER BY w."Code";
        ''')
        print("\nWarehouse Bin Breakdown:")
        for code, name, count in cur.fetchall():
            print(f"  * {code} ({name}): {count} bins")

        # Operator sample role assignments
        cur.execute('''
            SELECT op."DisplayName", COUNT(a."Id") as assign_count
            FROM operator_profiles op
            LEFT JOIN "OperatorRoleAssignments" a ON op."Id" = a."OperatorProfileId"
            GROUP BY op."DisplayName"
            ORDER BY op."DisplayName" LIMIT 6;
        ''')
        print("\nSample Operators Role Assignment Counts:")
        for name, count in cur.fetchall():
            print(f"  * {name}: assigned to {count} warehouse roles")

    except Exception as e:
        print(f"Error reading WMS: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    verify_master_data()
    verify_oms()
    verify_wms()
