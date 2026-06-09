import psycopg2
import sys

# Force UTF-8 stdout encoding for Windows compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

DB_OMS = "dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432"
DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def print_columns(dbname, conn_str, tables):
    print(f"\n=== COLUMNS IN {dbname} ===")
    conn = psycopg2.connect(conn_str)
    cur = conn.cursor()
    for table in tables:
        try:
            cur.execute(f"""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = %s
                ORDER BY ordinal_position;
            """, (table,))
            cols = cur.fetchall()
            print(f"\nTable: {table} ({len(cols)} columns)")
            for col in cols:
                print(f"  - {col[0]} ({col[1]}, nullable={col[2]})")
        except Exception as e:
            print(f"Error reading table {table}: {e}")
    cur.close()
    conn.close()

if __name__ == '__main__':
    print_columns("OMS", DB_OMS, ["Orders", "OrderItems", "OrderStatusHistories"])
    print_columns("WMS", DB_WMS, ["OutboundOrders", "OutboundOrderLines", "Waves", "PickTasks", "InventoryReservations"])
