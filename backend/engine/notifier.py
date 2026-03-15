import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


def send_notification_email(
    to_email: str,
    step_name: str,
    workflow_name: str,
    input_data: dict,
    template: str = "default"
):
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("⚠️ Email credentials not set — skipping notification")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[Halleyx] Notification — {step_name}"
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email

        # Build email body
        input_rows = "".join(
            f"<tr><td style='padding:6px 12px;color:#888;'>{k}</td>"
            f"<td style='padding:6px 12px;color:#fff;'>{v}</td></tr>"
            for k, v in input_data.items()
        )

        html = f"""
        <html>
        <body style="background:#0f0f0f;font-family:sans-serif;padding:32px;">
            <div style="max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:12px;padding:32px;border:1px solid #333;">
                <div style="background:#7c3aed;width:40px;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;">
                    <span style="color:white;font-weight:bold;font-size:18px;">H</span>
                </div>
                <h2 style="color:#fff;margin:0 0 8px;">Workflow Notification</h2>
                <p style="color:#888;margin:0 0 24px;">
                    Step <strong style="color:#a78bfa">{step_name}</strong> 
                    has been triggered in workflow <strong style="color:#a78bfa">{workflow_name}</strong>.
                </p>
                <table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;overflow:hidden;">
                    <thead>
                        <tr style="background:#222;">
                            <th style="padding:8px 12px;text-align:left;color:#666;font-size:12px;">Field</th>
                            <th style="padding:8px 12px;text-align:left;color:#666;font-size:12px;">Value</th>
                        </tr>
                    </thead>
                    <tbody>{input_rows}</tbody>
                </table>
                <p style="color:#555;font-size:12px;margin-top:24px;">
                    Sent by Halleyx Workflow Engine
                </p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())

        print(f"✅ Email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Email failed: {e}")
        return False


def send_approval_request_email(
    to_email: str,
    step_name: str,
    workflow_name: str,
    execution_id: str,
    input_data: dict
):
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("⚠️ Email credentials not set — skipping approval email")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[Halleyx] Approval Required — {step_name}"
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email

        input_rows = "".join(
            f"<tr><td style='padding:6px 12px;color:#888;'>{k}</td>"
            f"<td style='padding:6px 12px;color:#fff;'>{v}</td></tr>"
            for k, v in input_data.items()
        )

        approve_url = f"http://localhost:3000/approve/{execution_id}"



        html = f"""
        <html>
        <body style="background:#0f0f0f;font-family:sans-serif;padding:32px;">
            <div style="max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:12px;padding:32px;border:1px solid #333;">
                <div style="background:#7c3aed;width:40px;height:40px;border-radius:8px;margin-bottom:20px;">
                    <span style="color:white;font-weight:bold;font-size:18px;padding:10px;">H</span>
                </div>
                <h2 style="color:#fff;margin:0 0 8px;">Approval Required</h2>
                <p style="color:#888;margin:0 0 24px;">
                    Step <strong style="color:#a78bfa">{step_name}</strong> in 
                    <strong style="color:#a78bfa">{workflow_name}</strong> 
                    is waiting for your approval.
                </p>
                <table style="width:100%;border-collapse:collapse;background:#111;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                    <thead>
                        <tr style="background:#222;">
                            <th style="padding:8px 12px;text-align:left;color:#666;font-size:12px;">Field</th>
                            <th style="padding:8px 12px;text-align:left;color:#666;font-size:12px;">Value</th>
                        </tr>
                    </thead>
                    <tbody>{input_rows}</tbody>
                </table>
                <div style="display:flex;gap:12px;">
                    <a href="{approve_url}?action=approve" 
                       style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
                        Approve
                    </a>
                    <a href="{approve_url}?action=reject"
                       style="background:#7f1d1d;color:#fca5a5;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
                        Reject
                    </a>
                </div>
                <p style="color:#555;font-size:12px;margin-top:24px;">
                    Execution ID: {execution_id}
                </p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())

        print(f"✅ Approval email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Approval email failed: {e}")
        return False