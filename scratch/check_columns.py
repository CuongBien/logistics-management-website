import psycopg2

def check(db):
    conn = psycopg2.connect(f"dbname={db} user=postgres password=postgres host=127.0.0.1 port=56432")
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    tables = cur.fetchall()
    print(f"--- {db} ---")
    for t in tables:
        print(f"Table: {t[0]}")
        cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name='{t[0]}'")
        cols = cur.fetchall()
        print("  Cols:", [c[0] for c in cols])
        
check('lms_master_dev')
check('lms_oms_dev')
