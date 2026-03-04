
import sys
from unittest.mock import MagicMock

# Mock the database module to avoid the SQLAlchemy hang
mock_db = MagicMock()
mock_db.Base = MagicMock()
mock_db.engine = MagicMock()
mock_db.SessionLocal = MagicMock()
sys.modules["app.core.database"] = mock_db

print("Starting app.main with mocked database...")
try:
    from app.main import app
    import uvicorn
    print("App imported successfully! Starting uvicorn...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
except Exception as e:
    print(f"Failed to start app: {e}")
    import traceback
    traceback.print_exc()
