from app.core.database import SessionLocal, engine
from sqlalchemy import inspect, text

def check_schema():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")
    
    if "topics" not in tables:
        print("FAIL: 'topics' table missing. Schema not updated.")
        return False
        
    # Check columns in ContentItem
    columns = [c['name'] for c in inspector.get_columns("content_items")]
    print(f"ContentItem columns: {columns}")
    if "explanation" not in columns:
        print("FAIL: 'explanation' column missing in ContentItem. Schema not updated.")
        return False
        
    print("SUCCESS: Schema looks correct.")
    return True

if __name__ == "__main__":
    if check_schema():
        exit(0)
    else:
        exit(1)
