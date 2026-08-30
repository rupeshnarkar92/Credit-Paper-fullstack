import logging
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _send_sync(to_email: str, subject: str, html_content: str) -> bool:
    try:
        message = MIMEMultipart("alternative")
        message["From"] = settings.SMTP_FROM
        message["To"] = to_email
        message["Subject"] = subject

        html_part = MIMEText(html_content, "html")
        message.attach(html_part)

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, to_email, message.as_string())
        server.quit()

        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        print(f"\nEMAIL FAILED: {e}\n")
        return False


def _background_send(to_email: str, subject: str, html_content: str, url: str, link_type: str) -> None:
    sent = _send_sync(to_email, subject, html_content)

    label = "VERIFICATION" if link_type == "verify" else "PASSWORD RESET"
    print(f"\n{'='*60}")
    print(f"  {label} LINK")
    print(f"  To: {to_email}")
    if sent:
        print(f"  Method: Email sent via Gmail SMTP")
        print(f"  Check your inbox (and spam folder)")
    else:
        print(f"  Method: Console (email failed)")
        print(f"")
        print(f"  Copy this link:")
        print(f"  {url}")
    print(f"{'='*60}\n")


def send_verification_email(email: str, token: str) -> None:
    verification_url = f"{settings.FRONTEND_URL}/verify?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#edf1f7; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#edf1f7; padding:40px 0;">
            <tr>
                <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <tr>
                            <td style="background-color:#14b8a6; padding:30px; text-align:center;">
                                <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                    <tr>
                                        <td style="padding-right:9px; vertical-align:middle;">
                                            <table cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="width:26px; height:26px; background-color:#ffffff; border-radius:6px; text-align:center; vertical-align:middle;">
                                                        <span style="color:#14b8a6; font-size:12px; font-weight:700; line-height:26px;">C</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                        <td style="vertical-align:middle;">
                                            <span style="font-size:18px; font-weight:700; color:#ffffff; letter-spacing:0.04em;">CREDITPAPER</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:40px 30px; text-align:center;">
                                <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Verify Your Email</h2>
                                <p style="color:#64748b; margin:0 0 30px; font-size:15px; line-height:1.6;">
                                    Thank you for registering!<br>
                                    Click the button below to verify your email address.
                                </p>
                                <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                    <tr>
                                        <td style="background-color:#14b8a6; border-radius:8px;">
                                            <a href="{verification_url}" style="display:inline-block; padding:14px 40px; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700;">
                                                Verify Email
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color:#94a3b8; margin:30px 0 10px; font-size:13px;">Or copy and paste this link:</p>
                                <p style="word-break:break-all; margin:0;"><a href="{verification_url}" style="color:#14b8a6; font-size:13px; text-decoration:none;">{verification_url}</a></p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color:#f8fafc; padding:20px 30px; text-align:center; border-top:1px solid #e2e8f0;">
                                <p style="color:#94a3b8; margin:0; font-size:12px;">This link expires in 15 minutes.</p>
                                <p style="color:#94a3b8; margin:4px 0 0; font-size:12px;">If you didn't register, ignore this email.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    thread = threading.Thread(target=_background_send, args=(email, "Verify your email - CreditPaper", html, verification_url, "verify"))
    thread.daemon = True
    thread.start()


def send_password_reset_email(email: str, token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#edf1f7; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#edf1f7; padding:40px 0;">
            <tr>
                <td align="center">
                    <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                        <tr>
                            <td style="background-color:#14b8a6; padding:30px; text-align:center;">
                                <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                    <tr>
                                        <td style="padding-right:9px; vertical-align:middle;">
                                            <table cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="width:26px; height:26px; background-color:#ffffff; border-radius:6px; text-align:center; vertical-align:middle;">
                                                        <span style="color:#14b8a6; font-size:12px; font-weight:700; line-height:26px;">C</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                        <td style="vertical-align:middle;">
                                            <span style="font-size:18px; font-weight:700; color:#ffffff; letter-spacing:0.04em;">CREDITPAPER</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:40px 30px; text-align:center;">
                                <h2 style="color:#1e293b; margin:0 0 16px; font-size:20px;">Reset your password</h2>
                                <p style="color:#64748b; margin:0 0 30px; font-size:15px; line-height:1.6;">
                                    We received a request to reset your password.<br>
                                    Click the button below to choose a new one.
                                </p>
                                <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                    <tr>
                                        <td style="background-color:#14b8a6; border-radius:8px;">
                                            <a href="{reset_url}" style="display:inline-block; padding:14px 40px; color:#ffffff; text-decoration:none; font-size:16px; font-weight:700;">
                                                Reset password
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color:#94a3b8; margin:30px 0 10px; font-size:13px;">Or copy and paste this link:</p>
                                <p style="word-break:break-all; margin:0;"><a href="{reset_url}" style="color:#14b8a6; font-size:13px; text-decoration:none;">{reset_url}</a></p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color:#f8fafc; padding:20px 30px; text-align:center; border-top:1px solid #e2e8f0;">
                                <p style="color:#94a3b8; margin:0; font-size:12px;">This link expires in 15 minutes.</p>
                                <p style="color:#94a3b8; margin:4px 0 0; font-size:12px;">If you didn't request this, ignore this email.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    thread = threading.Thread(target=_background_send, args=(email, "Reset your password - CreditPaper", html, reset_url, "reset"))
    thread.daemon = True
    thread.start()
