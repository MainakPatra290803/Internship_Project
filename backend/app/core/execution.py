import os
import subprocess
import tempfile
import time
from typing import Dict, Any, List

class ExecutionSandbox:
    def __init__(self, timeout_seconds: int = 2):
        self.timeout = timeout_seconds

    def run_python_code(self, source_code: str, test_cases: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        MVP approach using temporary files and subprocess.
        WARNING: This is not a strict Docker isolated environment yet.
        It uses OS-level timeouts to prevent infinite loops.
        """
        results = {
            "total_cases": len(test_cases),
            "passed_cases": 0,
            "failed_cases": 0,
            "execution_time_ms": 0,
            "memory_used_kb": 0, # Placeholder for Windows. Robust limits require Docker.
            "status": "Success",
            "details": []
        }

        # Create a temporary directory to host the script
        with tempfile.TemporaryDirectory() as temp_dir:
            script_path = os.path.join(temp_dir, "solution.py")
            with open(script_path, "w") as f:
                f.write(source_code)

            total_start_time = time.time()
            for tc in test_cases:
                input_data = tc.get("input", tc.get("input_data", ""))
                expected_output = tc.get("output", tc.get("expected_output", "")).strip()

                try:
                    # Run the Python script as a subprocess
                    process = subprocess.run(
                        ["python", script_path],
                        input=input_data,
                        text=True,
                        capture_output=True,
                        timeout=self.timeout
                    )
                    
                    actual_output = process.stdout.strip()
                    error_output = process.stderr.strip()

                    if process.returncode != 0:
                        results["failed_cases"] += 1
                        results["details"].append({
                            "input": input_data,
                            "expected": expected_output,
                            "actual": error_output,
                            "passed": False,
                            "error": True
                        })
                    elif actual_output == expected_output:
                        results["passed_cases"] += 1
                        results["details"].append({
                            "input": input_data,
                            "expected": expected_output,
                            "actual": actual_output,
                            "passed": True
                        })
                    else:
                        results["failed_cases"] += 1
                        results["details"].append({
                            "input": input_data,
                            "expected": expected_output,
                            "actual": actual_output,
                            "passed": False
                        })
                except subprocess.TimeoutExpired:
                    results["failed_cases"] += 1
                    results["status"] = "Timeout Limit Exceeded"
                    results["details"].append({
                        "input": input_data,
                        "expected": expected_output,
                        "actual": "TIMEOUT",
                        "passed": False
                    })
                    break # Stop evaluation on timeout
                except Exception as e:
                    results["failed_cases"] += 1
                    results["status"] = "Execution Error"
                    results["details"].append({
                        "passed": False,
                        "error": str(e)
                    })
            
            total_end_time = time.time()
            results["execution_time_ms"] = int((total_end_time - total_start_time) * 1000)

        results["score"] = (results["passed_cases"] / results["total_cases"] * 100.0) if results["total_cases"] > 0 else 0.0
        return results

# Singleton instance
sandbox = ExecutionSandbox()
