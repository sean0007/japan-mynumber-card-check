import assert from "node:assert/strict";
import test from "node:test";
import { RuleInputError, ageOn, checkCard, insuranceGraceEnd, nthBirthdayAfter, periodEnd, renewFrom } from "./card";

test("date helpers", () => {
  assert.equal(renewFrom("2026-10-01"), "2026-07-02"); // Hamamatsu example
  assert.equal(insuranceGraceEnd("2026-11-10"), "2027-02-28");
  assert.equal(insuranceGraceEnd("2026-12-15"), "2027-03-31");
  assert.equal(nthBirthdayAfter("2000-02-29", "2016-05-01", 10), "2026-02-28");
  assert.equal(nthBirthdayAfter("1990-06-01", "2020-06-01", 10), "2030-06-01"); // birthday on issue day not counted
  assert.equal(periodEnd("2026-12-15", 2), "2027-02-15");
  assert.equal(periodEnd("2026-12-30", 2), "2027-02-28");
  assert.equal(ageOn("2004-10-29", "2022-10-29"), 18);
  assert.equal(ageOn("2004-10-29", "2022-10-28"), 17);
});

test("Japanese adult: 10th birthday, renewal window open", () => {
  const r = checkCard({ holder: "japanese", birthDate: "1985-01-20", cardIssueDate: "2017-02-01", today: "2026-10-29" });
  assert.equal(r.card.expiry, "2027-01-20");
  assert.equal(r.card.renewFrom, "2026-10-21");
  assert.equal(r.verdict, "renew_window_open");
  assert.equal(r.ecert.expiry, "2022-01-20");
  assert.equal(r.ecert.status, "expired");
});

test("pre-2022 card for a 19-year-old is a 5-year card (age line 20)", () => {
  const r = checkCard({ holder: "japanese", birthDate: "2002-05-05", cardIssueDate: "2021-06-01", today: "2026-01-01" });
  assert.equal(r.adultAgeLine, 20);
  assert.equal(r.card.expiry, "2026-05-05");
  const r2 = checkCard({ holder: "japanese", birthDate: "2004-05-05", cardIssueDate: "2023-06-01", today: "2026-01-01" });
  assert.equal(r2.card.expiry, "2033-05-05");
});

test("renewed in the window → 11th birthday", () => {
  const r = checkCard({ holder: "permanent", birthDate: "1980-07-07", cardIssueDate: "2026-05-10", issuedAsRenewal: true, today: "2026-10-29" });
  assert.equal(r.card.expiry, "2036-07-07");
  assert.equal(r.ecert.expiry, "2031-07-07");
});

test("foreign resident: card = residence expiry, pending → one-time 2-month extension", () => {
  const r = checkCard({ holder: "mid_long", birthDate: "1992-04-10", cardIssueDate: "2024-03-01", residenceExpiry: "2026-12-15", renewal: "pending", today: "2026-10-29" });
  assert.equal(r.card.expiry, "2026-12-15");
  assert.equal(r.verdict, "extend_before_expiry");
  assert.equal(r.specialExtension?.extendTo, "2027-02-15");
  assert.equal(r.specialExtension?.mustApplyBy, "2026-12-15");
  assert.equal(r.card.maxExtendableTo, "2033-04-10");
  assert.equal(r.ecert.expiry, "2026-12-15");
  assert.equal(r.ecert.insuranceGraceEnds, "2027-03-31");
  assert.ok(r.warnings.some((w) => w.includes("Banks")));
});

test("foreign resident: granted → extend before old date, capped at 10th birthday", () => {
  const r = checkCard({ holder: "mid_long", birthDate: "1992-04-10", cardIssueDate: "2024-03-01", residenceExpiry: "2026-12-15", renewal: "granted", newResidenceExpiry: "2034-01-01", today: "2026-10-29" });
  assert.equal(r.card.newExpiryAfterAction, "2033-04-10");
  assert.equal(r.actions[0].by, "2026-12-15");
  assert.ok(r.warnings.some((w) => w.includes("2033-04-10")));
});

test("特定在留カード granted → no city hall; pending → still must extend", () => {
  const g = checkCard({ holder: "mid_long", birthDate: "1992-04-10", cardIssueDate: "2026-07-01", residenceExpiry: "2027-03-01", renewal: "granted", newResidenceExpiry: "2030-03-01", specificCard: true, today: "2027-02-01" });
  assert.equal(g.verdict, "no_action_needed");
  const p = checkCard({ holder: "mid_long", birthDate: "1992-04-10", cardIssueDate: "2026-07-01", residenceExpiry: "2027-03-01", renewal: "pending", specificCard: true, today: "2027-02-01" });
  assert.equal(p.verdict, "extend_before_expiry");
  assert.ok(p.warnings.some((w) => w.includes("Q5-3")));
});

test("foreign resident under 18: earlier of period and 5th birthday", () => {
  const r = checkCard({ holder: "mid_long", birthDate: "2015-03-03", cardIssueDate: "2024-01-10", residenceExpiry: "2032-01-01", today: "2026-10-29" });
  assert.equal(r.card.expiry, "2028-03-03");
  assert.equal(r.verdict, "ok");
});

test("lapsed foreign card → expired, not extendable", () => {
  const r = checkCard({ holder: "mid_long", birthDate: "1990-01-01", cardIssueDate: "2023-01-10", residenceExpiry: "2026-09-30", renewal: "granted", newResidenceExpiry: "2029-09-30", today: "2026-10-29" });
  assert.equal(r.verdict, "expired");
});

test("PR residence card window + PR whose card shows the old residence date", () => {
  const r = checkCard({ holder: "permanent", birthDate: "1980-07-07", cardIssueDate: "2022-07-01", cardExpiry: "2027-01-31", residenceCardExpiry: "2027-06-30", today: "2026-10-29" });
  assert.equal(r.residenceCard?.renewFrom, "2027-03-30");
  assert.ok(r.warnings.some((w) => w.includes("art. 27(2)(i)") && w.includes("2031-07-07")));
});

test("input errors", () => {
  assert.throws(() => checkCard({ holder: "mid_long", birthDate: "1990-01-01", cardIssueDate: "2023-01-10" }), RuleInputError);
  assert.throws(() => checkCard({ holder: "japanese", birthDate: "1990-01-01", cardIssueDate: "2015-01-10" }), RuleInputError);
  assert.throws(() => checkCard({ holder: "japanese", birthDate: "1990-01-01", cardIssueDate: "2023-02-30" }), RuleInputError);
  assert.throws(() => checkCard({ holder: "mid_long", birthDate: "1990-01-01", cardIssueDate: "2023-01-10", residenceExpiry: "2026-12-01", renewal: "granted", today: "2026-10-29" }), RuleInputError);
});
