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

function getTherapyFee(therapyName) {
  const normalized = normalizeTherapyName(therapyName);
  return THERAPY_FEE_MAP[normalized] || 3000;
}

function getAdvanceAmount(totalFee) {
  return Math.round(Number(totalFee || 0) * 0.4);
}

function getRemainingAmount(totalFee) {
  return Math.max(0, Math.round(Number(totalFee || 0) - getAdvanceAmount(totalFee)));
}

function getPlatformRevenue(totalFee) {
  return Math.round(Number(totalFee || 0) * 0.3);
}

module.exports = {
  THERAPY_FEE_MAP,
  getTherapyFee,
  getAdvanceAmount,
  getRemainingAmount,
  getPlatformRevenue
};
