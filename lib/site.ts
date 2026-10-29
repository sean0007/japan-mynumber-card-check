export const SITE_NAME = "Japan My Number Card Expiry Check";

export const SITE_TAGLINE =
  "When does my My Number Card (マイナンバーカード) expire, and what do I have to do before then? Foreign residents' cards end with the period of stay and do not extend when the visa is renewed: get the exact date, the city-hall deadline, the one-time 2-month extension while a renewal is pending, the e-certificate date and the マイナ保険証 grace.";

export const DISCLAIMER_SHORT = "Educational date calculator, not legal advice, not affiliated with the Digital Agency, J-LIS, ISA or any city office. The date printed on your card is what counts; check with your city hall before the deadline.";

export const HONESTY =
  "Rules as of 2026-10-29 from the My Number Card ordinance (総務省令第85号 art. 26, 27, 29), the Digital Agency, ISA (incl. the 2026-06-14 特定在留カード), Mynaportal and city guidance. It only uses the dates you enter; it can't see your card or a pending immigration decision.";

export const SIBLING_TOOLS = [
  { href: "https://japan-reentry-check.vercel.app", label: "Japan Re-entry Deadline Check" },
  { href: "https://japan-visa-fee.vercel.app", label: "Japan Visa Fee Calculator" },
  { href: "https://japan-pr-check.vercel.app", label: "Japan PR Guideline Check" },
  { href: "https://japan-overseas-dependents.vercel.app", label: "Japan Overseas Dependents Check" },
  { href: "https://japan-parttime-check.vercel.app", label: "Japan Part-time Work Check" },
  { href: "https://japan-driving-check.vercel.app", label: "Japan Driving Check" },
  { href: "https://house-rules-check.vercel.app", label: "House Rules Check" },
  { href: "https://japan-tax-free-refund.vercel.app", label: "Japan Tax-Free Refund" },
  { href: "https://japan-alert-decoder.vercel.app", label: "Japan Alert Decoder" },
  { href: "https://free-agent-tools.vercel.app", label: "Free Agent Tools MCP" },
] as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  return "https://japan-mynumber-card-check.vercel.app";
}
