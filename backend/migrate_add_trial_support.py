"""Migration script to add trial support to subscriptions table"""
import sqlite3

def migrate():
    conn = sqlite3.connect('vitaledger.db')
    cursor = conn.cursor()
    
    # Add trial columns
    try:
        cursor.execute('ALTER TABLE subscriptions ADD COLUMN is_trial BOOLEAN DEFAULT 0')
        print("✅ Added is_trial column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("⚠️  is_trial column already exists")
        else:
            raise
    
    try:
        cursor.execute('ALTER TABLE subscriptions ADD COLUMN trial_ends_at TIMESTAMP')
        print("✅ Added trial_ends_at column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("⚠️  trial_ends_at column already exists")
        else:
            raise
    
    conn.commit()
    conn.close()
    
    print("✅ Trial support migration completed")

if __name__ == "__main__":
    migrate()
