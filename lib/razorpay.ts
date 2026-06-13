import crypto from "crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

export const onlinePaymentsEnabled = !!(KEY_ID && KEY_SECRET);
export const razorpayKeyId = KEY_ID;

/** Create a Razorpay order. Amount in rupees. Returns the Razorpay order id. */
export async function createRazorpayOrder(amountRupees: number, receipt: string): Promise<string> {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64"),
    },
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100), // paise
      currency: "INR",
      receipt,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Razorpay order creation failed: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.id as string;
}

/** Verify the checkout signature Razorpay returns after a successful payment. */
export function verifyPaymentSignature(razorpayOrderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${razorpayOrderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
