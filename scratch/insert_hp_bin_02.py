import psycopg2
import uuid

try:
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=56432,
        user="postgres",
        password="postgres",
        database="lms_wms_dev"
    )
    cursor = conn.cursor()
    
    # Check if BIN-A1-02 already exists for HP
    cursor.execute('SELECT "Id" FROM "Bins" WHERE "WarehouseId" = \'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6\' AND "BinCode" = \'BIN-A1-02\';')
    row = cursor.fetchone()
    
    if row:
        print("BIN-A1-02 already exists for HP with ID:", row[0])
    else:
        # HP ZoneId from the query output
        zone_id = 'd6a083f6-40fc-44a9-a1bd-86fb041e3219'
        bin_id = str(uuid.uuid4())
        
        cursor.execute(
            'INSERT INTO "Bins" ("Id", "WarehouseId", "ZoneId", "BinCode", "Status", "Version", "IsDeleted") VALUES (%s, %s, %s, %s, %s, %s, %s);',
            (bin_id, 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', zone_id, 'BIN-A1-02', 'Available', 1, False)
        )
        conn.commit()
        print("Successfully inserted BIN-A1-02 for HP with ID:", bin_id)
        
    cursor.close()
    conn.close()
except Exception as e:
    print("Error:", e)
