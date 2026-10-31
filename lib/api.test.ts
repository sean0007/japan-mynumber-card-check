import assert from "node:assert/strict";
import test from "node:test";
import { apiHandler, openapiDoc, preflight } from "./agent-api";
import { API_DISCLAIMER, API_INFO, ENDPOINTS, EXAMPLE_GET, PUBLIC_URL } from "./api";

const e = ENDPOINTS.check;
const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });

test(`GET ${EXAMPLE_GET} → extend by 2026-12-15 to 2027-02-15`, async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${EXAMPLE_GET}&today=2026-10-29`));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const body = await res.json();
  assert.equal(body.disclaimer, API_DISCLAIMER);
  assert.equal(body.verdict, "extend_before_expiry");
  assert.equal(body.specialExtension.extendTo, "2027-02-15");
  assert.ok(body.sources.length);
});

test("POST JSON body matches GET", async () => {
  const url = new URL(`${PUBLIC_URL}${EXAMPLE_GET}&today=2026-10-29`);
  const post = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(url.searchParams)) }));
  const get = await handler(new Request(url));
  assert.equal(post.status, 200);
  assert.deepEqual(await post.json(), await get.json());
});

test("aliases", async () => {
  const b = await (await handler(new Request(`${PUBLIC_URL}${e.path}?holder=citizen&dob=1985-01-20&issueDate=2017-02-01&today=2026-10-29`))).json();
  assert.equal(b.holder, "japanese");
  assert.equal(b.card.expiry, "2027-01-20");
  const x = await (await handler(new Request(`${PUBLIC_URL}${e.path}?holder=student&birthDate=1999-09-09&cardIssueDate=2025-04-01&visaExpiry=2027-04-01&renewal=approved&newExpiry=2028-04-01&tokutei=true&today=2027-03-01`))).json();
  assert.equal(x.holder, "mid_long");
  assert.equal(x.verdict, "no_action_needed");
  const j = await (await handler(new Request(`${PUBLIC_URL}${e.path}?holder=${encodeURIComponent("永住者")}&birthDate=1980-07-07&cardIssueDate=2022-07-01&today=2026-10-29`))).json();
  assert.equal(j.holder, "permanent");
});

test("bad inputs → 400 with example", async () => {
  for (const q of ["birthDate=1990-01-01&cardIssueDate=2023-01-10", "holder=alien&birthDate=1990-01-01&cardIssueDate=2023-01-10", "holder=mid_long&birthDate=1990-01-01&cardIssueDate=2023-01-10", "holder=japanese&birthDate=1990-13-01&cardIssueDate=2023-01-10", "holder=mid_long&birthDate=1990-01-01&cardIssueDate=2023-01-10&residenceExpiry=2027-01-01&renewal=rocket", "holder=japanese&birthDate=1990-01-01"]) {
    const res = await handler(new Request(`${PUBLIC_URL}${e.path}?${q}`));
    assert.equal(res.status, 400, q);
    const body = await res.json();
    assert.equal(body.disclaimer, API_DISCLAIMER);
    assert.ok(body.example);
  }
});

test("malformed JSON body → 400", async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{nope" }));
  assert.equal(res.status, 400);
});

test("OPTIONS preflight is CORS open", () => {
  const res = preflight();
  assert.equal(res.status, 204);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("OpenAPI lists /api/check GET and POST", () => {
  const spec = openapiDoc(API_INFO, PUBLIC_URL, [e]) as { openapi: string; paths: Record<string, { get: { parameters: { name: string }[] }; post: unknown }> };
  assert.ok(spec.openapi.startsWith("3."));
  assert.ok(spec.paths["/api/check"]?.post);
  assert.ok(spec.paths["/api/check"].get.parameters.find((p) => p.name === "cardIssueDate"));
});

test("future cardIssueDate → 400 'issue date is in the future' with example + disclaimer", async () => {
  for (const q of ["holder=japanese&birthDate=1990-01-01&cardIssueDate=2030-01-01", "holder=mid_long&birthDate=1992-04-10&cardIssueDate=2026-11-01&residenceExpiry=2026-12-15&today=2026-10-31", "holder=permanent&birthDate=1990-07-07&cardIssueDate=2024-01-01&today=2023-12-31"]) {
    const res = await handler(new Request(`${PUBLIC_URL}${e.path}?${q}`));
    assert.equal(res.status, 400, q);
    const body = await res.json();
    assert.match(body.error, /issue date is in the future/);
    assert.equal(body.disclaimer, API_DISCLAIMER);
    assert.ok(body.example);
    assert.equal(body.verdict, undefined);
  }
  // issued today is fine
  const ok = await handler(new Request(`${PUBLIC_URL}${e.path}?holder=japanese&birthDate=1990-01-01&cardIssueDate=2026-10-31&today=2026-10-31`));
  assert.equal(ok.status, 200);
});
