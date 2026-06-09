import sys
import psycopg2

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=56432,
        user="postgres",
        password="postgres",
        database="lms_wms_dev"
    )
    cursor = conn.cursor()
    
    # Let's see all Warehouses
    cursor.execute('SELECT "Id", "Code", "Name" FROM "Warehouses";')
    warehouses = cursor.fetchall()
    print("--- WAREHOUSES ---")
    for wh in warehouses:
        print(f"WH ID: {wh[0]}, Code: {wh[1]}, Name: {wh[2]}")
        
        # Blocks in this warehouse
        cursor.execute('SELECT "Id", "BlockCode" FROM "Blocks" WHERE "WarehouseId" = %s;', (wh[0],))
        blocks = cursor.fetchall()
        for blk in blocks:
            print(f"  └─ Block ID: {blk[0]}, BlockCode: {blk[1]}")
            
            # Zones in this block
            cursor.execute('SELECT "Id", "ZoneType" FROM "Zones" WHERE "BlockId" = %s;', (blk[0],))
            zones = cursor.fetchall()
            for zn in zones:
                print(f"       └─ Zone ID: {zn[0]}, ZoneType: {zn[1]}")
                
                # Bins in this zone
                cursor.execute('SELECT "Id", "BinCode", "Status" FROM "Bins" WHERE "ZoneId" = %s;', (zn[0],))
                bins = cursor.fetchall()
                for b in bins:
                    print(f"            └─ Bin ID: {b[0]}, BinCode: {b[1]}, Status: {b[2]}")
                    
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
