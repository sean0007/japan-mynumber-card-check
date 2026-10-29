import { InputError, type Endpoint, type Input } from "./agent-api";
import { DISCLAIMER, HOLDERS, RENEWALS, RuleInputError, checkCard, type Holder, type Renewal } from "./card";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const PUBLIC_URL = "https://japan-mynumber-card-check.vercel.app";
export const API_DISCLAIMER = DISCLAIMER;
export const API_INFO = { title: `${SITE_NAME} API`, description: SITE_TAGLINE, version: "1.0.0" };

export const EXAMPLE_GET = "/api/check?holder=mid_long&birthDate=1992-04-10&cardIssueDate=2024-03-01&residenceExpiry=2026-12-15&renewal=pending";

function first(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v;
}
function s(v: unknown): string | null {
  const f = first(v);
  return f === undefined || f === null || String(f).trim() === "" ? null : String(f).trim();
}
function b(v: unknown): boolean {
  const f = first(v);
  if (typeof f === "boolean") return f;
  return f !== undefined && f !== null && /^(1|true|yes|y|on)$/i.test(String(f).trim());
}

const HOLDER_ALIASES: Record<string, Holder> = {
  resident: "mid_long", foreign_resident: "mid_long", residence_card: "mid_long", midlong: "mid_long", mid_to_long: "mid_long", work: "mid_long", student: "mid_long", spouse: "mid_long", visa: "mid_long", 中長期: "mid_long", 中長期在留者: "mid_long", 外国人: "mid_long",
  pr: "permanent", permanent_resident: "permanent", 永住: "permanent", 永住者: "permanent",
  hsp_2: "hsp2", hsp_ii: "hsp2", highly_skilled_professional_2: "hsp2", 高度専門職2号: "hsp2",
  special_permanent: "spr", special_permanent_resident: "spr", 特別永住者: "spr",
  citizen: "japanese", japan: "japanese", national: "japanese", 日本人: "japanese", 日本国籍: "japanese",
};
const RENEWAL_ALIASES: Record<string, Renewal> = { no: "none", false: "none", not_yet: "none", applied: "pending", yes: "pending", true: "pending", in_progress: "pending", 申請中: "pending", approved: "granted", done: "granted", received: "granted", 許可: "granted" };

function pick<T extends string>(raw: string | null, allowed: readonly T[], aliases: Record<string, T>, name: string, fallback: T | null): T | null {
  if (!raw) return fallback;
  const k = raw.toLowerCase().replace(/[\s-]+/g, "_");
  const v = (aliases[k] ?? aliases[raw] ?? k) as T;
  if (!(allowed as readonly string[]).includes(v)) throw new InputError(`Invalid ${name} "${raw}". Allowed: ${allowed.join(", ")}`);
  return v;
}

export function computeCheck(input: Input) {
  try {
    const holder = pick(s(input.holder ?? input.status ?? input.residentType), HOLDERS, HOLDER_ALIASES, "holder", null);
    if (!holder) throw new InputError(`Missing holder. Allowed: ${HOLDERS.join(", ")}`);
    return checkCard({
      holder,
      birthDate: s(input.birthDate ?? input.dob ?? input.birthday) ?? "",
      cardIssueDate: s(input.cardIssueDate ?? input.issueDate ?? input.issued) ?? "",
      cardExpiry: s(input.cardExpiry ?? input.expiry),
      residenceExpiry: s(input.residenceExpiry ?? input.periodExpiry ?? input.visaExpiry),
      renewal: pick(s(input.renewal ?? input.visaRenewal ?? input.pending), RENEWALS, RENEWAL_ALIASES, "renewal", "none"),
      newResidenceExpiry: s(input.newResidenceExpiry ?? input.newExpiry),
      specificCard: b(input.specificCard ?? input.tokutei),
      issuedAsRenewal: b(input.issuedAsRenewal),
      ecertExpiry: s(input.ecertExpiry ?? input.certificateExpiry),
      residenceCardExpiry: s(input.residenceCardExpiry),
      today: s(input.today),
    });
  } catch (e) {
    if (e instanceof RuleInputError) throw new InputError(e.message);
    throw e;
  }
}

