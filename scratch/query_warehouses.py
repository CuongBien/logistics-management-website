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
    
    print("--- WAREHOUSES ---")
    cursor.execute('SELECT "Id", "Code", "Name" FROM "Warehouses";')
    for row in cursor.fetchall():
        print(f"ID: {row[0]}, Code: {row[1]}, Name: {row[2]}")
        
    print("\n--- WAREHOUSE ROUTES ---")
    cursor.execute('SELECT "SourceWarehouseId", "DestinationWarehouseId", "NextHopWarehouseId" FROM "WarehouseRoutes";')
    for row in cursor.fetchall():
        print(f"Source: {row[0]}, Dest: {row[1]}, NextHop: {row[2]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
