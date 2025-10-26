"""
Migration script to add meal_plans table
"""
import sqlite3
from pathlib import Path

# Path to database
DB_PATH = Path(__file__).parent / "vitaledger.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='meal_plans'
        """)
        
        if cursor.fetchone():
            print("✓ meal_plans table already exists")
            return
        
        # Create meal_plans table
        cursor.execute("""
            CREATE TABLE meal_plans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                expectations TEXT NOT NULL,
                plan_data TEXT NOT NULL,
                modification_notes TEXT,
                sources TEXT,
                user_age INTEGER,
                user_weight REAL,
                user_height REAL,
                user_nationality VARCHAR,
                user_allergies TEXT,
                lab_considerations TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        
        conn.commit()
        print("✅ Successfully created meal_plans table")
        
        # Verify
        cursor.execute("SELECT COUNT(*) FROM meal_plans")
        print(f"✓ Table verified: meal_plans")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Running migration: Add meal_plans table...")
    migrate()
    print("Migration complete!")
