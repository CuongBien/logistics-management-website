import psycopg2
conn = psycopg2.connect('dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432')
cur = conn.cursor()
cur.execute('SELECT "ConsignorId", COUNT(*) FROM "Orders" GROUP BY "ConsignorId";')
print(cur.fetchall())
