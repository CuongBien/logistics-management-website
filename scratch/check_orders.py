import psycopg2
conn = psycopg2.connect('postgresql://postgres:postgres@127.0.0.1:56432/lms_oms_dev')
cursor = conn.cursor()
cursor.execute('SELECT "Id", "ConsignorId", "TenantId" FROM "Orders" LIMIT 5')
print(cursor.fetchall())
