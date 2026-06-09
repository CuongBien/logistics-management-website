import psycopg2

def list_wms_tables():
    conn = psycopg2.connect(
        host="localhost",
        port=56432,
        database="lms_wms_dev",
        user="postgres",
        password="postgres"
    )
    cursor = conn.cursor()
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cursor.fetchall()]
    print("--- WMS TABLES AND COUNTS ---")
    for t in tables:
        try:
            cursor.execute(f'SELECT COUNT(*) FROM "{t}"')
            count = cursor.fetchone()[0]
            print(f"{t}: {count}")
        except Exception as e:
            print(f"Error reading table {t}: {e}")
            conn.rollback()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    list_wms_tables()
