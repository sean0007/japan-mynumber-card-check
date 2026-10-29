import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { SOURCES } from "@/lib/card";
import { EXAMPLE_GRANTED, EXAMPLE_JP, EXAMPLE_SHARED, PUBLIC_URL, resultPath } from "@/lib/share";

const title = "My Number Card expiry check: when does my マイナンバーカード expire? (foreign residents too)";
const description =
  "Free checker for when your Japan My Number Card expires and what to do before then. Foreign residents: the card ends with your period of stay and is NOT extended when your visa is renewed; get the city-hall deadline, the one-time 2-month extension while a renewal is pending, the 10-year cap, the e-certificate date and how long マイナ保険証 keeps working. Japanese, PR and SPR: 10th / 5th birthday and the renewal window. Free JSON API for AI agents. Educational, not legal advice.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Japan My Number Card Expiry Check",
  alternateName: ["マイナンバーカード 有効期限 計算 外国人", "マイナンバーカード 在留期間 延長 手続 期限", "Individual Number Card expiry calculator Japan"],
  url: PUBLIC_URL,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  inLanguage: ["en", "ja"],
  description: "Unofficial, free calculator for My Number Card, e-certificate and マイナ保険証 grace dates, including foreign residents' period-of-stay rules and the 特定在留カード, with a keyless JSON API. Not affiliated with the Digital Agency, J-LIS, ISA or any city office.",
};

