import requests
from app.core import security
from app.models import models
from app.core.database import get_sessionlocal
from datetime import timedelta
from app.core.config import settings

def test():
    db = get_sessionlocal()()
    user = db.query(models.User).filter(models.User.email == "mainakp2003@gmail.com").first()
    if not user:
        print("User not found in test script")
        return

    # Create dummy token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}, expires_delta=access_token_expires
    )
    
    print("Token created:", token[:15], "...")
    print("Fetching dashboard...")
    dashboard_res = requests.get(
        "http://localhost:8000/api/v1/student/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    print("Dashboard status:", dashboard_res.status_code)
    
    if dashboard_res.status_code != 200:
        print("Dashboard Error:", dashboard_res.text)
    else:
        print("Dashboard success! Partial response:", dashboard_res.text[:200])

if __name__ == "__main__":
    test()
