import sqlite3

conn = sqlite3.connect('vitaledger.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]
print("Tables in database:")
for table in tables:
    print(f"  - {table}")

# Check if appointments table exists
if 'appointments' in tables:
    print("\n✅ appointments table exists")
    cursor.execute("SELECT COUNT(*) FROM appointments")
    count = cursor.fetchone()[0]
    print(f"   Records: {count}")
else:
    print("\n❌ appointments table does NOT exist")

conn.close()
