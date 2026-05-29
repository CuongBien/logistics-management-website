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
    
    print("--- BINS AT HP (f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6) ---")
    cursor.execute('SELECT "Id", "BinCode", "ZoneId" FROM "Bins" WHERE "WarehouseId" = \'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6\';')
    for row in cursor.fetchall():
        print(f"Id: {row[0]}, BinCode: {row[1]}, ZoneId: {row[2]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
