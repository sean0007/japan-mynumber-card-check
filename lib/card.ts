// Japan My Number Card (マイナンバーカード) expiry logic. Pure functions, no I/O.
// Law: 個人番号カード等に関する命令 (総務省令第85号) art. 26 (10th / 5th birthday), 27 (foreign residents:
// period-of-stay expiry, extension on renewal or during the special period), 29 (renewal window: under 3 months
// left → 11th / 6th birthday). Health-insurance grace: Mynaportal FAQ 10178 / MHLW. 特定在留カード: ISA (2026-06-14).

export const RULES_AS_OF = "2026-10-29";

export const HOLDERS = ["mid_long", "permanent", "hsp2", "spr", "japanese"] as const;
export type Holder = (typeof HOLDERS)[number];
export const RENEWALS = ["none", "pending", "granted"] as const;
export type Renewal = (typeof RENEWALS)[number];

export const HOLDER_LABEL: Record<Holder, { en: string; ja: string }> = {
  mid_long: { en: "Foreign resident with a period of stay (work, student, spouse, dependent, long-term resident…)", ja: "在留期間のある中長期在留者" },
  permanent: { en: "Permanent resident (永住者)", ja: "永住者" },
  hsp2: { en: "Highly Skilled Professional (ii) (高度専門職2号)", ja: "高度専門職2号" },
  spr: { en: "Special permanent resident (特別永住者)", ja: "特別永住者" },
  japanese: { en: "Japanese national", ja: "日本国籍" },
};

export const SOURCES = [
  "https://laws.e-gov.go.jp/law/426M60000008085",
  "https://www.digital.go.jp/en/policies/mynumber/expiration-date",
  "https://www.digital.go.jp/policies/mynumber/expiration-date",
  "https://www.moj.go.jp/isa/tokutei.html",
  "https://www.moj.go.jp/isa/applications/procedures/nyuukokukanri10_00011.html",
  "https://www.moj.go.jp/isa/10_00270.html",
  "https://faq.myna.go.jp/faq/show/10178?site_domain=default",
  "https://www.city.matsudo.chiba.jp/InternationalPortal/en/forforeignresidents/mynumbercard.html",
  "https://www.mhlw.go.jp/stf/newpage_50657.html",
] as const;

export const DISCLAIMER =
  "Educational date calculator, not legal advice, not affiliated with the Digital Agency, J-LIS, the Immigration Services Agency of Japan or any city office. It applies the My Number Card ordinance (総務省令第85号 art. 26, 27, 29) and official guidance to the dates you enter; the date printed on your card (and on your e-certificate notice) is what counts. City offices differ on documents and hours: check with your city hall before the deadline.";

