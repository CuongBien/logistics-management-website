import psycopg2
import json
from datetime import datetime

DB_WMS = "dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432"

def main():
    conn = psycopg2.connect(DB_WMS)
    cur = conn.cursor()
    
    cur.execute("SELECT * FROM \"ReplenishmentTasks\" LIMIT 0")
    colnames = [desc[0] for desc in cur.description]
    print("ReplenishmentTasks Columns:", colnames)
    
    cur.execute("SELECT * FROM \"ReplenishmentTasks\" LIMIT 2")
    rows = cur.fetchall()
    for row in rows:
        task = dict(zip(colnames, row))
        for k, v in task.items():
            if isinstance(v, datetime):
                task[k] = v.isoformat()
        print("\nSample Replenishment Task:")
        print(json.dumps(task, indent=2, ensure_ascii=False))
        
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
