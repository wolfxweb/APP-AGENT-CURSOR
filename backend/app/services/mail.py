import logging
from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_password_reset_email(to_email: str, reset_link: str) -> None:
    if not settings.smtp_host or not settings.smtp_user:
        logger.warning(
            "SMTP não configurado — link de redefinição (dev): %s", reset_link
        )
        return

    html = f"""\
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f1f1a;">
  <p>Recuperação de senha — <strong>SuccessWay</strong></p>
  <p>Clique no link abaixo para definir uma nova senha (válido por tempo limitado):</p>
  <p><a href="{reset_link}">Redefinir senha</a></p>
  <p>Se você não solicitou, ignore este e-mail.</p>
</body>
</html>"""

    msg = EmailMessage()
    msg["Subject"] = "Recuperação de senha — SuccessWay"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg.set_content(
        f"Redefina sua senha em: {reset_link}\n\nSe não solicitou, ignore."
    )
    msg.add_alternative(html, subtype="html")

    smtp = aiosmtplib.SMTP(
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        start_tls=True,
    )
    async with smtp:
        if settings.smtp_password:
            await smtp.login(settings.smtp_user, settings.smtp_password)
        await smtp.send_message(msg)
