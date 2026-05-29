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
    
    print("--- INVENTORY ITEMS COLUMNS ---")
    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'InventoryItems';")
    for row in cursor.fetchall():
        print(f"Column: {row[0]}, Type: {row[1]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
