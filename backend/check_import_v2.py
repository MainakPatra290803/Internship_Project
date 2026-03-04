
import sys
import os

def check_import(module_name):
    print(f"Trying to import {module_name}...")
    try:
        __import__(module_name)
        print(f"Successfully imported {module_name}")
    except Exception as e:
        print(f"Failed to import {module_name}: {e}")
        import traceback
        traceback.print_exc()

print("STREAK: Starting granular import check")
check_import("app.core.config")
check_import("app.core.database")
check_import("app.models.models")
check_import("app.core.llm")
check_import("app.api.endpoints.auth")
check_import("app.api.endpoints.psychology")
check_import("app.api.endpoints.instructor")
check_import("app.api.endpoints.learning")
check_import("app.main")
print("STREAK: Granular import check finished")
