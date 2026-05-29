import psycopg2

try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=56432,
        user="postgres",
        password="postgres",
        database="lms_wms_dev"
    )
    cursor = conn.cursor()
    
    print("--- WAREHOUSE ROUTES COLUMNS ---")
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'WarehouseRoutes';")
    for row in cursor.fetchall():
        print(f"Column: {row[0]}, Type: {row[1]}")
        
    print("\n--- WAREHOUSE ROUTES DATA ---")
    cursor.execute('SELECT "Id", "SourceWarehouseId", "DestinationWarehouseId", "NextHopWarehouseId" FROM "WarehouseRoutes";')
    for row in cursor.fetchall():
        print(f"Id: {row[0]}, Src: {row[1]}, Dest: {row[2]}, NextHop: {row[3]}")
        
    print("--- BINS COLUMNS ---")
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Bins';")
    for row in cursor.fetchall():
        print(f"Column: {row[0]}, Type: {row[1]}")
        
    print("\n--- HP BINS ---")
    cursor.execute('SELECT "Id", "WarehouseId", "ZoneId", "BinCode", "Status" FROM "Bins" WHERE "WarehouseId" = \'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6\';')
    for row in cursor.fetchall():
        print(f"BinId: {row[0]}, WhId: {row[1]}, ZoneId: {row[2]}, BinCode: {row[3]}, Status: {row[4]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
