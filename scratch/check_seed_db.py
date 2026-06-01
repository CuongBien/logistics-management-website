import psycopg2

conn = psycopg2.connect("host=127.0.0.1 port=56432 dbname=lms_wms_dev user=postgres password=postgres")
cur = conn.cursor()

cur.execute("SELECT \"Id\", \"WarehouseId\", \"Status\" FROM \"PutawayTasks\";")
print("Tasks:", cur.fetchall())
