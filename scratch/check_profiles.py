import psycopg2
conn = psycopg2.connect('dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432')
cur = conn.cursor()
cur.execute('SELECT "Id", "OperatorSub", "DisplayName" FROM operator_profiles')
print('Profiles:', cur.fetchall())
