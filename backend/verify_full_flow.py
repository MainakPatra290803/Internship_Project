import requests
import time
from app.core.database import SessionLocal
from app.models import models

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = f"test_user_{int(time.time())}@example.com"
PASSWORD = "SecurePass123!"

def get_otp_from_db(email):
    db = SessionLocal()
    try:
        otp = db.query(models.OTP).filter(models.OTP.email == email).first()
        return otp.otp_code if otp else None
    finally:
        db.close()

def run_e2e_test():
    with requests.Session() as s:
        # 1. Request OTP
        print(f"\n1. Requesting OTP for {EMAIL}...")
        r = s.post(f"{BASE_URL}/auth/request-otp", json={"email": EMAIL})
        if r.status_code != 200:
            print(f"FAIL: Request OTP {r.text}")
            return False
        
        # 2. Get OTP from DB (Cheat)
        time.sleep(1) # Wait for DB write
        otp_code = get_otp_from_db(EMAIL)
        if not otp_code:
            print("FAIL: OTP not found in DB")
            return False
        print(f"   OTP Retrieved: {otp_code}")
        
        # 3. Signup
        print("2. Signing Up...")
        r = s.post(f"{BASE_URL}/auth/signup", json={
            "email": EMAIL,
            "otp": otp_code,
            "password": PASSWORD
        })
        if r.status_code != 200:
            print(f"FAIL: Signup {r.text}")
            return False
            
        # 4. Login
        print("3. Logging In...")
        r = s.post(f"{BASE_URL}/auth/login", json={
            "email": EMAIL,
            "password": PASSWORD
        })
        if r.status_code != 200:
            print(f"FAIL: Login {r.text}")
            return False
        
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   Logged in successfully.")
        
        # 5. Chat Test
        print("4. Testing Chat...")
        r = s.post(f"{BASE_URL}/learning/chat?user_id=1", json={"role": "user", "content": "Hello AI"}, headers=headers)
        if r.status_code != 200:
             print(f"FAIL: Chat {r.text}")
             return False
        print("   Chat response received.")
             
        # 6. Quiz Gen Test
        print("5. Testing Quiz Generation...")
        r = s.post(f"{BASE_URL}/learning/quiz/generate?topic=Math&difficulty=Medium", headers=headers)
        if r.status_code != 200:
             print(f"FAIL: Quiz Gen {r.text}")
             return False
        print("   Quiz generated successfully.")
        
    print("\nSUCCESS: All Systems Operational! 🚀")
    return True

if __name__ == "__main__":
    if run_e2e_test():
        exit(0)
    else:
        exit(1)
