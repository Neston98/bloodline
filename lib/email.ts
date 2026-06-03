import nodemailer from "nodemailer"

export function createTransporter() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars")
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })
}
