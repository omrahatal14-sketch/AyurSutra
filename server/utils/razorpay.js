const crypto = require("crypto");

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_StEbiz5r9nQVPm";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "bwO37c59fxVoGrCzCpEttH54";

async function createRazorpayOrder({ amountPaise, receipt, notes = {} }) {
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")}`
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      payment_capture: 1,
      notes
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay order creation failed: ${errorText}`);
  }

  return response.json();
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}

module.exports = {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  createRazorpayOrder,
  verifyRazorpaySignature
};
