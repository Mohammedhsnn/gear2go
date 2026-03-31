import nodemailer from "nodemailer";

type SendVerificationEmailInput = {
  to: string;
  displayName?: string | null;
  verificationUrl: string;
};

type VerificationMailContent = {
  subject: string;
  text: string;
  html: string;
};

export function isEmailDeliveryConfigured(): boolean {
  return isBrevoConfigured() || isSmtpConfigured();
}

function getBaseUrl() {
  return process.env.APP_BASE_URL || "http://localhost:3000";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function isBrevoConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

function isPlaceholderSender(value: string): boolean {
  return /@example\.com>?$/i.test(value.trim());
}

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM,
  );
}

function parseFrom(fromRaw: string): { email: string; name?: string } {
  const trimmed = fromRaw.trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);
  if (!match) {
    return { email: trimmed };
  }

  const name = match[1]?.trim().replace(/^"|"$/g, "");
  const email = match[2]?.trim();
  return name ? { email, name } : { email };
}

function buildTransport() {
  return nodemailer.createTransport({
    host: requireEnv("SMTP_HOST"),
    port: Number(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: requireEnv("SMTP_USER"),
      pass: requireEnv("SMTP_PASS"),
    },
  });
}

function buildVerificationMailContent(input: SendVerificationEmailInput): VerificationMailContent {
  const firstName = input.displayName?.trim() || "daar";
  const appName = "Gear2Go";
  const loginUrl = `${getBaseUrl()}/dashboard`;
  const subject = `${appName}: bevestig je e-mailadres`;
  const text = `Hi ${firstName},\n\nWelkom bij ${appName}.\n\nCONFIRMATIELINK:\n${input.verificationUrl}\n\nKlik op de link hierboven om je e-mailadres te bevestigen.\n\nNa bevestiging kun je inloggen via: ${loginUrl}\n\nAls jij dit niet was, kun je deze mail negeren.`;
  const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
        <h2 style="margin: 0 0 12px;">Welkom bij ${appName}</h2>
        <p>Hi ${firstName},</p>
        <p>Bevestig je e-mailadres om je account te activeren.</p>
        <p style="margin: 16px 0 8px; font-weight: 700;">Confirmatielink:</p>
        <p style="margin: 0 0 18px;"><a href="${input.verificationUrl}">${input.verificationUrl}</a></p>
        <p style="margin: 20px 0;">
          <a href="${input.verificationUrl}" style="display:inline-block;padding:12px 20px;background:#0b6bcb;color:#fff;text-decoration:none;font-weight:bold;">E-mailadres bevestigen</a>
        </p>
        <p>Na bevestiging kun je inloggen via <a href="${loginUrl}">${loginUrl}</a>.</p>
        <p style="margin-top: 20px; color:#555; font-size: 12px;">Als jij dit niet was, kun je deze mail negeren.</p>
      </div>
    `;

  return { subject, text, html };
}

async function sendViaBrevo(input: SendVerificationEmailInput) {
  const fromRaw = process.env.BREVO_SENDER || process.env.SMTP_FROM || "";
  if (!fromRaw) {
    throw new Error("BREVO_SENDER_NOT_CONFIGURED");
  }
  if (isPlaceholderSender(fromRaw)) {
    throw new Error("BREVO_SENDER_NOT_VERIFIED");
  }
  const sender = parseFrom(fromRaw);
  const content = buildVerificationMailContent(input);

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": requireEnv("BREVO_API_KEY"),
    },
    body: JSON.stringify({
      sender,
      to: [{ email: input.to, name: input.displayName ?? undefined }],
      subject: content.subject,
      textContent: content.text,
      htmlContent: content.html,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Brevo delivery failed (${response.status}): ${details}`);
  }
}

export async function sendVerificationEmail(input: SendVerificationEmailInput) {
  if (!/^https?:\/\//i.test(input.verificationUrl)) {
    throw new Error("INVALID_VERIFICATION_URL");
  }

  if (isBrevoConfigured()) {
    await sendViaBrevo(input);
    return;
  }

  if (!isSmtpConfigured()) {
    throw new Error("EMAIL_DELIVERY_NOT_CONFIGURED");
  }

  const transport = buildTransport();
  const from = requireEnv("SMTP_FROM");
  const content = buildVerificationMailContent(input);

  await transport.sendMail({
    from,
    to: input.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}
