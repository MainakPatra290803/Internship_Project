import sqlite3

def inspect_db():
    try:
        conn = sqlite3.connect('sql_app.db')
        cursor = conn.cursor()
        
        # 1. List Tables
        print("\n--- TABLES ---")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        for t in tables:
            print(f"- {t[0]}")
            
        # 2. Inspect Concepts
        print("\n--- CONCEPTS ---")
        try:
            cursor.execute("SELECT * FROM concepts")
            cols = [description[0] for description in cursor.description]
            print(cols)
            for row in cursor.fetchall():
                print(row)
        except Exception as e:
            print(f"Error querying concepts: {e}")

        # 3. Inspect Content Items (Questions)
        print("\n--- CONTENT ITEMS (Questions) ---")
        try:
            cursor.execute("SELECT id, type, content, difficulty, concept_id FROM content_items")
            cols = [description[0] for description in cursor.description]
            print(cols)
            for row in cursor.fetchall():
                print(row)
        except Exception as e:
            print(f"Error querying content_items: {e}")

        # 4. Inspect Users
        print("\n--- USERS ---")
        try:
            cursor.execute("SELECT id, email, hashed_password, role, is_verified FROM users")
            cols = [description[0] for description in cursor.description]
            print(cols)
            for row in cursor.fetchall():
                print(row)
        except Exception as e:
            print(f"Error querying users: {e}")

        # 5. Inspect OTPs
        print("\n--- OTPS ---")
        try:
            cursor.execute("SELECT * FROM otps")
            cols = [description[0] for description in cursor.description]
            print(cols)
            for row in cursor.fetchall():
                print(row)
        except Exception as e:
            print(f"Error querying otps: {e}")

        # 6. Inspect Students
        print("\n--- STUDENTS ---")
        try:
            cursor.execute("SELECT * FROM students")
            cols = [description[0] for description in cursor.description]
            print(cols)
            for row in cursor.fetchall():
                print(row)
        except Exception as e:
            print(f"Error querying students: {e}")

        conn.close()
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    inspect_db()
