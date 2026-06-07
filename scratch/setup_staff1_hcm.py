import psycopg2
import uuid
import datetime

# Connection string to WMS DB
conn = psycopg2.connect("dbname=lms_wms_dev user=postgres password=postgres host=127.0.0.1 port=56432")
cur = conn.cursor()

# Get staff1 OperatorProfile
staff1_sub = "staff1"
cur.execute("SELECT \"Id\" FROM operator_profiles WHERE \"OperatorSub\" = %s;", (staff1_sub,))
row = cur.fetchone()

if row is None:
    print("staff1 OperatorProfile not found. Creating one...")
    staff1_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO operator_profiles (\"Id\", \"OperatorSub\", \"TenantId\", \"DisplayName\", \"IsActive\") VALUES (%s, %s, %s, %s, %s);",
        (staff1_id, staff1_sub, "default-tenant", "Staff One", True)
    )
    conn.commit()
else:
    staff1_id = row[0]
    print(f"staff1 OperatorProfile found: {staff1_id}")

# Find role Warehouse Staff
cur.execute("SELECT \"Id\" FROM \"Roles\" WHERE \"Name\" = 'Warehouse Staff';")
role_row = cur.fetchone()
if role_row is None:
    print("Role 'Warehouse Staff' not found. We will create it or use existing id.")
    role_id = str(uuid.uuid4())
    cur.execute("INSERT INTO \"Roles\" (\"Id\", \"Code\", \"Name\", \"IsActive\") VALUES (%s, %s, %s, %s)",
                (role_id, "WHS_STAFF", "Warehouse Staff", True))
    conn.commit()
else:
    role_id = role_row[0]

hcm_warehouse = "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1"

# Assign staff1 to HCM
cur.execute("SELECT \"Id\" FROM \"OperatorRoleAssignments\" WHERE \"OperatorProfileId\" = %s AND \"WarehouseId\" = %s;", (staff1_id, hcm_warehouse))
assignment = cur.fetchone()

if assignment is None:
    print("Assigning staff1 to HCM warehouse...")
    assignment_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO \"OperatorRoleAssignments\" (\"Id\", \"OperatorProfileId\", \"RoleId\", \"WarehouseId\", \"Status\", \"EffectiveFrom\") VALUES (%s, %s, %s, %s, %s, %s);",
        (assignment_id, staff1_id, role_id, hcm_warehouse, 1, datetime.datetime.now())
    )
    conn.commit()
    print("Assigned successfully.")
else:
    print("Assignment already exists.")

cur.close()
conn.close()
