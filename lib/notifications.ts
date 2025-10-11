import nodemailer, { type Transporter } from "nodemailer";

import { db } from "./db";

type PendingUser = {
  id: string;
  email: string;
  name: string | null;
  region: string | null;
};

type Recipient = {
  email: string;
  name: string | null;
};

let transporter: Transporter | null | undefined;

function getBaseUrl() {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL;
  if (!vercelUrl) return null;
  return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
}

function getTransporter() {
  if (transporter !== undefined) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    transporter = null;
    console.warn(
      "Email transporter not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS to enable notifications.",
    );
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user, pass },
  });

  return transporter;
}

function formatRecipient(recipient: Recipient) {
  return recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email;
}

export async function notifyApproversOfPendingUser(user: PendingUser) {
  const mailer = getTransporter();
  if (!mailer) {
    return;
  }

  const [admins, districtUsers] = await Promise.all([
    db.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, name: true },
    }),
    db.user.findMany({
      where:
        user.region
          ? { role: "DISTRICT", region: user.region }
          : { role: "DISTRICT" },
      select: { email: true, name: true },
    }),
  ]);

  const recipients = [...admins, ...districtUsers]
    .filter((recipient): recipient is Recipient => Boolean(recipient.email))
    .reduce<Recipient[]>((unique, recipient) => {
      if (unique.some((existing) => existing.email === recipient.email)) {
        return unique;
      }
      unique.push(recipient);
      return unique;
    }, []);

  if (!recipients.length) {
    return;
  }

  const pendingName = user.name?.trim() || "New member";
  const subject = `New member awaiting approval: ${pendingName}`;
  const regionLine = user.region ? user.region : "Region not specified";
  const approvalPath = "/admin/users";
  const baseUrl = getBaseUrl();
  const approvalUrl = baseUrl ? new URL(approvalPath, baseUrl).toString() : approvalPath;

  const lines = [
    `Name: ${user.name || "Not provided"}`,
    `Email: ${user.email}`,
    `Region: ${regionLine}`,
    `Registered user ID: ${user.id}`,
  ];

  const textBody = [
    "A new member has registered and is waiting for approval to access the leaderboard.",
    "",
    ...lines,
    "",
    `Review pending users: ${approvalUrl}`,
  ].join("\n");

  const htmlBody = `
    <p>A new member has registered and is waiting for approval to access the leaderboard.</p>
    <ul>
      <li><strong>Name:</strong> ${user.name || "Not provided"}</li>
      <li><strong>Email:</strong> ${user.email}</li>
      <li><strong>Region:</strong> ${regionLine}</li>
      <li><strong>Registered user ID:</strong> ${user.id}</li>
    </ul>
    <p><a href="${approvalUrl}">Review pending users</a></p>
  `;

  const [primary, ...bcc] = recipients;

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: formatRecipient(primary),
      bcc: bcc.map(formatRecipient),
      subject,
      text: textBody,
      html: htmlBody,
    });
  } catch (error) {
    console.error("EMAIL_NOTIFY_PENDING_USER", error);
  }
}
