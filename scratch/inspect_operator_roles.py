import psycopg2

conn = psycopg2.connect("host=127.0.0.1 port=56432 dbname=lms_wms_dev user=postgres password=postgres")
cur = conn.cursor()

print("=== Roles ===")
cur.execute('SELECT "Id", "Name" FROM "Roles"')
for r in cur.fetchall():
    print(r)

print("\n=== OperatorRoleAssignments ===")
cur.execute('SELECT "Id", "OperatorProfileId", "WarehouseId", "RoleId" FROM "OperatorRoleAssignments"')
for r in cur.fetchall():
    print(r)

cur.close()
conn.close()
