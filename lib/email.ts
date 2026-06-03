import { Resend } from "resend"

export function createResend() {
  return new Resend(process.env.RESEND_API_KEY!)
}
