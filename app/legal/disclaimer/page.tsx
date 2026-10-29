import type { Metadata } from "next";
import { RULES_AS_OF, SOURCES } from "@/lib/card";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer", description: DISCLAIMER_SHORT };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Read this</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Disclaimer</h1>
      <p className="mt-4 text-lg text-foreground">{DISCLAIMER_SHORT}</p>
      <p className="mt-2 text-muted">{HONESTY}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">What this is</h2>
          <p className="mt-2">
            A free educational date calculator. It applies a dated reading (as of {RULES_AS_OF}) of the My Number Card ordinance (個人番号カード等に関する命令, 総務省令第85号: art. 26 validity, art. 27 foreign residents, art. 29 renewal window), the Digital Agency&apos;s expiry FAQ, the Immigration Services Agency&apos;s pages on the 特定在留カード and residence-card renewal, the Mynaportal FAQ on the マイナ保険証 grace period and city guidance (e.g. Matsudo) to the dates you enter.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">What it is not</h2>
          <p className="mt-2">
            It is not legal advice and is not affiliated with the Digital Agency, J-LIS (Japan Agency for Local Authority Information Systems), the Immigration Services Agency of Japan, the Ministry of Health, Labour and Welfare or any city or ward office. It cannot see your card, your electronic certificates or whether an immigration application is really pending. The date printed on your card, the J-LIS notice and your city office are what count. Documents, fees for new cards and counter hours differ by city. If your card lapses, use another ID and ask your city office; for health insurance, use the 資格確認書 your insurer sends.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">How dates are counted</h2>
          <p className="mt-2">
            The &quot;10th birthday after the card was made&quot; means the 10th birthday falling after the issue date (a birthday on the issue day itself is not counted). A February 29 birthday counts as February 28 in non-leap years. Renewal opens on the first day fewer than 3 months remain (expiry 2026-10-01 → from 2026-07-02). The 2-month special period ends on the same day two months after the period-of-stay expiry (or the month&apos;s last day). The マイナ保険証 grace runs to the end of the 3rd month after the month the e-certificate expired.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SOURCES.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Your data</h2>
          <p className="mt-2">The dates you enter stay in your browser (or in a share link you create). No login, no names, no card numbers, no database. Never type your My Number (個人番号) into any website like this; it is not needed.</p>
        </section>
      </div>
    </div>
  );
}
