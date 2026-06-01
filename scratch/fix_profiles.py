import psycopg2
conn = psycopg2.connect('dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432')
cur = conn.cursor()

# Get the real profile ID
real_sub = '9f62d8ef-3147-4f8b-ad2d-cec130925a4a'
cur.execute('SELECT "Id" FROM operator_profiles WHERE "OperatorSub" = %s', (real_sub,))
real_id = cur.fetchone()[0]

# Get my dummy profile ID
dummy_sub = 'staff1'
cur.execute('SELECT "Id" FROM operator_profiles WHERE "OperatorSub" = %s', (dummy_sub,))
dummy_row = cur.fetchone()

if dummy_row:
    dummy_id = dummy_row[0]
    
    # Update assignments to point to real_id
    cur.execute('UPDATE "OperatorRoleAssignments" SET "OperatorProfileId" = %s WHERE "OperatorProfileId" = %s', (real_id, dummy_id))
    
    # Delete dummy profile
    cur.execute('DELETE FROM operator_profiles WHERE "Id" = %s', (dummy_id,))
    
    conn.commit()
    print("Fixed profiles.")
else:
    print("Dummy not found.")

cur.execute('SELECT op."Id", op."OperatorSub", ora."WarehouseId" FROM operator_profiles op LEFT JOIN "OperatorRoleAssignments" ora ON op."Id" = ora."OperatorProfileId" WHERE op."OperatorSub" = %s', (real_sub,))
print('Real Staff1 info:', cur.fetchall())

