import psycopg2
conn = psycopg2.connect('dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432')
cur = conn.cursor()
cur.execute('SELECT op."Id", op."OperatorSub", ora."WarehouseId" FROM operator_profiles op LEFT JOIN "OperatorRoleAssignments" ora ON op."Id" = ora."OperatorProfileId" WHERE op."OperatorSub" = \'staff1\'')
print('Staff1 info:', cur.fetchall())

cur.execute('SELECT "Id", "Code", "Name" FROM "Warehouses"')
print('Warehouses:', cur.fetchall())

cur.execute('SELECT "Id", "Sku", "QuantityOnHand", "WarehouseId" FROM "InventoryItems"')
print('Inventory:', cur.fetchall())
