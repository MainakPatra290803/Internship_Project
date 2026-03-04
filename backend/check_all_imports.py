
import os
import sys

def check_imports(path, prefix=""):
    for item in os.listdir(path):
        if item.startswith("__") or item == ".env" or item == "venv":
            continue
        
        full_path = os.path.join(path, item)
        module_name = prefix + item.replace(".py", "")
        
        if os.path.isdir(full_path):
            if os.path.exists(os.path.join(full_path, "__init__.py")):
                check_imports(full_path, module_name + ".")
        elif item.endswith(".py"):
            print(f"IMPORTING: {module_name} ...", end=" ", flush=True)
            try:
                __import__(module_name)
                print("OK")
            except Exception as e:
                print(f"FAIL: {e}")

if __name__ == "__main__":
    sys.path.append(os.getcwd())
    check_imports("app", "app.")
