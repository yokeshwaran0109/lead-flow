import resend

from app.core.config import settings

resend.api_key = settings.resend_api_key


def send_email(to: str, subject: str, html: str) -> None:
    if not settings.resend_api_key:
        return
    resend.Emails.send(
        {
            "from": settings.email_from,
            "to": to,
            "subject": subject,
            "html": html,
        }
    )
