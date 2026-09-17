import logging

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

POSTMARK_API_URL = "https://api.postmarkapp.com/email"

_FONT = "font-family:Arial,Helvetica,sans-serif"


def render_email(heading: str, body_html: str, cta_url: str | None = None, cta_label: str | None = None) -> str:
    """Generic branded card — used for emails outside the 4 studio-facing flows (e.g. admin alerts)."""
    cta = ""
    if cta_url and cta_label:
        cta = (
            f'<a href="{cta_url}" style="background:#E8540B;color:#14110e;text-decoration:none;'
            f'font-weight:700;font-size:14px;padding:13px 28px;border-radius:8px;display:inline-block;{_FONT}">{cta_label}</a>'
        )
    return f"""
    <div style="background:#14110e;padding:40px 16px;{_FONT}">
      <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#1c1814;
        border:1px solid #332c24;border-radius:14px;border-collapse:separate;overflow:hidden">
        <tr><td style="padding:28px 32px 0">
          <div style="font-weight:800;font-size:18px;color:#f0eae0">LEAD<span style="color:#E8540B">FLOW</span></div>
        </td></tr>
        <tr><td style="padding:20px 32px 4px">
          <h2 style="color:#f0eae0;font-size:19px;margin:0 0 12px;{_FONT}">{heading}</h2>
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


def _badge(text: str, color: str = "#FF7A3D", bg: str = "rgba(232,84,11,.15)", border: str = "rgba(232,84,11,.3)") -> str:
    return (
        f'<span style="background:{bg};border:1px solid {border};border-radius:100px;padding:5px 12px;'
        f'font-size:10.5px;font-weight:700;color:{color};letter-spacing:1px;text-transform:uppercase;'
        f'white-space:nowrap;{_FONT}">{text}</span>'
    )


def _cta(url: str, label: str, color: str = "#E8540B") -> str:
    return (
        f'<div style="text-align:center;padding:12px 0 4px">'
        f'<a href="{url}" style="display:inline-block;background:{color};color:#ffffff;text-decoration:none;'
        f'font-weight:700;font-size:14px;padding:14px 28px;border-radius:10px;{_FONT}">{label}</a></div>'
    )


def _p(html: str) -> str:
    return f'<p style="font-size:14.5px;color:#2a2420;line-height:1.7;margin:0 0 16px;{_FONT}">{html}</p>'


def _info_grid(pairs: list[tuple[str, str]]) -> str:
    rows = []
    for i in range(0, len(pairs), 2):
        chunk = pairs[i:i + 2]
        tds = "".join(
            f'<td width="50%" style="background:#f7f4f0;border-radius:8px;padding:14px 16px">'
            f'<div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#7d7466;'
            f'font-weight:700;margin-bottom:4px;{_FONT}">{lbl}</div>'
            f'<div style="font-size:14px;color:#2a2420;font-weight:600;{_FONT}">{val}</div></td>'
            for lbl, val in chunk
        )
        if len(chunk) == 1:
            tds += '<td width="50%">&nbsp;</td>'
        rows.append(f"<tr>{tds}</tr>")
    spacer = '<tr><td colspan="2" style="height:8px;line-height:8px;font-size:0">&nbsp;</td></tr>'
    return f'<table role="presentation" width="100%" style="margin:18px 0;border-collapse:separate">{spacer.join(rows)}</table>'


def _stage_bar(stage_index: int) -> str:
    labels = ["Received", "In Editing", "QC", "Delivered", "Invoice"]
    cells = []
    for i, label in enumerate(labels):
        if i < stage_index:
            dot = "background:#E8540B;border:2px solid #E8540B"
            label_color = "#7d7466"
        elif i == stage_index:
            dot = "background:#ffffff;border:3px solid #E8540B"
            label_color = "#E8540B"
        else:
            dot = "background:#e8e4de;border:2px solid #ddd9d3"
            label_color = "#9d9890"
        cells.append(
            f'<td align="center" style="padding:0 4px">'
            f'<div style="width:16px;height:16px;border-radius:50%;{dot};margin:0 auto 6px;font-size:0;line-height:0">&nbsp;</div>'
            f'<div style="font-size:9px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:{label_color};{_FONT}">{label}</div>'
            f"</td>"
        )
    return (
        '<table role="presentation" width="100%" style="background:#f7f4f0;border-radius:10px;padding:16px 8px;margin:18px 0">'
        f"<tr>{''.join(cells)}</tr></table>"
    )


def _email_shell(badge_html: str, eyebrow: str, heading: str, subtext: str, body_html: str, hero_dark: bool = True) -> str:
    if hero_dark:
        hero_bg = "background:linear-gradient(160deg,#1b1712 0%,#14110e 100%);border-bottom:1px solid #2a241d;"
        eyebrow_color = "#E8540B"
    else:
        hero_bg = "background:linear-gradient(160deg,#111a11 0%,#0e150e 100%);border-bottom:1px solid #1a2e1a;"
        eyebrow_color = "#7da97a"
    return f"""
    <div style="background:#f5f3f0;padding:32px 12px;{_FONT}">
      <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;
        border-radius:12px;overflow:hidden;border-collapse:separate">
        <tr><td style="background:#14110e;padding:24px 32px">
          <table role="presentation" width="100%"><tr>
            <td style="font-weight:800;font-size:19px;color:#f0eae0;{_FONT}">
              LEAD<span style="color:#E8540B">FLOW</span>
              <div style="font-size:9px;font-weight:600;letter-spacing:2px;color:#7d7466;text-transform:uppercase;margin-top:2px">Studio Portal</div>
            </td>
            <td align="right" valign="top">{badge_html}</td>
          </tr></table>
        </td></tr>
        <tr><td style="{hero_bg}padding:32px">
          <div style="font-size:10.5px;letter-spacing:3px;text-transform:uppercase;color:{eyebrow_color};font-weight:700;margin-bottom:10px;{_FONT}">{eyebrow}</div>
          <div style="font-size:23px;font-weight:700;color:#f0eae0;margin-bottom:8px;line-height:1.25;{_FONT}">{heading}</div>
          <div style="font-size:14px;color:#b5ab9a;line-height:1.6;max-width:480px">{subtext}</div>
        </td></tr>
        <tr><td style="padding:32px">{body_html}</td></tr>
        <tr><td style="background:#14110e;padding:20px 32px">
          <div style="font-size:11.5px;color:#7d7466;line-height:1.6">
            <b style="color:#b5ab9a">Lead Flow</b> &middot; Studio Editing Portal &middot; Editing by <b style="color:#b5ab9a">Elyon</b><br>
            This is an automated message.
          </div>
        </td></tr>
      </table>
    </div>
    """


def render_verify_email(studio_name: str, confirm_url: str, expire_hours: int) -> str:
    body = (
        _p(f"Hi <b>{studio_name}</b>,")
        + _p(
            f"Thanks for signing up with Lead Flow. Click below to confirm your email and set up your "
            f"account. This link expires in <b>{expire_hours} hours</b>."
        )
        + _cta(confirm_url, "Confirm my account &rarr;")
        + f'<p style="font-size:13px;color:#9d9890;margin-top:16px;{_FONT}">If you didn\'t create a Lead Flow account, you can safely ignore this email.</p>'
    )
    return _email_shell(
        _badge("Verify Account"),
        "Welcome to Lead Flow",
        "Confirm your studio account",
        "You're one step away from accessing your Lead Flow editing portal.",
        body,
    )


def render_status_email(
    studio_name: str, job_name: str, job_ref: str, spec: str, turnaround: str,
    stage_label: str, stage_index: int, portal_url: str,
) -> str:
    body = (
        _p(f"Hi <b>{studio_name}</b>,")
        + _p(f"Your job <b>{job_name}</b> has moved to the next stage.")
        + _info_grid([
            ("Job Reference", job_ref),
            ("Current Stage", f'<span style="color:#E8540B">{stage_label}</span>'),
            ("Specification", spec),
            ("Turnaround", turnaround),
        ])
        + _stage_bar(min(stage_index, 4))
        + _cta(portal_url, "View Job in Portal &rarr;")
    )
    return _email_shell(
        _badge(stage_label),
        "Job Status Update",
        f"Your shoot is now {stage_label.lower()}",
        "Track live progress any time in your portal.",
        body,
    )


def render_invoice_email(
    studio_name: str, job_name: str, job_ref: str, invoice_number: str, issued_date: str,
    lines: list[dict], total_amount: float, note: str, portal_url: str,
) -> str:
    line_rows = []
    subtotal = 0.0
    tax = 0.0
    tax_label = "Tax"
    for line in lines:
        amount = float(line.get("amount", 0))
        desc = line.get("description", "")
        is_tax = str(desc).lower().startswith("tax")
        if is_tax:
            tax += amount
            tax_label = desc
        else:
            subtotal += amount
        line_rows.append(
            f'<tr><td style="padding:12px 0;border-bottom:1px solid #f3efe9;font-size:13.5px;color:#2a2420;{_FONT}">'
            f'{desc}<br><small style="font-size:11.5px;color:#9d9890">{job_name}</small></td>'
            f'<td style="padding:12px 0;border-bottom:1px solid #f3efe9;font-size:13.5px;color:#2a2420;{_FONT}">{line.get("qty", "")}</td>'
            f'<td align="right" style="padding:12px 0;border-bottom:1px solid #f3efe9;font-size:13.5px;color:#2a2420;font-weight:600;{_FONT}">£{amount:.2f}</td></tr>'
        )
    table = (
        '<table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0">'
        f'<tr><th align="left" style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#7d7466;'
        f'padding:10px 0;border-bottom:1px solid #ede9e3;{_FONT}">Description</th>'
        f'<th align="left" style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#7d7466;'
        f'padding:10px 0;border-bottom:1px solid #ede9e3;{_FONT}">Qty</th>'
        f'<th align="right" style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#7d7466;'
        f'padding:10px 0;border-bottom:1px solid #ede9e3;{_FONT}">Amount</th></tr>'
        + "".join(line_rows)
        + "</table>"
    )
    totals = f'<div style="text-align:right;font-size:13.5px;color:#6b6560;padding:6px 0;{_FONT}">Subtotal: <b style="color:#2a2420">£{subtotal:.2f}</b></div>'
    if tax > 0:
        totals += f'<div style="text-align:right;font-size:13.5px;color:#6b6560;padding:6px 0;{_FONT}">{tax_label}: <b style="color:#2a2420">£{tax:.2f}</b></div>'
    totals += (
        f'<div style="text-align:right;font-size:18px;font-weight:700;color:#2a2420;border-top:2px solid #ede9e3;'
        f'padding-top:12px;margin-top:4px;{_FONT}">Total Due: <span style="color:#E8540B">£{total_amount:.2f}</span></div>'
    )
    note_block = ""
    if note:
        note_block = (
            f'<div style="background:#f7f4f0;border-left:3px solid #E8540B;border-radius:0 8px 8px 0;'
            f'padding:14px 18px;margin:18px 0;font-size:13.5px;color:#2a2420;{_FONT}">{note}</div>'
        )
    body = (
        _p(f"Hi <b>{studio_name}</b>,")
        + _p(f"Thank you for working with Elyon via Lead Flow. Your invoice for <b>{job_name}</b> is now ready.")
        + _info_grid([
            ("Invoice Number", invoice_number),
            ("Job Reference", job_ref),
            ("Issue Date", issued_date),
            ("Status", "Awaiting payment"),
        ])
        + table
        + totals
        + note_block
        + _cta(portal_url, "View Invoice in Portal &rarr;")
    )
    return _email_shell(
        _badge("Invoice Ready"),
        "Invoice from Elyon",
        "Your invoice is ready for payment",
        "Please find your invoice details below.",
        body,
    )


def render_invoice_closed_email(
    studio_name: str, job_name: str, job_ref: str, invoice_number: str,
    total_amount: float, paid_date: str, portal_url: str,
) -> str:
    body = (
        _p(f"Hi <b>{studio_name}</b>,")
        + _p(f"We've received your payment for invoice <b>{invoice_number}</b>. This job is now fully closed.")
        + f"""<div style="background:#f7f4f0;border-left:3px solid #7da97a;border-radius:0 8px 8px 0;padding:16px 20px;margin:20px 0">
            <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#7d7466;font-weight:700;margin-bottom:4px;{_FONT}">Payment Confirmed</div>
            <div style="font-size:14px;color:#5a8a57;font-weight:600;{_FONT}">£{total_amount:.2f} received on {paid_date}</div>
          </div>"""
        + _info_grid([
            ("Invoice Number", invoice_number),
            ("Job Reference", job_ref),
            ("Job Name", job_name),
            ("Closed On", paid_date),
        ])
        + f"""<div style="text-align:center;padding:16px 0 8px">
            <span style="display:inline-block;border:1.5px solid #7da97a;color:#7da97a;border-radius:8px;
              padding:5px 14px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;{_FONT}">&#10003; Invoice Paid</span>
          </div>"""
        + _cta(portal_url, "View Receipt in Portal &rarr;", color="#5a8a57")
    )
    return _email_shell(
        _badge("Payment Received", color="#7da97a", bg="rgba(125,169,122,.15)", border="rgba(125,169,122,.3)"),
        "Job Complete",
        "Payment received &mdash; job closed &#10003;",
        "Thank you for working with Elyon.",
        body,
        hero_dark=False,
    )


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
