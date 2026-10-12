import crypto from "node:crypto";
import sgMail from "@sendgrid/mail";
import VerificationToken from "@/models/VerificationToken";

const defaultSender = "vicentejoelson80@gmail.com";

export function isVerificationEmailConfigured() {
  return Boolean(process.env.SENDGRID_API_KEY?.trim());
}

export async function sendVerificationEmail(email: string, requestUrl: string) {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) throw new Error("SENDGRID_API_KEY não configurada");

  sgMail.setApiKey(apiKey);
  const token = crypto.randomBytes(32).toString("hex");
  const verificationUrl = new URL("/api/auth/verify-email", requestUrl);
  verificationUrl.searchParams.set("token", token);

  await VerificationToken.deleteMany({ identifier: email });
  await VerificationToken.create({
    identifier: email,
    token,
    expires: new Date(Date.now() + 60 * 60 * 1000),
  });

  await sgMail.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL?.trim() || defaultSender,
    subject: "Verifique seu e-mail - Focuslist",
    html: `<p>Clique <a href="${verificationUrl.toString()}">aqui</a> para verificar seu e-mail e ativar sua conta.</p>`,
  });
}
