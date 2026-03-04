import sqlite3

db_path = "sql_app.db"

print(f'DB found: {db_path}')
if db_path:
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    try:
        c.execute("ALTER TABLE chat_sessions ADD COLUMN session_type TEXT DEFAULT 'chat'")
        conn.commit()
        print('Column session_type added successfully')
    except Exception as e:
        print(f'Note: {e}')
    c.execute('PRAGMA table_info(chat_sessions)')
    print('Table schema:', c.fetchall())
    conn.close()
else:
    print('No DB file found')
