
import os
import subprocess
import time

def kill_process(name):
    print(f"Killing {name}...")
    subprocess.run(f"taskkill /F /IM {name} /T", shell=True, capture_output=True)

def start_backend():
    print("Starting backend...")
    cwd = r"c:\Users\maina\Downloads\AgenticAI\backend"
    cmd = r".\venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
    with open("backend_startup.log", "w") as f:
        subprocess.Popen(cmd, shell=True, cwd=cwd, stdout=f, stderr=f)

def start_frontend():
    print("Starting frontend...")
    cwd = r"c:\Users\maina\Downloads\AgenticAI\frontend"
    cmd = "npm run dev"
    with open("frontend_startup.log", "w") as f:
        subprocess.Popen(cmd, shell=True, cwd=cwd, stdout=f, stderr=f)

if __name__ == "__main__":
    kill_process("python.exe")
    kill_process("node.exe")
    time.sleep(2)
    start_backend()
    start_frontend()
    print("Startup initiated. Check logs for details.")
