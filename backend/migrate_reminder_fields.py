"""
Migration script to add reminder_datetime and is_completed columns to reminders table
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "vitaledger.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(reminders)")
        columns = [column[1] for column in cursor.fetchall()]
        
        changes_made = False
        
        # Add reminder_datetime column
        if 'reminder_datetime' not in columns:
            print("Adding reminder_datetime column to reminders table...")
            cursor.execute("""
                ALTER TABLE reminders 
                ADD COLUMN reminder_datetime TIMESTAMP
            """)
            changes_made = True
            print("✅ reminder_datetime column added")
        else:
            print("✅ Column reminder_datetime already exists")
        
        # Add is_completed column
        if 'is_completed' not in columns:
            print("Adding is_completed column to reminders table...")
            cursor.execute("""
                ALTER TABLE reminders 
                ADD COLUMN is_completed BOOLEAN DEFAULT 0
            """)
            changes_made = True
            print("✅ is_completed column added")
        else:
            print("✅ Column is_completed already exists")
        
        # Make time column nullable (can't be done directly in SQLite, but new reminders will have it null)
        if changes_made:
            conn.commit()
            print("\n✅ Migration completed successfully")
        else:
            print("\n✅ All columns already exist, no migration needed")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