export const ENDPOINTS: Record<"check", Endpoint> = {
  check: {
    path: "/api/check",
    operationId: "japanMyNumberCardExpiryCheck",
    summary: "When does a Japan My Number Card (マイナンバーカード) expire, and what must the holder do before then?",
    description:
      "Applies the My Number Card ordinance (総務省令第85号) art. 26 (10th birthday after the card is made, 5th if under 18; age line 20 for cards made by 2022-03-31; Feb 29 → Feb 28), art. 27 (foreign residents with a period of stay: card ends on the period-of-stay expiry and is NOT extended automatically by a visa renewal; city-hall extension to the new period up to the 10th-birthday cap; one-time extension to the end of the 2-month special period while a renewal is pending) and art. 29 (renew from the day fewer than 3 months remain; new card runs to the 11th / 6th birthday). Also: e-certificate expiry (5th birthday, capped at card expiry), the マイナ保険証 grace (to the end of the 3rd month after the e-certificate's expiry month), the 特定在留カード (since 2026-06-14) and PR / HSP (ii) residence-card renewal. Returns verdict (ok | renew_window_open | extend_before_expiry | no_action_needed | expired), card {expiry, renewFrom, maxExtendableTo, newExpiryAfterAction}, specialExtension, ecert {expiry, renewFrom, status, insuranceGraceEnds}, dated actions (from, by, where, fee), warnings, sources and a disclaimer.",
    params: [
      { name: "holder", type: "string", required: true, enum: HOLDERS, description: "mid_long (foreign resident with a period of stay: work, student, spouse…), permanent, hsp2, spr (special permanent resident), japanese. Aliases: pr, student, work, citizen…" },
      { name: "birthDate", type: "string", required: true, description: "YYYY-MM-DD date of birth." },
      { name: "cardIssueDate", type: "string", required: true, description: "YYYY-MM-DD the card was made / issued (発行日 on the card)." },
      { name: "residenceExpiry", type: "string", description: "mid_long: YYYY-MM-DD period-of-stay expiry (在留期限) that applied when the card was made or last extended. Required for mid_long unless cardExpiry is given." },
      { name: "renewal", type: "string", enum: RENEWALS, default: "none", description: "mid_long: visa renewal / change status: none | pending (applied, no decision) | granted (new residence card received)." },
      { name: "newResidenceExpiry", type: "string", description: "YYYY-MM-DD new period-of-stay expiry when renewal=granted." },
      { name: "specificCard", type: "boolean", default: false, description: "true if you hold (or ISA just issued you) a 特定在留カード / 特定特別永住者証明書 combining the residence card and My Number Card." },
      { name: "cardExpiry", type: "string", description: "Optional YYYY-MM-DD expiry printed on the card; overrides the computed date." },
      { name: "ecertExpiry", type: "string", description: "Optional YYYY-MM-DD e-certificate expiry (J-LIS notice / Mynaportal); default: 5th birthday after issue, capped at card expiry." },
      { name: "issuedAsRenewal", type: "boolean", default: false, description: "true if this card was made as a renewal while fewer than 3 months were left on the old one (11th / 6th birthday rule)." },
      { name: "residenceCardExpiry", type: "string", description: "permanent / hsp2: YYYY-MM-DD expiry of the residence card itself, to get its renewal window." },
      { name: "today", type: "string", description: "Override today's date (default: today in Japan)." },
    ],
    example: EXAMPLE_GET,
    compute: computeCheck,
  },
};

export const PLUGIN = {
  name: "Japan My Number Card Expiry Check",
  nameForModel: "japan_my_number_card_expiry",
  descriptionForHuman: "When does my My Number Card expire? Foreign-resident extension deadline, renewal window, e-cert, マイナ保険証.",
  descriptionForModel:
    "Use when someone in Japan asks when their My Number Card (マイナンバーカード, Individual Number Card) or its electronic certificate expires, whether a foreign resident's card is extended automatically when their visa is renewed (it is not), what to do while a visa renewal is pending (one-time 2-month city-hall extension before the card expires), when renewal opens, how long マイナ保険証 keeps working after the e-certificate expires, or how the 特定在留カード changes this. Computes exact dates from the ordinance instead of guessing; relay the disclaimer (educational; the date printed on the card counts; confirm with the city office).",
  logo: "/icon.svg",
};
