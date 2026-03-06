import sqlite3
import os

db_path = 'backend/linguacheck.db'
if not os.path.exists(db_path):
    print(f"Error: DB {db_path} not found")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print(f"Tables: {tables}")
    
    if ('trademarks',) in tables:
        cursor.execute("SELECT COUNT(*) FROM trademarks")
        count = cursor.fetchone()[0]
        cursor.execute("SELECT * FROM trademarks LIMIT 5")
        samples = cursor.fetchall()
        print(f"Total trademarks: {count}")
        print(f"Samples: {samples}")
    else:
        print("Table 'trademarks' not found!")
    conn.close()
