import psycopg2
conn = psycopg2.connect('dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432')
cur = conn.cursor()
cur.execute('SELECT count(*) FROM "Waves"')
print('Waves:', cur.fetchone())
cur.execute('SELECT count(*) FROM "OutboundReturns"')
print('Returns:', cur.fetchone())