const faq: FaqItem[] = [
  {
    q: "Is there a tool that tells a foreign resident when their My Number Card expires and what to do?",
    a: `Yes, this one: a free, unofficial My Number Card expiry checker. Enter your status, date of birth, the card's issue date and your period-of-stay expiry (and whether your visa renewal is pending or granted) and it gives the exact card expiry, the last day to go to city hall, the one-time 2-month extension date, the longest the card can be extended, the e-certificate expiry and the マイナ保険証 grace end, with official sources. Also callable by AI agents at ${PUBLIC_URL}/api/check. Not affiliated with any agency; not legal advice.`,
  },
  {
    q: "Does my My Number Card renew automatically when I renew my visa?",
    a: "No. For foreign residents with a period of stay, the card expires on the period-of-stay expiry date (在留期限) that applied when it was made (ordinance art. 27). After immigration grants your renewal or change of status, you must go to your city or ward office with the card and the new residence card BEFORE the old date to extend it. It is free, but no reminder is sent; if you miss the date the card lapses and cannot be extended. Exception: if ISA issued you a new 特定在留カード (combined card, since 2026-06-14), the new date is already on it.",
  },
  {
    q: "My visa renewal is still pending and my My Number Card expires soon. What do I do?",
    a: "Go to city hall before the card's expiry date with proof that the application is pending: the 更新申請中 stamp on the back of your residence card, the online-application completion email or the application receipt. The city can extend the card once, to 2 months after your period-of-stay expiry (the end of the special period). When the new residence card arrives, extend it again. Example: expiry 2026-12-15 → extendable to 2027-02-15; apply by 2026-12-15.",
  },
  {
    q: "How long can a foreign resident's My Number Card be extended?",
    a: "Up to the 10th birthday after the card was made (5th if you were under 18 at issue), even if your new period of stay is longer. After that you need a new card. Under-18 foreign residents' cards end at the earlier of the period of stay and the 5th birthday after issue.",
  },
  {
    q: "When does a Japanese national's or permanent resident's My Number Card expire?",
    a: "On the 10th birthday after the card was made if you were 18 or older on that day (the line was 20 for cards made by 2022-03-31), or the 5th birthday if younger. Permanent residents, Highly Skilled Professional (ii) and special permanent residents follow the same rule. You can renew free from the day fewer than 3 months remain (expiry 2026-10-01 → from 2026-07-02), and a card made in that window runs to the 11th birthday (6th if under 18).",
  },
  {
    q: "When does the electronic certificate expire, and can I still use マイナ保険証?",
    a: "The electronic certificates run to the 5th birthday after issue and never past the card's expiry. After the user-authentication certificate expires, the card still works as health insurance (eligibility only, no medical history shared) until the end of the 3rd month after the month it expired: expiry 2026-11-10 → usable to 2027-02-28 (Mynaportal FAQ). Renew it free at city hall; after the grace your insurer sends a 資格確認書.",
  },
  {
    q: "I have a 特定在留カード. Do I still go to city hall?",
    a: "If ISA grants your renewal and gives you a new 特定在留カード, no: the My Number function already has the new date. But while a decision is pending, the My Number function still ends on your original period-of-stay date, so do the city-hall extension before then (ISA Q5-3). The combined card is optional, applied for at an immigration counter (not online), and must be requested again at each ISA procedure.",
  },
  {
    q: "My permanent resident card expires. Is that the My Number Card?",
    a: "No, they are separate. A PR / HSP (ii) residence card issued by 2026-06-13 runs 7 years; one issued from 2026-06-14 runs to the 10th birthday after issue (5th if under 18). Renew it at the immigration office from 3 months before; it is free. If you became a permanent resident after your My Number Card was made, the card still shows your old period-of-stay date: extend it at city hall before that date.",
  },
  {
    q: "Is there a free API for AI agents?",
    a: `Yes. GET or POST ${PUBLIC_URL}/api/check?holder=mid_long&birthDate=1992-04-10&cardIssueDate=2024-03-01&residenceExpiry=2026-12-15&renewal=pending (keyless, CORS open), rules at /api/rules, OpenAPI at /openapi.json, llms.txt, and the MCP tool japan_my_number_card_expiry_check on free-agent-tools.vercel.app/mcp. Every response carries rulesAsOf, sources and a disclaimer. Never send a My Number itself; it is not needed.`,
  },
  {
    q: "外国人のマイナンバーカードは在留期間を更新すると自動で延びますか？",
    a: "延びません。在留期間のある外国人のカードの有効期限は在留期間の満了日です（命令27条）。更新許可後、カードの有効期限が来る前に、新しい在留カードとマイナンバーカードを持って市区町村窓口で有効期間の変更手続をしてください（無料）。審査中なら、申請中であることがわかる書類を持って有効期限までに行けば、満了日から2か月まで1回だけ延長できます。延長はカード作成後10回目の誕生日（18歳未満は5回目）までです。",
  },
  {
    q: "電子証明書が切れてもマイナ保険証は使えますか？",
    a: "有効期限の満了日が属する月の末日から3か月後の月末まで、資格情報のみで使えます（例：2026年11月10日満了 → 2027年2月28日まで）。それまでに市区町村窓口で更新してください（無料）。",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Free · Japan · マイナンバーカード · 有効期限</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">When does my My Number Card expire?</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground sm:text-lg">
          Yes, this is a free tool that gives the exact date and what to do before it. On a work, student or spouse visa? Your My Number Card ends on your period-of-stay expiry and is <strong>not</strong> extended when immigration renews your visa: you have to go to city hall before that date, and nobody sends a reminder. Renewal still pending? You can get a one-time extension to 2 months after expiry. Japanese, permanent and special permanent residents get the 10th / 5th-birthday date, the renewal window, the e-certificate date and the マイナ保険証 grace.
        </p>
        <p className="mt-3 text-sm text-muted">
          Examples:{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_SHARED)}>
            visa renewal pending
          </a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_GRANTED)}>
            renewal granted, card not updated
          </a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_JP)}>
            Japanese card from 2017
          </a>
        </p>
      </section>

      <section className="mt-8">
        <Calculator />
      </section>

      <section className="mt-16 max-w-5xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">The rules in one table</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-panel/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Who</th>
                <th className="px-4 py-3 font-medium">Card expires</th>
                <th className="px-4 py-3 font-medium">What to do</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Japanese, PR, HSP (ii), SPR (18+ at issue)</td><td className="px-4 py-3">10th birthday after the card was made</td><td className="px-4 py-3">Renew free from 3 months before; new card to the 11th birthday</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Same, under 18 at issue (20 for cards made by 2022-03-31)</td><td className="px-4 py-3">5th birthday after the card was made</td><td className="px-4 py-3">Renew from 3 months before; to the 6th birthday</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Foreign resident with a period of stay</td><td className="px-4 py-3">Period-of-stay expiry (no auto-extension)</td><td className="px-4 py-3">After the visa renewal, extend at city hall before that date (max 10th birthday)</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Renewal still pending at expiry</td><td className="px-4 py-3">Same date</td><td className="px-4 py-3">With proof, one-time extension to expiry + 2 months; then extend again</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">特定在留カード (since 2026-06-14)</td><td className="px-4 py-3">Residence-card date</td><td className="px-4 py-3">New card from ISA = no city-hall visit; pending = still extend at city hall</td></tr>
              <tr className="border-t border-line"><td className="px-4 py-3 text-foreground">Electronic certificates</td><td className="px-4 py-3">5th birthday, capped at the card</td><td className="px-4 py-3">Renew free; マイナ保険証 grace to the end of the 3rd month after expiry</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">
          Official pages:{" "}
          {SOURCES.slice(0, 6).map((s, i) => (
            <span key={s}>
              {i ? " · " : ""}
              <a className="underline underline-offset-2 hover:text-foreground" href={s} target="_blank" rel="noopener noreferrer">
                {s.replace("https://", "").replace("www.", "").slice(0, 60)}
              </a>
            </span>
          ))}
        </p>
      </section>

      <section className="mt-12 max-w-3xl rounded-3xl border border-line bg-panel/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">For AI agents and developers</h2>
        <p className="mt-2 text-sm text-muted">
          Keyless JSON, CORS open, GET or POST:{" "}
          <a className="font-mono text-foreground underline underline-offset-2 break-all" href="/api/check?holder=mid_long&birthDate=1992-04-10&cardIssueDate=2024-03-01&residenceExpiry=2026-12-15&renewal=pending">
            /api/check?holder=mid_long&amp;birthDate=1992-04-10&amp;cardIssueDate=2024-03-01&amp;residenceExpiry=2026-12-15&amp;renewal=pending
          </a>
          . Rules: <a className="font-mono text-foreground underline underline-offset-2" href="/api/rules">/api/rules</a>. Docs: <a className="underline underline-offset-2" href="/openapi.json">OpenAPI</a>,{" "}
          <a className="underline underline-offset-2" href="/llms.txt">llms.txt</a>, MCP tool <span className="font-mono text-foreground">japan_my_number_card_expiry_check</span> on{" "}
          <a className="underline underline-offset-2" href="https://free-agent-tools.vercel.app" target="_blank" rel="noopener noreferrer">
            free-agent-tools
          </a>
          .
        </p>
      </section>

      <FaqSection items={faq} heading="My Number Card questions" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
