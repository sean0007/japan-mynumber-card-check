import { HOLDERS, RENEWALS, checkCard, validDate, type CheckInput, type Holder, type Renewal } from "./card";

export const PUBLIC_URL = "https://japan-mynumber-card-check.vercel.app";

/** Share links: /r?h=mid_long&b=1992-04-10&i=2024-03-01&e=2026-12-15[&p=pending][&n=newExpiry][&k=1][&t=today] */
type Params = URLSearchParams | Record<string, string | string[] | undefined>;
function one(p: Params, key: string): string | undefined {
  if (p instanceof URLSearchParams) return p.get(key) ?? undefined;
  const v = p[key];
  return Array.isArray(v) ? v[0] : v;
}
function date(p: Params, key: string): string | null {
  const v = one(p, key);
  return v && validDate(v) ? v : null;
}

export type Shared = { holder: Holder; birthDate: string; cardIssueDate: string; residenceExpiry: string | null; renewal: Renewal; newResidenceExpiry: string | null; specificCard: boolean; today: string | null };

export const EXAMPLE_SHARED: Shared = { holder: "mid_long", birthDate: "1992-04-10", cardIssueDate: "2024-03-01", residenceExpiry: "2026-12-15", renewal: "pending", newResidenceExpiry: null, specificCard: false, today: "2026-10-29" };
export const EXAMPLE_GRANTED: Shared = { holder: "mid_long", birthDate: "1992-04-10", cardIssueDate: "2024-03-01", residenceExpiry: "2026-12-15", renewal: "granted", newResidenceExpiry: "2031-12-15", specificCard: false, today: "2026-10-29" };
export const EXAMPLE_JP: Shared = { holder: "japanese", birthDate: "1985-01-20", cardIssueDate: "2017-02-01", residenceExpiry: null, renewal: "none", newResidenceExpiry: null, specificCard: false, today: "2026-10-29" };

export function parseShared(p: Params): Shared | null {
  const holder = one(p, "h");
  const b = date(p, "b");
  const i = date(p, "i");
  if (!holder || !(HOLDERS as readonly string[]).includes(holder) || !b || !i) return null;
  const renewal = one(p, "p") ?? "none";
  return {
    holder: holder as Holder,
    birthDate: b,
    cardIssueDate: i,
    residenceExpiry: date(p, "e"),
    renewal: ((RENEWALS as readonly string[]).includes(renewal) ? renewal : "none") as Renewal,
    newResidenceExpiry: date(p, "n"),
    specificCard: one(p, "k") === "1",
    today: date(p, "t"),
  };
}

export function sharedQuery(s: Shared): string {
  const q = new URLSearchParams();
  q.set("h", s.holder);
  q.set("b", s.birthDate);
  q.set("i", s.cardIssueDate);
  if (s.residenceExpiry) q.set("e", s.residenceExpiry);
  if (s.renewal !== "none") q.set("p", s.renewal);
  if (s.newResidenceExpiry) q.set("n", s.newResidenceExpiry);
  if (s.specificCard) q.set("k", "1");
  if (s.today) q.set("t", s.today);
  return q.toString();
}

export function toCheckInput(s: Shared): CheckInput {
  return { ...s };
}
export function safeCheck(s: Shared) {
  try {
    return checkCard(toCheckInput(s));
  } catch {
    return null;
  }
}
export function resultPath(s: Shared): string {
  return `/r?${sharedQuery(s)}`;
}
export function ogPath(s: Shared): string {
  return `/og?${sharedQuery(s)}`;
}
export function isIndexable(s: Shared): boolean {
  return [EXAMPLE_SHARED, EXAMPLE_GRANTED, EXAMPLE_JP].some((e) => resultPath(e) === resultPath(s));
}
