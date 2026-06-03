import QRCode from "qrcode"

export async function generateFastPassQr(
  appointmentId: string,
  donor: { id: string; name: string; nric: string; email: string; phone: string; bloodType: string },
): Promise<string> {
  const payload = JSON.stringify({
    type: "fast_pass",
    appointmentId,
    donorId: donor.id,
    donorName: donor.name,
    nric: donor.nric,
    email: donor.email,
    phone: donor.phone,
    bloodType: donor.bloodType,
    issuedAt: Date.now(),
  })
  return QRCode.toDataURL(payload, { width: 300, margin: 2 })
}
