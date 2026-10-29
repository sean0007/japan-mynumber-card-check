# Japan My Number Card Expiry Check

Free checker for when a Japan My Number Card (マイナンバーカード) expires and what to do before then: foreign residents' cards end with the period of stay and are not extended by a visa renewal (city-hall extension deadline, one-time 2-month extension while a renewal is pending, 10th-birthday cap), the 10th / 5th-birthday rule and renewal window for Japanese, PR and SPR holders, e-certificates, the マイナ保険証 grace and the 特定在留カード.

Live: https://japan-mynumber-card-check.vercel.app

- API: `GET /api/check?holder=mid_long&birthDate=1992-04-10&cardIssueDate=2024-03-01&residenceExpiry=2026-12-15&renewal=pending` (keyless, CORS open), `/api/rules`, `/openapi.json`, `/llms.txt`
- MCP: `japan_my_number_card_expiry_check` on https://free-agent-tools.vercel.app/mcp

Sources: 個人番号カード等に関する命令 art. 26, 27, 29 (e-Gov), Digital Agency, ISA (特定在留カード, residence-card renewal), Mynaportal FAQ 10178, MHLW, Matsudo City. Rules as of 2026-10-29.

**Disclaimer:** educational, not legal advice, not affiliated with the Digital Agency, J-LIS, ISA or any city office. The date on your card counts; confirm with your city office.