export class RuleInputError extends Error {}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
export function validDate(s: string): boolean {
  if (!ISO.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
const toDate = (s: string) => new Date(`${s}T00:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);
export function addDays(s: string, n: number): string {
  const d = toDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}
export function daysBetween(a: string, b: string): number {
  return Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000);
}
export function todayJst(now: Date = new Date()): string {
  return fmt(new Date(now.getTime() + 9 * 3_600_000));
}
const lastDayOf = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
/** Same day n months later (or earlier), clamped to the month's last day. */
export function addMonths(s: string, n: number): string {
  const d = toDate(s);
  const m = d.getUTCMonth() + n;
  const y = d.getUTCFullYear() + Math.floor(m / 12);
  const m0 = ((m % 12) + 12) % 12;
  return fmt(new Date(Date.UTC(y, m0, Math.min(d.getUTCDate(), lastDayOf(y, m0)))));
}
/** Last day of a period of `months` counted from the day after `from` (Civil Code 140, 143). */
export function periodEnd(from: string, months: number): string {
  const start = addDays(from, 1);
  const d = toDate(start);
  const m = d.getUTCMonth() + months;
  const y = d.getUTCFullYear() + Math.floor(m / 12);
  const m0 = ((m % 12) + 12) % 12;
  if (d.getUTCDate() > lastDayOf(y, m0)) return fmt(new Date(Date.UTC(y, m0, lastDayOf(y, m0))));
  return addDays(fmt(new Date(Date.UTC(y, m0, d.getUTCDate()))), -1);
}
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
/** Birthday in year y; Feb 29 counts as Feb 28 in non-leap years (ordinance art. 26(2)). */
function birthdayIn(birth: string, y: number): string {
  const [, mm, dd] = birth.split("-");
  if (mm === "02" && dd === "29" && !isLeap(y)) return `${y}-02-28`;
  return `${String(y).padStart(4, "0")}-${mm}-${dd}`;
}
/** The n-th birthday strictly after `ref` (「作成の日後の…n回目の誕生日」). */
export function nthBirthdayAfter(birth: string, ref: string, n: number): string {
  let y = Number(ref.slice(0, 4));
  if (birthdayIn(birth, y) <= ref) y += 1;
  return birthdayIn(birth, y + n - 1);
}
/** Age in completed years on `date`. */
export function ageOn(birth: string, date: string): number {
  let age = Number(date.slice(0, 4)) - Number(birth.slice(0, 4));
  if (date.slice(5) < birth.slice(5)) age -= 1;
  return age;
}
/** First day on which fewer than 3 months remain before `expiry` (Hamamatsu: 2026-10-01 → 2026-07-02). */
export function renewFrom(expiry: string): string {
  let d = addDays(addMonths(expiry, -3), -3);
  while (addMonths(d, 3) <= expiry) d = addDays(d, 1);
  return d;
}
/** マイナ保険証 grace: until the end of the 3rd month after the month the e-certificate expired in. */
export function insuranceGraceEnd(expiry: string): string {
  const y = Number(expiry.slice(0, 4));
  const m0 = Number(expiry.slice(5, 7)) - 1 + 3;
  const ty = y + Math.floor(m0 / 12);
  const tm = m0 % 12;
  return fmt(new Date(Date.UTC(ty, tm, lastDayOf(ty, tm))));
}
const minDate = (a: string, b: string) => (a < b ? a : b);

export type CheckInput = {
  holder: Holder;
  birthDate: string;
  cardIssueDate: string;
  cardExpiry?: string | null;
  residenceExpiry?: string | null;
  renewal?: Renewal | null;
  newResidenceExpiry?: string | null;
  specificCard?: boolean | null;
  issuedAsRenewal?: boolean | null;
  ecertExpiry?: string | null;
  residenceCardExpiry?: string | null;
  today?: string | null;
};

export type Verdict = "ok" | "renew_window_open" | "extend_before_expiry" | "no_action_needed" | "expired";
export type Action = { what: string; from: string | null; by: string | null; where: string; fee: string };

export type CheckResult = {
  verdict: Verdict;
  summary: string;
  holder: Holder;
  holderLabel: string;
  ageAtIssue: number;
  adultAgeLine: 18 | 20;
  card: {
    expiry: string;
    expiryBasis: string;
    daysLeft: number;
    renewFrom: string | null;
    maxExtendableTo: string;
    maxExtendableBasis: string;
    newExpiryAfterAction: string | null;
  };
  specialExtension: { applies: boolean; extendTo: string | null; mustApplyBy: string | null; specialPeriodEnds: string | null; note: string } | null;
  ecert: { expiry: string; basis: string; renewFrom: string; status: "valid" | "renew_window_open" | "expired_in_grace" | "expired"; insuranceGraceEnds: string };
  residenceCard: { expiry: string; renewFrom: string; note: string } | null;
  actions: Action[];
  warnings: string[];
  rulesAsOf: string;
  today: string;
  sources: readonly string[];
};

function need(v: string | null | undefined, name: string, hint = ""): string {
  if (!v) throw new RuleInputError(`Missing ${name} (YYYY-MM-DD).${hint}`);
  if (!validDate(v)) throw new RuleInputError(`${name} must be a date YYYY-MM-DD.`);
  return v;
}
function opt(v: string | null | undefined, name: string): string | null {
  if (!v) return null;
  if (!validDate(v)) throw new RuleInputError(`${name} must be a date YYYY-MM-DD.`);
  return v;
}

const CITY = "City / ward office where you are registered (市区町村窓口)";

export function checkCard(input: CheckInput): CheckResult {
  const holder = input.holder;
  if (!(HOLDERS as readonly string[]).includes(holder)) throw new RuleInputError(`Invalid holder. Allowed: ${HOLDERS.join(", ")}`);
  const renewal: Renewal = input.renewal ?? "none";
  if (!(RENEWALS as readonly string[]).includes(renewal)) throw new RuleInputError(`Invalid renewal. Allowed: ${RENEWALS.join(", ")}`);
  const birthDate = need(input.birthDate, "birthDate");
  const cardIssueDate = need(input.cardIssueDate, "cardIssueDate", " Use the issue date (発行日) on your card.");
  if (cardIssueDate < birthDate) throw new RuleInputError("cardIssueDate is before birthDate.");
  if (cardIssueDate < "2016-01-01") throw new RuleInputError("My Number Cards were first issued in January 2016; check cardIssueDate.");
  const cardExpiryIn = opt(input.cardExpiry, "cardExpiry");
  let residenceExpiry = opt(input.residenceExpiry, "residenceExpiry");
  const newResidenceExpiry = opt(input.newResidenceExpiry, "newResidenceExpiry");
  const ecertExpiryIn = opt(input.ecertExpiry, "ecertExpiry");
  const residenceCardExpiry = opt(input.residenceCardExpiry, "residenceCardExpiry");
  const today = opt(input.today, "today") ?? todayJst();
  if (cardIssueDate > today) throw new RuleInputError(`cardIssueDate ${cardIssueDate}: issue date is in the future (after ${today}, today in Japan or the "today" you gave). Use the issue date (発行日) printed on your card.`);
  const specificCard = !!input.specificCard;
  const issuedAsRenewal = !!input.issuedAsRenewal;

  const adultAgeLine: 18 | 20 = cardIssueDate <= "2022-03-31" ? 20 : 18;
  const ageAtIssue = ageOn(birthDate, cardIssueDate);
  const adult = ageAtIssue >= adultAgeLine;
  const n = (adult ? 10 : 5) + (issuedAsRenewal ? 1 : 0);
  const assumed = nthBirthdayAfter(birthDate, cardIssueDate, n);
  const assumedBasis = `${n}th birthday after the card was made (${adult ? `${adultAgeLine} or older` : `under ${adultAgeLine}`} on the issue date${issuedAsRenewal ? ", renewed in the last-3-months window" : ""}; ordinance art. 26${issuedAsRenewal ? ", 29(3)" : ""}).`;

  const actions: Action[] = [];
  const warnings: string[] = [];
  let specialExtension: CheckResult["specialExtension"] = null;
  let newExpiryAfterAction: string | null = null;
  let verdict: Verdict = "ok";

  // ---- card expiry ----
  let expiry: string;
  let expiryBasis: string;
  if (holder === "mid_long") {
    if (!residenceExpiry && !cardExpiryIn) throw new RuleInputError("Missing residenceExpiry: the period-of-stay expiry (在留期限) that was on your residence card when the My Number Card was made or last extended. Or give cardExpiry from the card face.");
    residenceExpiry = residenceExpiry ?? cardExpiryIn;
    const computed = adult ? residenceExpiry! : minDate(residenceExpiry!, nthBirthdayAfter(birthDate, cardIssueDate, 5));
    expiry = cardExpiryIn ?? computed;
    expiryBasis = cardExpiryIn
      ? "The expiry date you entered from the card face."
      : adult
        ? "Your period-of-stay expiry (在留期限): foreign residents' cards end with the period of stay and do NOT extend automatically when the visa is renewed (ordinance art. 27(1))."
        : `The earlier of your period-of-stay expiry and your 5th birthday after the card was made (under ${adultAgeLine} at issue; art. 27(1)).`;
  } else {
    expiry = cardExpiryIn ?? assumed;
    expiryBasis = cardExpiryIn ? "The expiry date you entered from the card face." : `${assumedBasis}`;
  }
  if (expiry < cardIssueDate) throw new RuleInputError("The card expiry comes before the issue date; check your dates.");
  const daysLeft = daysBetween(today, expiry);
  const expired = today > expiry;
  const windowFrom = renewFrom(expiry);

  if (holder === "mid_long") {
    if (expired) {
      verdict = "expired";
      actions.push({ what: "Your card has lapsed and can no longer be extended. Apply for a new My Number Card (your number stays the same). Bring your current residence card.", from: null, by: null, where: CITY, fee: "Cities charge a reissue fee (Matsudo: ¥1,000 incl. e-certificates); a new application by post or online with the QR/ID on the application form may be free; ask your city" });
    } else if (renewal === "pending") {
      if (!residenceExpiry) throw new RuleInputError("Missing residenceExpiry (YYYY-MM-DD) for a pending application.");
      const spEnd = periodEnd(residenceExpiry, 2);
      const extendTo = minDate(spEnd, assumed);
      specialExtension = {
        applies: true,
        extendTo,
        mustApplyBy: expiry,
        specialPeriodEnds: spEnd,
        note: `Your renewal / change is pending, so you are in the 2-month special period (until the decision or ${spEnd}). The city can extend your card to ${extendTo} as a one-time special measure (art. 27(2)(ii)) if you go BEFORE ${expiry} with proof: the "更新申請中" stamp on the back of your residence card, the online-application completion email, or the application receipt. Receipts from a proxy (gyoseishoshi) may not be accepted. It cannot be extended a second time.`,
      };
      newExpiryAfterAction = extendTo;
      verdict = "extend_before_expiry";
      actions.push({ what: `Special 2-month extension of the card (show proof the application is pending)`, from: null, by: expiry, where: CITY, fee: "Free" });
      actions.push({ what: "After you receive the new residence card, extend the card again to your new period of stay", from: null, by: extendTo, where: CITY, fee: "Free" });
      if (specificCard) warnings.push("You hold a 特定在留カード: its My Number function still ends on your ORIGINAL period-of-stay date while ISA is deciding. ISA says to do the city-hall extension before that date, or your e-certificate lapses and マイナ保険証 may stop working (ISA Q5-3).");
      warnings.push(`Banks may restrict your account from the day after ${residenceExpiry} unless you notify them that your renewal is pending (ISA).`);
    } else if (renewal === "granted") {
      if (!newResidenceExpiry) throw new RuleInputError("Missing newResidenceExpiry: the new period-of-stay expiry on your renewed residence card.");
      const target = minDate(newResidenceExpiry, assumed);
      newExpiryAfterAction = target;
      if (specificCard) {
        verdict = "no_action_needed";
        actions.push({ what: "Your new 特定在留カード from ISA already carries the new date for the My Number function: no city-hall visit needed for the card itself (ISA Q1-2)", from: null, by: null, where: "—", fee: "—" });
      } else {
        verdict = "extend_before_expiry";
        actions.push({ what: `Extend your My Number Card's expiry to ${target} (bring the card and the renewed residence card; 4-digit PIN)`, from: null, by: expiry, where: CITY, fee: "Free" });
        warnings.push("The card does NOT update itself when ISA renews your visa, and cities send no reminder for this (Matsudo). If you miss the date the card lapses.");
      }
      if (assumed < newResidenceExpiry) warnings.push(`The card can only be extended up to ${assumed} (${assumedBasis.replace(/\.$/, "")}). Around then you need a new card; you can apply from ${renewFrom(assumed)}.`);
    } else {
      // no application yet
      if (residenceExpiry && expiry === residenceExpiry) {
        verdict = daysLeft <= 92 ? "extend_before_expiry" : "ok";
        actions.push({ what: "Apply to ISA for your visa renewal (在留期間更新) or change, ideally between 3 months and 45 days before expiry", from: addMonths(residenceExpiry, -3), by: residenceExpiry, where: "Regional immigration office or the online residence application system", fee: "Set by ISA (see japan-visa-fee.vercel.app)" });
        actions.push({ what: "Then extend the My Number Card at city hall before it expires: to your new period of stay once granted, or by up to 2 months with proof that the application is pending", from: null, by: expiry, where: CITY, fee: "Free" });
      } else {
        verdict = today >= windowFrom ? "renew_window_open" : "ok";
        actions.push({ what: "Your card ends before your period of stay. Apply for a new card (renewal) at city hall or via the J-LIS notice", from: windowFrom, by: expiry, where: `${CITY} or the J-LIS renewal notice (有効期限通知書)`, fee: "Free" });
      }
    }
  } else {
    if (expired) {
      verdict = "expired";
      actions.push({ what: "Renew the card (apply for a new one; your number stays the same)", from: null, by: null, where: CITY, fee: "Free (Digital Agency FAQ Q12)" });
    } else {
      verdict = today >= windowFrom ? "renew_window_open" : "ok";
      actions.push({ what: `Renew the card. Renewing from ${windowFrom} (fewer than 3 months left) makes the new card run to your ${adult ? 11 : 6}th birthday after it is made`, from: windowFrom, by: expiry, where: `${CITY}; J-LIS mails a notice (有効期限通知書) about 2-3 months before`, fee: "Free" });
      if (holder !== "japanese" && cardExpiryIn && cardExpiryIn < assumed) warnings.push(`Your card shows ${cardExpiryIn}, earlier than the ${assumed} a ${HOLDER_LABEL[holder].en.split(" (")[0].toLowerCase()} gets. If you became ${holder === "spr" ? "a special permanent resident" : holder === "hsp2" ? "HSP (ii)" : "a permanent resident"} after the card was made, ask city hall BEFORE ${cardExpiryIn} to extend it to ${assumed} (art. 27(2)(i)).`);
    }
    if (specificCard && (holder === "permanent" || holder === "hsp2" || holder === "spr")) warnings.push("With a 特定在留カード / 特定特別永住者証明書 the J-LIS renewal notice cannot renew the combined card; ISA says to apply at a regional immigration office if you want to keep the combined card (ISA Q6-2).");
  }

  // ---- e-certificate ----
  const ecertFive = nthBirthdayAfter(birthDate, cardIssueDate, 5 + (issuedAsRenewal ? 1 : 0));
  const ecertExpiry = ecertExpiryIn ?? minDate(ecertFive, expiry);
  const ecertBasis = ecertExpiryIn
    ? "The e-certificate expiry you entered (from the J-LIS notice or Mynaportal)."
    : ecertFive <= expiry
      ? `${5 + (issuedAsRenewal ? 1 : 0)}th birthday after issue (assumes the e-certificates were issued with the card).`
      : "Capped at the card's expiry date.";
  const ecertRenewFrom = renewFrom(ecertExpiry);
  const graceEnd = insuranceGraceEnd(ecertExpiry);
  const ecertStatus: CheckResult["ecert"]["status"] = today > ecertExpiry ? (today <= graceEnd ? "expired_in_grace" : "expired") : today >= ecertRenewFrom ? "renew_window_open" : "valid";
  if (!expired && ecertExpiry < expiry) {
    actions.push({ what: "Renew the electronic certificates (利用者証明用 / 署名用 電子証明書) used for マイナ保険証, Mynaportal and convenience-store certificates", from: ecertRenewFrom, by: ecertExpiry, where: CITY, fee: "Free" });
  }
  if (holder === "mid_long" && newExpiryAfterAction) warnings.push("When the card's date is extended, ask the counter to renew your electronic certificates at the same visit; the certificate date does not follow the card on its own (practice varies by city).");
  if (ecertStatus === "expired_in_grace") warnings.push(`Your e-certificate expired on ${ecertExpiry}. マイナ保険証 still works until ${graceEnd} (insurance eligibility only, no medical or medicine history shared). Renew before then to avoid re-registering.`);
  if (ecertStatus === "expired") warnings.push(`Your e-certificate expired on ${ecertExpiry} and the マイナ保険証 grace ended ${graceEnd}. Renew at city hall; until then use the 資格確認書 your insurer sends.`);

  // ---- PR / HSP2 residence card ----
  let residenceCard: CheckResult["residenceCard"] = null;
  if (residenceCardExpiry && (holder === "permanent" || holder === "hsp2")) {
    residenceCard = {
      expiry: residenceCardExpiry,
      renewFrom: addMonths(residenceCardExpiry, -3),
      note: "Your status has no expiry, but the residence card itself does: cards issued by 2026-06-13 ran 7 years; cards issued from 2026-06-14 run to the 10th birthday after issue (5th if under 18). Renew at the regional immigration office from 3 months before; it is free. This is separate from the My Number Card.",
    };
    actions.push({ what: "Renew the residence card itself (在留カードの有効期間の更新申請)", from: residenceCard.renewFrom, by: residenceCardExpiry, where: "Regional immigration office (ISA)", fee: "Free" });
  }

  if (!adult) warnings.push(`You were under ${adultAgeLine} when the card was made, so the 5-year rule applies${holder === "mid_long" ? " (or the period of stay if sooner)" : ""}.`);
  if (adultAgeLine === 20 && ageAtIssue >= 18 && ageAtIssue < 20) warnings.push("Cards made before 2022-04-01 used age 20 as the line (18 from 2022-04-01), so yours is a 5-year card.");

  actions.sort((a, b) => (a.by ?? "9999") < (b.by ?? "9999") ? -1 : 1);

  const daysTxt = (d: string) => `${daysBetween(today, d)} day(s) from ${today}`;
  let summary: string;
  if (verdict === "expired") summary = `Your My Number Card expired on ${expiry}.${holder === "mid_long" ? " It can no longer be extended: apply for a new card." : " Renew it at city hall (free)."}`;
  else if (verdict === "extend_before_expiry" && renewal === "pending") summary = `Go to city hall by ${expiry} (${daysTxt(expiry)}) with proof your application is pending: the card can be extended once, to ${specialExtension!.extendTo}.`;
  else if (verdict === "extend_before_expiry" && renewal === "granted") summary = `Extend the card at city hall by ${expiry} (${daysTxt(expiry)}); it can then run to ${newExpiryAfterAction}.`;
  else if (verdict === "extend_before_expiry") summary = `Your card ends with your period of stay on ${expiry} (${daysTxt(expiry)}). Renew the visa, then extend the card at city hall before that date.`;
  else if (verdict === "no_action_needed") summary = `Your new 特定在留カード already carries the new date (${newExpiryAfterAction}) for the My Number function.`;
  else if (verdict === "renew_window_open") summary = `Renewal is open now: renew by ${expiry} (${daysTxt(expiry)}), free at city hall.`;
  else summary = `Your card is valid until ${expiry} (${daysTxt(expiry)}).${holder === "mid_long" ? " It ends with your period of stay and does not extend automatically." : ` You can renew from ${windowFrom}.`}`;

  return {
    verdict,
    summary,
    holder,
    holderLabel: HOLDER_LABEL[holder].en,
    ageAtIssue,
    adultAgeLine,
    card: {
      expiry,
      expiryBasis,
      daysLeft,
      renewFrom: holder === "mid_long" && residenceExpiry && expiry === residenceExpiry ? null : windowFrom,
      maxExtendableTo: assumed,
      maxExtendableBasis: holder === "mid_long" ? `A foreign resident's card can be extended up to the ${assumedBasis.charAt(0).toLowerCase()}${assumedBasis.slice(1)}` : assumedBasis,
      newExpiryAfterAction,
    },
    specialExtension,
    ecert: { expiry: ecertExpiry, basis: ecertBasis, renewFrom: ecertRenewFrom, status: ecertStatus, insuranceGraceEnds: graceEnd },
    residenceCard,
    actions,
    warnings,
    rulesAsOf: RULES_AS_OF,
    today,
    sources: SOURCES,
  };
}

