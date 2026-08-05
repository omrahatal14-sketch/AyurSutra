const THERAPY_FEE_MAP = {
  "Panchakarma (Complete)": 12000,
  "Vamana (Emesis)": 7000,
  "Virechana (Purgation)": 6500,
  "Basti (Enema)": 6000,
  "Nasya (Nasal)": 4500,
  "Raktamokshana (Bloodletting)": 5000,
  "Abhyanga (Massage)": 2500,
  "Shirodhara (Oil pouring)": 4000,
  "Shirodhara": 4000,
  "Kati Basti": 3500,
  "Janu Basti": 3500,
  "Griva Basti": 3500,
  "Udvartana": 3000,
  "Pizhichil": 5500,
  "Navarakizhi": 5000,
  "Swedana (Steam)": 2000,
  "Netra Tarpana": 2500,
  "Karnapoorana": 2000
};

function normalizeTherapyName(name) {
  return String(name || "").trim();
}

export function getTherapyFee(therapyName) {
  const normalized = normalizeTherapyName(therapyName);
  return THERAPY_FEE_MAP[normalized] || 3000;
}

export function getAdvanceAmount(totalFee) {
  return Math.round(Number(totalFee || 0) * 0.4);
}

export function getRemainingAmount(totalFee) {
  return Math.max(0, Math.round(Number(totalFee || 0) - getAdvanceAmount(totalFee)));
}

export function getPlatformRevenue(totalFee) {
  return Math.round(Number(totalFee || 0) * 0.3);
}

export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

export function getPaymentStatusLabel(session) {
  if (!session) return "Payment due";

  if (session.remainingPaid === true || session.remaining_paid === true) {
    return "Paid";
  }

  if (session.paymentStatus === "awaiting_remaining" || session.payment_status === "awaiting_remaining") {
    return "Remaining due";
  }

  if (session.advancePaid === true || session.advance_paid === true) {
    return "Advance paid";
  }

  return "Advance due";
}

export function isAdvancePaid(session) {
  return session?.advancePaid === true || session?.advance_paid === true;
}

export function isRemainingPaid(session) {
  return session?.remainingPaid === true || session?.remaining_paid === true;
}
