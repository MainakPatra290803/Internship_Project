from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import string
from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.core import security
from app.core.config import settings

router = APIRouter()

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from google.oauth2 import id_token
from google.auth.transport import requests


# Email Configuration
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True if settings.MAIL_USERNAME else False,
    VALIDATE_CERTS=False
)

async def send_email(email_to: str, subject: str, body: str):

    # --- Legacy SMTP / Mock ---
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        print(f"\n[EMAIL MOCK] To: {email_to}")
        print(f"[EMAIL MOCK] Subject: {subject}")
        print(f"[EMAIL MOCK] Body: {body}\n")
        
        with open("debug_otp.txt", "w") as f:
            f.write(body)
        return

    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        body=body,
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"[SUCCESS] OTP email sent to {email_to}")
    except Exception as e:
        print(f"[FAIL] SMTP Error: {e}")
        print(f"[MOCK] Code for {email_to} is in backend/debug_otp.txt")
        with open("debug_otp.txt", "w") as f:
            f.write(body)

def generate_otp():
    # Dynamic 6-digit OTP
    return ''.join(random.choices(string.digits, k=6))

@router.post("/request-otp")
async def request_otp(request: schemas.OTPRequest = Body(...), db: Session = Depends(get_db)):
    try:
        # 1. Generate OTP
        # FALLBACK: If no email credentials, use a fixed code for easy local development
        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
            otp_code = "123456"
        else:
            otp_code = generate_otp()
            
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        # 2. Save to DB
        existing_otp = db.query(models.OTP).filter(models.OTP.email == request.email).first()
        if existing_otp:
            db.delete(existing_otp)
            db.commit()
            
        otp_entry = models.OTP(email=request.email, otp_code=otp_code, expires_at=expires_at)
        db.add(otp_entry)
        db.commit()
        
        # 3. Send Email
        print(f"DEBUG OTP: {otp_code}")
        await send_email(
            request.email, 
            "Your AI Tutor Verification Code", 
            f"Your OTP code is: <b>{otp_code}</b>. It expires in 10 minutes."
        )
        
        return {"message": "OTP sent"}
    except Exception as e:
        with open("debug_auth_error.log", "a") as f:
            f.write(f"OTP Error: {str(e)}\n")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/signup")
async def signup(request: schemas.SignupRequest = Body(...), db: Session = Depends(get_db)):
    # 1. Verify OTP
    otp_entry = db.query(models.OTP).filter(models.OTP.email == request.email).first()
    if not otp_entry:
        raise HTTPException(status_code=400, detail="OTP request not found")
        
    if otp_entry.otp_code != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if otp_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
        
    # 2. Check if user exists
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    try:
        # 3. Create User
        hashed_pwd = security.get_password_hash(request.password)
        new_user = models.User(
            email=request.email, 
            hashed_password=hashed_pwd, 
            role="student",
            is_verified=True
        )
        db.add(new_user)
        db.flush() # Get new_user.id without committing
        
        # 4. Create Student Profile automatically if it doesn't exist
        # It's possible a student profile was auto-created by a frontend demo with a hardcoded user_id
        student_profile = db.query(models.Student).filter(models.Student.user_id == new_user.id).first()
        if not student_profile:
            student_profile = models.Student(user_id=new_user.id)
            db.add(student_profile)
        
        # 5. Cleanup OTP
        db.delete(otp_entry)
        db.commit()
        db.refresh(new_user)
        
        await send_email(
            request.email,
            "Welcome to AI Tutor",
            "<h3>Ignition Successful!</h3><p>Your account has been created. You have been logged in automatically.</p>"
        )
        
        # 6. Generate Token for Automatic Login
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": new_user.email, "role": new_user.role, "id": new_user.id}, 
            expires_delta=access_token_expires
        )
        
        return {
            "message": "User created successfully",
            "access_token": access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        print(f"SIGNUP ERROR: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@router.post("/login", response_model=schemas.Token)
async def login(request: schemas.LoginRequest = Body(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    if not security.verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    # Generate Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}, expires_delta=access_token_expires
    )
    
    await send_email(
        request.email,
        "Login Alert",
        f"<p>New login detected for your account at {datetime.utcnow()}.</p>"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=schemas.Token)
async def google_login(request: schemas.GoogleLoginRequest = Body(...), db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Client ID not configured")
        
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            request.credential, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )

        email = idinfo.get('email')
        if not email:
            raise HTTPException(status_code=400, detail="No email provided by Google")

        # 1. Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        
        if not user:
            # 2. Automatically sign up the user if they don't exist
            # Generate a random secure password for the OAuth user
            random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
            hashed_pwd = security.get_password_hash(random_password)
            
            user = models.User(
                email=email, 
                hashed_password=hashed_pwd, 
                role="student",
                is_verified=True # Google already verified the email
            )
            db.add(user)
            db.flush()
            
            # Create Student Profile automatically
            student_profile = models.Student(user_id=user.id)
            db.add(student_profile)
            db.commit()
            db.refresh(user)
            
            await send_email(
                email,
                "Welcome to AI Tutor",
                "<h3>Ignition Successful via Google!</h3><p>Your account has been created via Google Sign-In.</p>"
            )
            
        # 3. Generate Token for the user (handles both login and auto-signup)
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": user.email, "role": user.role, "id": user.id}, 
            expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        # Invalid token
        print(f"GOOGLE AUTH ERROR: {e}")
        raise HTTPException(status_code=400, detail="Invalid Google token")
    except Exception as e:
        print(f"GOOGLE LOGIN ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/request-password-reset")
async def request_password_reset(request: schemas.PasswordResetRequest = Body(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # Don't reveal if user exists for security, just return success
        return {"message": "If this email is registered, you will receive a reset code."}
    
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    # Reuse OTP model
    existing_otp = db.query(models.OTP).filter(models.OTP.email == request.email).first()
    if existing_otp:
        db.delete(existing_otp)
    
    otp_entry = models.OTP(email=request.email, otp_code=otp_code, expires_at=expires_at)
    db.add(otp_entry)
    db.commit()
    
    await send_email(
        request.email,
        "Password Reset Code",
        f"Your password reset code is: <b>{otp_code}</b>. It expires in 15 minutes."
    )
    return {"message": "Reset code sent"}

@router.post("/reset-password")
async def reset_password(request: schemas.PasswordResetConfirm = Body(...), db: Session = Depends(get_db)):
    otp_entry = db.query(models.OTP).filter(models.OTP.email == request.email).first()
    if not otp_entry or otp_entry.otp_code != request.otp or otp_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    user.hashed_password = security.get_password_hash(request.new_password)
    db.delete(otp_entry)
    db.commit()
    
    await send_email(
        request.email,
        "Password Reset Successful",
        "<p>Your password has been changed successfully. You can now log in with your new password.</p>"
    )
    return {"message": "Password reset successfully"}