export const RULES = {
  rulesAsOf: RULES_AS_OF,
  japaneseAndPermanent: {
    law: "個人番号カード等に関する命令 art. 26, 29",
    card: "Valid to the 10th birthday after the card is made (5th if under 18 on that day; for cards made by 2022-03-31 the line was 20). Feb 29 birthdays count as Feb 28 in non-leap years.",
    renewal: "Renew from the day fewer than 3 months remain (e.g. expiry 2026-10-01 → from 2026-07-02). A card made in that window runs to the 11th birthday (6th if under 18). Free, also after expiry (Digital Agency FAQ Q12).",
    appliesTo: ["Japanese nationals", "Permanent residents", "Highly Skilled Professional (ii)", "Special permanent residents"],
  },
  foreignResidentsWithPeriodOfStay: {
    law: "個人番号カード等に関する命令 art. 27",
    card: "Valid to the period-of-stay expiry on the residence card (under 18: that date or the 5th birthday, whichever is first). It does NOT extend automatically when the visa is renewed, and no reminder is sent.",
    extension: "After a renewal / change is granted, the city extends the card to the new period of stay, up to the 10th birthday after the card was made (5th if a minor at issue). Must be done before the card expires; free.",
    specialExtension: "If the application is still pending, the city can extend the card once, to the end of the 2-month special period (expiry + 2 months), with proof (更新申請中 stamp, online completion email or receipt). Then extend again when the new card arrives.",
    lapsed: "A lapsed card cannot be extended; apply for a new card (reissue fees apply in some cities, e.g. Matsudo ¥1,000).",
    becomingPermanent: "On becoming a permanent resident / HSP (ii) / SPR, the card can be extended to the 10th-birthday date (art. 27(2)(i)).",
  },
  specificResidenceCard: {
    since: "2026-06-14",
    rule: "特定在留カード combines the residence card and My Number Card. Optional, counter-only (not via online residence applications), about 10 days longer to issue. When ISA grants a renewal and issues a new 特定在留カード, no city-hall visit is needed. While a decision is pending, the My Number function still ends on the original period-of-stay date: extend it at city hall before then. Request it again at every ISA procedure to keep it.",
  },
  ecertificates: {
    rule: "Electronic certificates run to the 5th birthday after issue (6th if renewed in the last-3-months window), never past the card's expiry. Renew free at city hall from 3 months before.",
    myNaHokenshoGrace: "After the user-authentication certificate expires, マイナ保険証 still works until the end of the 3rd month after the month it expired (insurance eligibility only). Expiry 2026-11-10 → usable to 2027-02-28. After that a 資格確認書 is issued.",
  },
  permanentResidenceCard: {
    rule: "PR / HSP (ii) residence cards: issued by 2026-06-13 = 7 years; from 2026-06-14 = 10th birthday after issue (5th if under 18). Renew at ISA from 3 months before expiry; free.",
  },
  sources: SOURCES,
  disclaimer: DISCLAIMER,
};
