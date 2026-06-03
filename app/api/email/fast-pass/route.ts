import { NextRequest, NextResponse } from "next/server"
import { createResend } from "@/lib/email"
import { generateFastPassQr } from "@/lib/qr"

export async function POST(request: NextRequest) {
  const { email, donorName, donorNric, donorPhone, bloodType, centreName, date, time, appointmentId, donorId } = await request.json()

  if (!email || !appointmentId || !donorId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const qrDataUrl = await generateFastPassQr(appointmentId, {
      id: donorId,
      name: donorName,
      nric: donorNric,
      email,
      phone: donorPhone,
      bloodType,
    })
    const resend = createResend()

    await resend.emails.send({
      from: "BloodLine <onboarding@resend.dev>",
      to: email,
      subject: "Your Fast-Pass QR Code – Blood Donation Appointment",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">Fast-Pass Confirmed</h1>
          </div>
          <div style="background: #fef2f2; padding: 24px; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #991b1b; font-size: 14px; margin: 0 0 16px;">
              Your blood type is urgently needed. You've been issued a <strong>Fast-Pass</strong>.
            </p>
            <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px; color: #374151; font-size: 14px;"><strong>Centre:</strong> ${centreName}</p>
              <p style="margin: 0 0 4px; color: #374151; font-size: 14px;"><strong>Date:</strong> ${date}</p>
              <p style="margin: 0 0 4px; color: #374151; font-size: 14px;"><strong>Time:</strong> ${time}</p>
              <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Donor:</strong> ${donorName}</p>
            </div>
            <div style="text-align: center; margin-bottom: 16px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px;">Present this QR code at the centre to skip the queue</p>
              <img src="${qrDataUrl}" alt="Fast-Pass QR Code" style="width: 200px; height: 200px;" />
            </div>
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              Please arrive at your scheduled time and show this QR code to the receptionist for priority processing.
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[FastPass email] Error:", e)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
