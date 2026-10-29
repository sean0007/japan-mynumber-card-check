import { ImageResponse } from "next/og";
import { EXAMPLE_SHARED, parseShared, safeCheck } from "@/lib/share";

const LABEL: Record<string, string> = { ok: "Valid until", no_action_needed: "Valid until", renew_window_open: "Renew by", extend_before_expiry: "Act at city hall by", expired: "Expired on" };

export async function GET(req: Request) {
  const shared = parseShared(new URL(req.url).searchParams) ?? EXAMPLE_SHARED;
  const r = safeCheck(shared) ?? safeCheck(EXAMPLE_SHARED)!;
  const bad = r.verdict === "expired";
  const stats = [
    { label: r.specialExtension ? "one-time extension to" : r.card.newExpiryAfterAction ? "after extension" : "max extendable to", value: r.specialExtension?.extendTo ?? r.card.newExpiryAfterAction ?? r.card.maxExtendableTo },
    { label: "e-certificate", value: r.ecert.expiry },
    { label: "マイナ保険証 grace to", value: r.ecert.insuranceGraceEnds },
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f0b429" }}>My Number Card Expiry Check</div>
          <div style={{ display: "flex", fontSize: 22, color: "#9b9588" }}>rules as of {r.rulesAsOf}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 34, color: "#c9c3b6" }}>{LABEL[r.verdict]}</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 104, fontWeight: 800, letterSpacing: "-0.03em", color: bad ? "#fca5a5" : r.verdict === "ok" || r.verdict === "no_action_needed" ? "#99f6e4" : "#fde68a", lineHeight: 1.05 }}>{r.card.expiry}</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 30, color: "#f0b429", maxWidth: 1070 }}>{r.holderLabel.split(" (")[0]}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", flex: 1, border: "2px solid #23252c", borderRadius: 24, padding: "14px 20px", background: "#101218" }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: "#f3efe4" }}>{s.value}</span>
              <span style={{ fontSize: 20, color: "#9b9588" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#6f6a60" }}>
          <span>japan-mynumber-card-check.vercel.app · free, no login</span>
          <span>Educational, not legal advice. Not affiliated with any agency.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
