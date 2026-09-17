import logging

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

POSTMARK_API_URL = "https://api.postmarkapp.com/email"


def send_email(to: str, subject: str, html: str) -> None:
    if not settings.postmark_api_token:
        return
    try:
        response = requests.post(
            POSTMARK_API_URL,
            json={
                "From": settings.email_from,
                "To": to,
                "Subject": subject,
                "HtmlBody": html,
            },
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Postmark-Server-Token": settings.postmark_api_token,
            },
            timeout=10,
        )
        response.raise_for_status()
    except Exception:
        logger.warning("Failed to send email to %s", to, exc_info=True)
