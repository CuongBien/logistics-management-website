import psycopg2
from collections import defaultdict

DB_PARAMS = {
    'master_data': 'dbname=lms_master_dev user=postgres password=postgres host=127.0.0.1 port=56432',
    'wms': 'dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432',
    'oms': 'dbname=lms_oms_dev user=postgres password=postgres host=127.0.0.1 port=56432'
}

def count_tables():
    for db_name, conn_str in DB_PARAMS.items():
        try:
            conn = psycopg2.connect(conn_str)
            cur = conn.cursor()
            
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                  AND table_type = 'BASE TABLE'
                  AND table_name NOT LIKE '__EFMigrationsHistory';
            """)
            
            tables = [row[0] for row in cur.fetchall()]
            
            print(f'\n--- {db_name.upper()} ---')
            results = []
            for table in tables:
                cur.execute(f'SELECT COUNT(*) FROM "{table}"')
                count = cur.fetchone()[0]
                results.append((table, count))
            
            results.sort(key=lambda x: (x[1] > 0, x[1])) # Empty first, then sort by count
            for table, count in results:
                print(f'{table}: {count}')
                
            conn.close()
        except Exception as e:
            print(f'Error connecting to {db_name}: {e}')

if __name__ == '__main__':
    count_tables()
