"""Migration script to add subscriptions table"""
import sqlite3
from datetime import datetime

def migrate():
    conn = sqlite3.connect('vitaledger.db')
    cursor = conn.cursor()
    
    # Create subscriptions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL UNIQUE,
            plan TEXT NOT NULL,
            period TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'inactive',
            started_at TIMESTAMP,
            ends_at TIMESTAMP,
            provider TEXT NOT NULL,
            provider_ref TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_id ON subscriptions(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_provider_ref ON subscriptions(provider_ref)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_status ON subscriptions(status)')
    
    conn.commit()
    conn.close()
    
    print("✅ Subscriptions table created successfully")

if __name__ == "__main__":
    migrate()
