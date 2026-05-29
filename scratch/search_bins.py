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
    
    cursor.execute('SELECT "Id", "BinCode", "WarehouseId" FROM "Bins" WHERE "Id" IN (\'d6fa0a0f-623b-4179-8d47-66c30bb5d565\', \'e81c1c1a-735a-4b30-a22d-77d41cc6e577\');')
    for row in cursor.fetchall():
        print(f"ID: {row[0]}, BinCode: {row[1]}, WhId: {row[2]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
