"use client";

import { useState } from "react";
import { CardDisclaimer } from "@/components/card-disclaimer";
import { ShareBar } from "@/components/share-bar";
import { HOLDERS, HOLDER_LABEL, type Holder, type Renewal } from "@/lib/card";
import { EXAMPLE_SHARED, PUBLIC_URL, resultPath, safeCheck, type Shared } from "@/lib/share";

const field = "mt-2 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber";

const VERDICT_STYLE: Record<string, string> = {
  ok: "text-teal-200",
  no_action_needed: "text-teal-200",
  renew_window_open: "text-amber-200",
  extend_before_expiry: "text-amber-200",
  expired: "text-red-300",
};
const VERDICT_LABEL: Record<string, string> = {
  ok: "Valid",
  no_action_needed: "No city-hall visit needed",
  renew_window_open: "Renewal open now",
  extend_before_expiry: "Act before it expires",
  expired: "Expired",
};
const ECERT_LABEL: Record<string, string> = {
  valid: "valid",
  renew_window_open: "renewal open",
  expired_in_grace: "expired (マイナ保険証 grace)",
  expired: "expired",
};

export function Calculator({ initial }: { initial?: Shared }) {
  const start = initial ?? EXAMPLE_SHARED;
  const [holder, setHolder] = useState<Holder>(start.holder);
  const [birthDate, setBirth] = useState(start.birthDate);
  const [cardIssueDate, setIssue] = useState(start.cardIssueDate);
  const [residenceExpiry, setResExp] = useState(start.residenceExpiry ?? "");
  const [renewal, setRenewal] = useState<Renewal>(start.renewal);
  const [newResidenceExpiry, setNewExp] = useState(start.newResidenceExpiry ?? "");
  const [specificCard, setSpecific] = useState(start.specificCard);
  const [today, setToday] = useState(start.today ?? "");

  const mid = holder === "mid_long";
  const shared: Shared = {
    holder,
    birthDate,
    cardIssueDate,
    residenceExpiry: mid && residenceExpiry ? residenceExpiry : null,
    renewal: mid ? renewal : "none",
    newResidenceExpiry: mid && renewal === "granted" && newResidenceExpiry ? newResidenceExpiry : null,
    specificCard: holder !== "japanese" && specificCard,
    today: today || null,
  };
  const r = birthDate && cardIssueDate ? safeCheck(shared) : null;
  const shareUrl = `${PUBLIC_URL}${resultPath(shared)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
      <div className="rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Your card</p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">You are</span>
          <select data-testid="holder" className={field} value={holder} onChange={(e) => setHolder(e.target.value as Holder)}>
            {HOLDERS.map((h) => (
              <option key={h} value={h}>
                {HOLDER_LABEL[h].en}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Date of birth</span>
          <input data-testid="birth" type="date" className={field} value={birthDate} onChange={(e) => setBirth(e.target.value)} />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Card issue date (発行日 on the card)</span>
          <input data-testid="issue" type="date" className={field} value={cardIssueDate} onChange={(e) => setIssue(e.target.value)} />
        </label>
        {mid ? (
          <>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-foreground">Period of stay expires (在留期限, the date your My Number Card was set to)</span>
              <input data-testid="resexp" type="date" className={field} value={residenceExpiry} onChange={(e) => setResExp(e.target.value)} />
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-foreground">Visa renewal or change of status</span>
              <select data-testid="renewal" className={field} value={renewal} onChange={(e) => setRenewal(e.target.value as Renewal)}>
                <option value="none">Not applied yet</option>
                <option value="pending">Applied, no decision yet (申請中)</option>
                <option value="granted">Granted, new residence card received</option>
              </select>
            </label>
            {renewal === "granted" ? (
              <label className="mt-4 block">
                <span className="text-sm font-medium text-foreground">New period-of-stay expiry</span>
                <input data-testid="newexp" type="date" className={field} value={newResidenceExpiry} onChange={(e) => setNewExp(e.target.value)} />
              </label>
            ) : null}
          </>
        ) : null}
        {holder !== "japanese" ? (
          <label className="mt-4 flex items-start gap-2 text-sm text-foreground">
            <input type="checkbox" className="mt-1" checked={specificCard} onChange={(e) => setSpecific(e.target.checked)} />
            <span>I have a combined 特定在留カード / 特定特別永住者証明書 (residence card with the My Number function, since 2026-06-14)</span>
          </label>
        ) : null}
        <label className="mt-4 block">
          <span className="text-sm font-medium text-muted">Check as of (optional, default today)</span>
          <input type="date" className={field} value={today} onChange={(e) => setToday(e.target.value)} />
        </label>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-panel/60">
        <div className="p-5 sm:p-7" data-testid="result">
          {r ? (
            <>
              <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">{VERDICT_LABEL[r.verdict]} · card expires</p>
              <p className={`mt-2 font-display text-5xl tracking-tight sm:text-6xl ${VERDICT_STYLE[r.verdict]}`}>{r.card.expiry}</p>
              <p className="mt-3 text-base text-foreground">{r.summary}</p>
              <p className="mt-2 text-sm text-muted">{r.card.expiryBasis}</p>
              {r.specialExtension ? (
                <div className="mt-4 rounded-2xl border border-amber/30 bg-amber/5 p-4 text-sm text-amber-100">
                  <p className="font-semibold">One-time extension to {r.specialExtension.extendTo}: apply by {r.specialExtension.mustApplyBy}</p>
                  <p className="mt-1 leading-relaxed">{r.specialExtension.note}</p>
                </div>
              ) : null}
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                {r.card.newExpiryAfterAction ? (
                  <div className="rounded-2xl border border-line p-3"><dt className="text-muted">Card after extension</dt><dd className="font-mono text-foreground">{r.card.newExpiryAfterAction}</dd></div>
                ) : null}
                <div className="rounded-2xl border border-line p-3"><dt className="text-muted">Longest the card can be extended</dt><dd className="font-mono text-foreground">{r.card.maxExtendableTo}</dd></div>
                <div className="rounded-2xl border border-line p-3"><dt className="text-muted">E-certificate ({ECERT_LABEL[r.ecert.status]})</dt><dd className="font-mono text-foreground">{r.ecert.expiry}</dd></div>
                <div className="rounded-2xl border border-line p-3"><dt className="text-muted">マイナ保険証 works until (if not renewed)</dt><dd className="font-mono text-foreground">{r.ecert.insuranceGraceEnds}</dd></div>
              </dl>
              {r.actions.length ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-foreground">What to do, by when</h3>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
                    {r.actions.map((a) => (
                      <li key={a.what} className="rounded-2xl border border-line p-3">
                        <p className="text-foreground">{a.what}</p>
                        <p className="mt-1 font-mono text-xs">{a.from ? `from ${a.from} · ` : ""}{a.by ? `by ${a.by} · ` : ""}{a.where} · {a.fee}</p>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {r.warnings.length ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-foreground">Watch out</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {r.warnings.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <div className="mt-6">
                <ShareBar url={shareUrl} text={`My Number Card: ${VERDICT_LABEL[r.verdict].toLowerCase()} (expires ${r.card.expiry})`} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Enter your date of birth, the card&apos;s issue date{mid ? " and your period-of-stay expiry" : ""}{mid && renewal === "granted" ? " and the new expiry" : ""} to see your dates.</p>
          )}
        </div>
        <CardDisclaimer />
      </div>
    </div>
  );
}
