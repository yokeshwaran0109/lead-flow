import logging

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

POSTMARK_API_URL = "https://api.postmarkapp.com/email"


def render_email(heading: str, body_html: str, cta_url: str | None = None, cta_label: str | None = None) -> str:
    cta = ""
    if cta_url and cta_label:
        cta = (
            f'<a href="{cta_url}" style="background:#E8540B;color:#14110e;text-decoration:none;'
            f'font-weight:700;font-size:14px;padding:13px 28px;border-radius:8px;display:inline-block;'
            f'font-family:Arial,Helvetica,sans-serif">{cta_label}</a>'
        )
    return f"""
    <div style="background:#14110e;padding:40px 16px;font-family:Arial,Helvetica,sans-serif">
      <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#1c1814;
        border:1px solid #332c24;border-radius:14px;border-collapse:separate;overflow:hidden">
        <tr><td style="padding:28px 32px 0">
          <div style="font-weight:800;font-size:18px;color:#f0eae0">LEAD<span style="color:#E8540B">FLOW</span></div>
        </td></tr>
        <tr><td style="padding:20px 32px 4px">
          <h2 style="color:#f0eae0;font-size:19px;margin:0 0 12px;font-family:Arial,Helvetica,sans-serif">{heading}</h2>
          <div style="color:#b5ab9a;font-size:14.5px;line-height:1.65">{body_html}</div>
        </td></tr>
        {f'<tr><td style="padding:6px 32px 0">{cta}</td></tr>' if cta else ''}
        <tr><td style="padding:28px 32px 26px">
          <div style="border-top:1px solid #2a241d;padding-top:18px;color:#7d7466;font-size:12px">
            Lead Flow &middot; Editing services by Elyon
          </div>
        </td></tr>
      </table>
    </div>
    """


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
