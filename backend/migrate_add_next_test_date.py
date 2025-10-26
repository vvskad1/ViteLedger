"""
Migration script to add next_test_date column to lab_reports table
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "vitaledger.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(lab_reports)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'next_test_date' not in columns:
            print("Adding next_test_date column to lab_reports table...")
            cursor.execute("""
                ALTER TABLE lab_reports 
                ADD COLUMN next_test_date TIMESTAMP
            """)
            conn.commit()
            print("✅ Migration successful: next_test_date column added")
        else:
            print("✅ Column next_test_date already exists")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
