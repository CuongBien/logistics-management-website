import psycopg2
conn = psycopg2.connect("dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432")
cur = conn.cursor()
cur.execute("UPDATE \"Orders\" SET \"TenantId\" = 'default-tenant' WHERE \"TenantId\" = 'tenant-demo'")
cur.execute("UPDATE \"OrderStatusHistories\" SET \"TenantId\" = 'default-tenant' WHERE \"TenantId\" = 'tenant-demo'")
conn.commit()
print("Updated TenantId to default-tenant!")
