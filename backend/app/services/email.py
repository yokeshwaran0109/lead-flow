import logging

import resend

from app.core.config import settings

resend.api_key = settings.resend_api_key

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html: str) -> None:
    if not settings.resend_api_key:
        return
    try:
        resend.Emails.send(
            {
                "from": settings.email_from,
                "to": to,
                "subject": subject,
                "html": html,
            }
        )
    except Exception:
        logger.warning("Failed to send email to %s", to, exc_info=True)
