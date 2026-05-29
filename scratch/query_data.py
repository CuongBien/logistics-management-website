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
    
    print("--- OUTBOUND ORDERS ---")
    cursor.execute('SELECT "Id", "OrderId", "WarehouseId", "Status", "DestinationAddress", "PartnerId" FROM "OutboundOrders";')
    for row in cursor.fetchall():
        print(f"Id: {row[0]}, OrderId: {row[1]}, WhId: {row[2]}, Status: {row[3]}, DestAddr: {row[4]}, PartnerId: {row[5]}")
        
    print("\n--- SHIPMENTS ---")
    cursor.execute('SELECT "Id", "ShipmentNo", "WarehouseId", "DestinationId", "Status" FROM "Shipments";')
    for row in cursor.fetchall():
        print(f"Id: {row[0]}, ShipmentNo: {row[1]}, WhId: {row[2]}, DestId: {row[3]}, Status: {row[4]}")
        
    print("\n--- BINS ---")
    cursor.execute('SELECT "Id", "WarehouseId", "Code", "CurrentOrderId" FROM "Bins" WHERE "CurrentOrderId" IS NOT NULL;')
    for row in cursor.fetchall():
        print(f"Id: {row[0]}, WhId: {row[1]}, Code: {row[2]}, CurrentOrderId: {row[3]}")
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
