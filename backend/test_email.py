import asyncio
import os
from dotenv import load_dotenv

# Force load first to be sure, though app.core.config should do it now
load_dotenv()

from app.core.config import settings
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

# debug print
print(f"Username: {settings.MAIL_USERNAME}")
# print(f"Password: {settings.MAIL_PASSWORD}") # Don't print password

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False
)

async def send_test():
    print(f"Attempting to send email to {settings.MAIL_USERNAME}...")
    message = MessageSchema(
        subject="DEBUG: AgenticAI Email Test",
        recipients=[settings.MAIL_USERNAME],
        body="<h1>It Works!</h1><p>Your email configuration is correct.</p>",
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print("SUCCESS: Email sent successfully!")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(send_test())
