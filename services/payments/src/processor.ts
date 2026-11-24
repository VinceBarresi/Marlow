import { createHash } from "node:crypto";

export type TestCardKey = "visa_success" | "visa_decline" | "insufficient_funds";

export type CardInput = {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
};

export type ValidatedCard = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  fingerprint: string;
  testCardKey: TestCardKey;
};

export type ChargeResult = { ok: true } | { ok: false; declineCode: string; message: string };

const SUCCESS = "4242424242424242";
const DECLINE = "4000000000000002";
const INSUFFICIENT = "4000000000009995";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function luhnValid(number: string) {
  const digits = digitsOnly(number);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function brandFor(number: string) {
  const digits = digitsOnly(number);
  if (digits.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (digits.startsWith("6")) return "discover";
  return "unknown";
}

function testCardKeyFor(number: string): TestCardKey | null {
  const digits = digitsOnly(number);
  if (digits === SUCCESS) return "visa_success";
  if (digits === DECLINE) return "visa_decline";
  if (digits === INSUFFICIENT) return "insufficient_funds";
  // Any other Luhn-valid card succeeds in this sandbox.
  return "visa_success";
}

export function validateCard(input: CardInput): ValidatedCard | { error: string } {
  const number = digitsOnly(input.number);
  const cvc = digitsOnly(input.cvc);
  if (!number || !luhnValid(number)) {
    return { error: "Your card number is invalid." };
  }
  if (!/^\d{3,4}$/.test(cvc)) {
    return { error: "Your card's security code is invalid." };
  }
  const expMonth = Number(input.expMonth);
  const expYear = Number(input.expYear);
  if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) {
    return { error: "Your card's expiration month is invalid." };
  }
  if (!Number.isInteger(expYear) || expYear < 2000) {
    return { error: "Your card's expiration year is invalid." };
  }
  const now = new Date();
  const exp = new Date(expYear, expMonth, 0, 23, 59, 59);
  if (exp < now) {
    return { error: "Your card has expired." };
  }
  const key = testCardKeyFor(number);
  if (!key) {
    return { error: "Your card number is invalid." };
  }
  return {
    brand: brandFor(number),
    last4: number.slice(-4),
    expMonth,
    expYear,
    fingerprint: createHash("sha256").update(number).digest("hex").slice(0, 16),
    testCardKey: key,
  };
}

/** Charge using the stored sandbox key — never needs the raw PAN. */
export function chargeTestCard(testCardKey: TestCardKey): ChargeResult {
  if (testCardKey === "visa_decline") {
    return { ok: false, declineCode: "card_declined", message: "Your card was declined." };
  }
  if (testCardKey === "insufficient_funds") {
    return {
      ok: false,
      declineCode: "insufficient_funds",
      message: "Your card has insufficient funds.",
    };
  }
  return { ok: true };
}

export class MockStripeClient {
  validateCard = validateCard;
  charge = chargeTestCard;
}
